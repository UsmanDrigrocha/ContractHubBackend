const express = require('express');

const route = express.Router();


const { register, login, verifyEmail, sendResetPasswordLink, verifyResetPasswordLink, createCompany, addTeamMember, removeTeamMember, getAllTeamMembers, changeCompanyStatus, getUserCompanies, createFolder, getAllFolders, deleteFolder, saveDocumentToServer, createDocument, getAllDocuments, firstVisit, updateUserName, sendContract, addUserTimeZone, contractCompleted, createTemplate, getAllTemplates, getUserTemplates, getCompanyTemplates, createContact, getAllContacts, deleteContact, updateContact, deleteDocument, addReceivers, getDocument, addCredentials, addCredentialsToPDF, searchDocument, getAllDocumentsWithPagination } = require('../controllers/userController');
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
route.post('/createFolder',validateToken,createFolder);
route.post('/saveDocumentToServer',validateToken,saveDocumentToServer);
route.post('/createDocument',validateToken,createDocument);
route.post('/updateFirstVist',validateToken,firstVisit);
route.post('/sendContract',validateToken,sendContract);
route.post('/addUserTimeZone',validateToken,addUserTimeZone);
route.post('/contractCompleted',validateToken,contractCompleted);
route.post('/createTemplate',validateToken,createTemplate);
route.post("/createContact",validateToken,createContact);
route.post('/addReceiver/:docID',validateToken,addReceivers);
route.post('/addCredentials/:docID',validateToken,addCredentials);
route.post('/addCredentialsToPDF/:docID',validateToken,addCredentialsToPDF);
route.post('/searchDocument',validateToken,searchDocument)


// Secure Get Routes
route.get('/getAllTeamMembers', validateToken, getAllTeamMembers);
route.get('/getUserCompanies',validateToken,getUserCompanies);
route.get('/getAllFolders',validateToken,getAllFolders)
route.get('/getAllDocuments',validateToken,getAllDocuments)
// route.get('/getAllTemplates/:id',validateToken , getAllTemplates)
route.get('/templates',validateToken, getUserTemplates);
route.get('/templates/:id',validateToken, getCompanyTemplates);
route.get('/getAllContacts',validateToken,getAllContacts)
route.get('/getDocument/:id',validateToken,getDocument)
route.get('/getAllDocumentsWithPagination',validateToken,getAllDocumentsWithPagination);

// Secure Delete Routes
route.delete('/deleteTeamMember/:id', validateToken, removeTeamMember);
route.delete('/deleteFolder/:folderID',validateToken,deleteFolder)
route.delete('/deleteContact/:contactID',validateToken,deleteContact)
route.delete('/deleteDocument/:id',validateToken,deleteDocument);

// Secure Put / Update Routes
route.put('/updateUserName',validateToken,updateUserName)
route.put('/updateContact/:contactID',validateToken,updateContact)
// Exporting Route
module.exports = route;