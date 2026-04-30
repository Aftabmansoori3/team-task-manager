const { body, validationResult } = require('express-validator');
const { Project, User, ProjectMember, Task } = require('../models');
const { handleError } = require('../utils/errorHandler');

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
];

// get all projects the current user is part of (or owns)
const getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      // admins see everything
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] }
        ],
        order: [['created_at', 'DESC']]
      });
    } else {
      // members see only their projects
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] }
        ],
        where: {
          '$members.id$': req.user.id
        },
        order: [['created_at', 'DESC']],
        subQuery: false
      });

      // also include projects they own but might not be in members table
      const ownedProjects = await Project.findAll({
        where: { owner_id: req.user.id },
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] }
        ]
      });

      // merge without duplicates
      const projectIds = new Set(projects.map(p => p.id));
      for (const p of ownedProjects) {
        if (!projectIds.has(p.id)) {
          projects.push(p);
        }
      }
    }

    res.json({ projects });
  } catch (err) {
    handleError(res, err, 'Failed to fetch projects');
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'], through: { attributes: [] } }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // check access - must be owner, member, or admin
    const isMember = project.members.some(m => m.id === req.user.id);
    const isOwner = project.owner_id === req.user.id;
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    res.json({ project });
  } catch (err) {
    handleError(res, err, 'Failed to fetch project');
  }
};

const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner_id: req.user.id
    });

    // auto-add owner as member
    await project.addMember(req.user.id);

    console.log(`[PROJECT] Created "${name}" by user ${req.user.id}`);

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } }
      ]
    });

    res.status(201).json({ project: fullProject });
  } catch (err) {
    handleError(res, err, 'Failed to create project');
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can update this' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();

    res.json({ project });
  } catch (err) {
    handleError(res, err, 'Failed to update project');
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can delete this' });
    }

    // delete related tasks first
    await Task.destroy({ where: { project_id: project.id } });
    await project.destroy();

    console.log(`[PROJECT] Deleted project ${req.params.id}`);

    res.json({ message: 'Project deleted' });
  } catch (err) {
    handleError(res, err, 'Failed to delete project');
  }
};

const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can manage members' });
    }

    const userToAdd = await User.findByPk(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    await project.addMember(userId);

    // return updated member list
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'], through: { attributes: [] } }
      ]
    });

    res.json({ members: updatedProject.members });
  } catch (err) {
    handleError(res, err, 'Failed to add member');
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can manage members' });
    }

    // can't remove the owner
    if (parseInt(req.params.userId) === project.owner_id) {
      return res.status(400).json({ message: "Can't remove the project owner" });
    }

    await project.removeMember(req.params.userId);

    res.json({ message: 'Member removed' });
  } catch (err) {
    handleError(res, err, 'Failed to remove member');
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  projectValidation
};
