const { body, validationResult } = require('express-validator');
const { Task, User, Project } = require('../models');
const { handleError } = require('../utils/errorHandler');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').isInt().withMessage('Project ID is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isDate().withMessage('Invalid date format')
];

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      order: [
        ['status', 'ASC'],
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    res.json({ tasks });
  } catch (err) {
    handleError(res, err, 'Failed to fetch tasks');
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (err) {
    handleError(res, err, 'Failed to fetch task');
  }
};

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;

    // make sure project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description: description || null,
      project_id: projectId,
      assigned_to: assignedTo || null,
      created_by: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: dueDate || null
    });

    // fetch with associations
    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    console.log(`[TASK] Created "${title}" in project ${projectId}`);

    res.status(201).json({ task: fullTask });
  } catch (err) {
    handleError(res, err, 'Failed to create task');
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assigned_to = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.due_date = dueDate;

    await task.save();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    res.json({ task: updatedTask });
  } catch (err) {
    handleError(res, err, 'Failed to update task');
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // only admin or task creator can delete
    if (task.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the task creator or admin can delete this' });
    }

    await task.destroy();

    res.json({ message: 'Task deleted' });
  } catch (err) {
    handleError(res, err, 'Failed to delete task');
  }
};

module.exports = {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  taskValidation
};
