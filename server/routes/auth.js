const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  register, login, getMe, getAllUsers, getTeamStats,
  registerValidation, loginValidation
} = require('../controllers/authController');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.get('/users', auth, getAllUsers);
router.get('/team-stats', auth, roleCheck('admin'), getTeamStats);

module.exports = router;
