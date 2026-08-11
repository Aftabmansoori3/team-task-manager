const { body, validationResult } = require('express-validator');
const { Task, User, Project, TaskActivity } = require('../models');
const socketIO = require('../utils/socket');
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

    await TaskActivity.create({
      task_id: task.id,
      user_id: req.user.id,
      action: 'Task created'
    });

    try {
      socketIO.getIO().emit('taskCreated', { task: fullTask, projectId });
    } catch (e) {
      console.log('Socket error', e);
    }

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

    let statusChanged = false;
    let oldStatus = task.status;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assigned_to = assignedTo;
    if (status !== undefined) {
      if (task.status !== status) {
        statusChanged = true;
      }
      task.status = status;
    }
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.due_date = dueDate;

    await task.save();

    if (statusChanged) {
      await TaskActivity.create({
        task_id: task.id,
        user_id: req.user.id,
        action: `Moved task from ${oldStatus} to ${task.status}`
      });
    } else {
      await TaskActivity.create({
        task_id: task.id,
        user_id: req.user.id,
        action: 'Updated task details'
      });
    }

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    try {
      socketIO.getIO().emit('taskUpdated', { task: updatedTask, projectId: updatedTask.project_id });
    } catch (e) {
      console.log('Socket error', e);
    }

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

    const projectId = task.project_id;
    await task.destroy();

    try {
      socketIO.getIO().emit('taskDeleted', { taskId: req.params.id, projectId });
    } catch (e) {
      console.log('Socket error', e);
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    handleError(res, err, 'Failed to delete task');
  }
};

const getTaskActivities = async (req, res) => {
  try {
    const activities = await TaskActivity.findAll({
      where: { task_id: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ activities });
  } catch (err) {
    handleError(res, err, 'Failed to fetch task activities');
  }
};

module.exports = {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskActivities,
  taskValidation
};
