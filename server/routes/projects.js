const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getProjects, getProject, createProject,
  updateProject, deleteProject,
  addMember, removeMember,
  projectValidation
} = require('../controllers/projectController');

router.get('/', auth, getProjects);
router.get('/:id', auth, getProject);
router.post('/', auth, roleCheck('admin'), projectValidation, createProject);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);

// member management
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);

module.exports = router;
