const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany } = require('../controllers/userController');
const { validateToken } = require('../middlewares/validateToken');

route.post('/register', register);
route.post('/login', login);
route.post('/verify/:token', verifyEmail);
route.post('/send-reset-link', sendResetPasswordLink);
route.post('/verify-reset-link/:token', verifyResetPasswordLink);

// Secure Routes
route.post('/createCompany', validateToken, createCompany)

module.exports = route;