const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany, addTeamMember, removeTeamMember, getAllTeamMembers } = require('../controllers/userController');
const { validateToken } = require('../middlewares/validateToken');

route.post('/register', register);
route.post('/login', login);
route.post('/verify/:token', verifyEmail);
route.post('/send-reset-link', sendResetPasswordLink);
route.post('/verify-reset-link/:token', verifyResetPasswordLink);

// Secure Routes
route.post('/createCompany', validateToken, createCompany)
route.post('/addTeamMember/:id', validateToken, addTeamMember)
route.delete('/deleteTeamMember/:id', validateToken, removeTeamMember)
route.get('/getAllTeamMembers', validateToken, getAllTeamMembers)


module.exports = route;