const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TaskActivity = sequelize.define('TaskActivity', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    updatedAt: false // Only createdAt matters for activity logs
  });

  return TaskActivity;
};
