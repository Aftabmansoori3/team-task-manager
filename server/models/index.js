const { sequelize } = require('../config/db');
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const TaskActivity = require('./TaskActivity')(sequelize);

// --- Associations ---

// User <-> Project (ownership)
User.hasMany(Project, { foreignKey: 'owner_id', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Project <-> User (many-to-many membership)
const ProjectMember = sequelize.define('ProjectMember', {}, {
  tableName: 'project_members',
  timestamps: false
});

Project.belongsToMany(User, {
  through: ProjectMember,
  as: 'members',
  foreignKey: 'project_id',
  otherKey: 'user_id'
});
User.belongsToMany(Project, {
  through: ProjectMember,
  as: 'projects',
  foreignKey: 'user_id',
  otherKey: 'project_id'
});

// Task -> Project
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Task -> User (assigned)
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// Task -> User (creator)
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Task <-> TaskActivity
Task.hasMany(TaskActivity, { foreignKey: 'task_id', as: 'activities' });
TaskActivity.belongsTo(Task, { foreignKey: 'task_id' });

// TaskActivity -> User (who performed the action)
User.hasMany(TaskActivity, { foreignKey: 'user_id' });
TaskActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  ProjectMember,
  TaskActivity
};
