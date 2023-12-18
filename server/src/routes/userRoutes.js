const express = require('express');

const route = express.Router();

const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink } = require('../controllers/userController')

route.post('/register', register)
route.post('/login', login)
route.post('/verify/:token', verifyEmail)
route.post('/send-reset-link',sendResetPasswordLink)
route.post('/verify-reset-link/:token',verifyResetPasswordLink)
module.exports = route