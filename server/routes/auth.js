const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  register, login, getMe, getAllUsers,
  registerValidation, loginValidation
} = require('../controllers/authController');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.get('/users', auth, getAllUsers);

module.exports = router;
