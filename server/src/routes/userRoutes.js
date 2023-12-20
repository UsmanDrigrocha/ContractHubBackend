const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany, addTeamMember, removeTeamMember, getAllTeamMembers, changeCompanyStatus } = require('../controllers/userController');
const { validateToken } = require('../middlewares/validateToken');

// User Auth Routes
route.post('/register', register);
route.post('/login', login);
route.post('/verify/:token', verifyEmail);
route.post('/send-reset-link', sendResetPasswordLink);
route.post('/verify-reset-link/:token', verifyResetPasswordLink);

// Secure Get Routes
route.post('/createCompany', validateToken, createCompany);
route.post('/addTeamMember/:id', validateToken, addTeamMember);
route.post('/changeCompanyStatus',validateToken,changeCompanyStatus);

// Secure Post Routes
route.get('/getAllTeamMembers', validateToken, getAllTeamMembers);


// Secure Delete Routes
route.delete('/deleteTeamMember/:id', validateToken, removeTeamMember);


// Exporting Route
module.exports = route;