const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany, addTeamMember, removeTeamMember, getAllTeamMembers, changeCompanyStatus, getUserCompanies, createFolder, getAllFolders, deleteFolder, saveDocumentToServer, createDocument, getAllDocuments, firstVisit, updateUserName, sendContract, addUserTimeZone } = require('../controllers/userController');
const { validateToken } = require('../middlewares/validateToken');

// User Auth Routes
route.post('/register', register);
route.post('/login', login);
route.post('/verify/:token', verifyEmail);
route.post('/send-reset-link', sendResetPasswordLink);
route.post('/verify-reset-link/:token', verifyResetPasswordLink);

// Secure Post Routes
route.post('/createCompany', validateToken, createCompany);
route.post('/addTeamMember/:id', validateToken, addTeamMember);
route.post('/changeCompanyStatus',validateToken,changeCompanyStatus);
route.post('/createFolder',validateToken,createFolder)
route.post('/saveDocumentToServer',validateToken,saveDocumentToServer)
route.post('/createDocument',validateToken,createDocument)
route.post('/updateFirstVist',validateToken,firstVisit)
route.post('/sendContract',validateToken,sendContract)
route.post('/addUserTimeZone',validateToken,addUserTimeZone)

// Secure Get Routes
route.get('/getAllTeamMembers', validateToken, getAllTeamMembers);
route.get('/getUserCompanies',validateToken,getUserCompanies);
route.get('/getAllFolders',validateToken,getAllFolders)
route.get('/getAllDocuments',validateToken,getAllDocuments)

// Secure Delete Routes
route.delete('/deleteTeamMember/:id', validateToken, removeTeamMember);
route.delete('/deleteFolder/:folderID',validateToken,deleteFolder)

// Secure Put / Update Routes
route.put('/updateUserName',validateToken,updateUserName)

// Exporting Route
module.exports = route;