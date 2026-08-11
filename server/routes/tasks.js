const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getTasksByProject, getTask, createTask,
  updateTask, deleteTask, getTaskActivities, taskValidation
} = require('../controllers/taskController');

router.get('/project/:projectId', auth, getTasksByProject);
router.get('/:id', auth, getTask);
router.get('/:id/activities', auth, getTaskActivities);
router.post('/', auth, taskValidation, createTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
