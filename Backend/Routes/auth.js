const express = require('express');
const router = express.Router();
const { registerUser, authUser, getAllUsers, forgotPassword1, getResetToken, resetPassword1, changePassword, logoutUser  } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/allUsers', getAllUsers)
router.post("/forgot-password1", forgotPassword1)

router.get("/password-reset/:id/:token",getResetToken)

router.post("/password-reset/:id/:token",resetPassword1)

router.put('/changePassword',changePassword);

router.post('/logout', logoutUser);

module.exports = router;