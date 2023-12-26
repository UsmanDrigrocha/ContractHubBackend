const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany, addTeamMember, removeTeamMember, getAllTeamMembers, changeCompanyStatus, getUserCompanies, createFolder, getAllFolders, deleteFolder, saveDocumentToServer } = require('../controllers/userController');
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
route.post('/createFolder',validateToken,createFolder)

// Secure Post Routes
route.get('/getAllTeamMembers', validateToken, getAllTeamMembers);
route.get('/getUserCompanies',validateToken,getUserCompanies);
route.get('/getAllFolders',validateToken,getAllFolders)
route.post('/saveDocumentToServer',validateToken,saveDocumentToServer)

// Secure Delete Routes
route.delete('/deleteTeamMember/:id', validateToken, removeTeamMember);
route.delete('/deleteFolder/:folderID',validateToken,deleteFolder)

// Exporting Route
module.exports = route;