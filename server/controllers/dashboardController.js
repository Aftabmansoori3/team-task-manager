const { Op } = require('sequelize');
const { Task, Project, User, sequelize } = require('../models');
const { handleError } = require('../utils/errorHandler');

const getStats = async (req, res) => {
  try {
    let projectFilter = {};

    if (req.user.role !== 'admin') {
      // get projects user is member of
      const userProjects = await req.user.getProjects({ attributes: ['id'] });
      const ownedProjects = await Project.findAll({
        where: { owner_id: req.user.id },
        attributes: ['id']
      });

      const projectIds = [
        ...new Set([
          ...userProjects.map(p => p.id),
          ...ownedProjects.map(p => p.id)
        ])
      ];

      projectFilter = { project_id: { [Op.in]: projectIds } };
    }

    // total counts by status
    const statusCounts = await Task.findAll({
      where: projectFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // overdue tasks (due_date < today AND not done)
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.findAll({
      where: {
        ...projectFilter,
        due_date: { [Op.lt]: today },
        status: { [Op.ne]: 'done' }
      },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['due_date', 'ASC']],
      limit: 10
    });

    // count by priority
    const priorityCounts = await Task.findAll({
      where: projectFilter,
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // build a clean response
    const stats = {
      todo: 0,
      'in-progress': 0,
      done: 0,
      total: 0,
      overdue: overdueTasks.length
    };

    statusCounts.forEach(s => {
      stats[s.status] = parseInt(s.count);
      stats.total += parseInt(s.count);
    });

    const priorities = { low: 0, medium: 0, high: 0 };
    priorityCounts.forEach(p => {
      priorities[p.priority] = parseInt(p.count);
    });

    res.json({
      stats,
      priorities,
      overdueTasks
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch dashboard stats');
  }
};

module.exports = { getStats };
