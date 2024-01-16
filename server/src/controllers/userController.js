const { responseCodes: rc, responseMessages: rm } = require('../utils/response');

const userModel = require('../models/user/userModel');

const bcrypt = require('bcrypt');

const { generateTokenVersion } = require('../utils/generateTokenVersion');

const jwt = require('jsonwebtoken');

const multer = require('multer');

const path = require('path');

const mail = require('../utils/sendMail');

const companyModel = require('../models/user/companyModel');

const folderModel = require('../models/user/folderModel');

const documentModel = require('../models/user/documentModel');

const templateModel = require('../models/user/templateModel');
const contactModel = require('../models/user/contactModel');

const { TokenExpiredError } = jwt;

require('dotenv').config();

// ------------------------------------ Register/SignUp --------------------------------------
const register = async (req, res) => {
    try {
        const { name, email, password, } = req.body;
        if (!email || !name || !password) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        if (email.includes(' ')) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.blankSpaceNotAllowed })
        }

        const findUser = await userModel.findOne({ email });

        if (findUser && findUser.isDeleted === true) {
            findUser.isDeleted = false;
            await findUser.save();
            return res.status(rc.OK).json({ Message: rm.userRegisteredSuccessfully, User: findUser });
        }

        if (findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.userAlreadyExist })
        }

        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const tokenVersion = generateTokenVersion(10);

        let newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            tokenVersion
        });
        await newUser.save();
        const userId = newUser._id;
        const secretKey = process.env.JWT_SECRET_KEY;
        const issuedAt = Math.floor(Date.now() / 1000);
        const expirationTime = issuedAt + 3600; // 1 hour expiration
        const payload = {
            userId: userId,
            iat: issuedAt,
            exp: expirationTime
        };

        const token = jwt.sign(payload, secretKey);


        const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

        const emailSent = await mail(
            email,
            `OTP Verification Mail`,
            "Verify Your OTP",
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>OTP Verification</title>
              <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f4f4f4;
              }
              
              .otp-container {
                text-align: center;
              }
              
              h1 {
                font-size: 28px;
                color: #333;
                margin-bottom: 20px;
              }
              
              #otp-code {
                color: #e74c3c; /* Red color for the OTP code */
                font-weight: bold;
                font-size: 36px;
              }
              
              </style>
            </head>
            <body>
              <div class="otp-container">
                <h1>OTP Verification</h1>
                <p>Please click the button below to verify your email:</p>
                <a href="${verificationLink}" style="padding: 10px 20px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
              </div>
            </body>
            </html>`
        );
        console.log(newUser.id);
        const foldersToCreate = [
            { name: 'All', folderOwner: [newUser.id] },
            { name: 'Completed', folderOwner: [newUser.id] },
            { name: 'My To Do', folderOwner: [newUser.id] },
            { name: 'In-Progress', folderOwner: [newUser.id] },
            { name: 'Bin', folderOwner: [newUser.id] }
        ];

        const createFolders = async () => {
            try {
                for (const folderData of foldersToCreate) {
                    const newFolder = new folderModel(folderData);
                    const savedFolder = await newFolder.save();
                    console.log(`Folder "${savedFolder.name}" created successfully.`);
                }
            } catch (err) {
                console.error('Error creating folders:', err);
            }
        };

        createFolders();

        res.status(rc.OK).json({ Message: rm.userRegisteredSuccessfully })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorRegister, Error: error.message });
    }
}

// ------------------------------------ Login --------------------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields })
        }
        if (email.includes(' ')) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.blankSpaceNotAllowed })
        }

        const findUser = await userModel.findOne({
            email,
            isDeleted: false,
        });
        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.notRegistered })
        }
        if (findUser.isActive === false) {
            return res.status(rc.UNAUTHORIZED).json({ Message: rm.verifyMail })
        }
        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.status(rc.UNAUTHORIZED).json({ Message: rm.wrongPassword })
        }
        const token = jwt.sign(
            { userID: findUser.id, tokenVersion: findUser.tokenVersion },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '4d' }
        );

        console.log(findUser.id);


        res.status(rc.OK).json({ Message: rm.userLoggedIn, Token: token });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorLogin, Error: error.message });
    }
}

// ------------------------------------ Verify Email --------------------------------------
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const secretKey = process.env.JWT_SECRET_KEY;

        const decoded = jwt.verify(token, secretKey);

        function isTokenExpired(decoded) {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            return currentTimeInSeconds > decoded.exp;
        }
        if (isTokenExpired(decoded)) {
            res.status(rc.UNAUTHORIZED).json({ Message: rm.tokenExpired });
        } else {
            const findUser = await userModel.findOneAndUpdate(
                { _id: decoded.userId, isDeleted: false },
                { $set: { isActive: true } },
                { new: true }
            );

            res.status(rc.OK).json({ Message: rm.tokenVerified });
        }
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(rc.UNAUTHORIZED).json({ Message: rm.tokenExpired });
        } else {
            res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorVerifying, Error: error.message });
        }
    }
}
// ------------------------------------ Send Reset Password Link --------------------------------------
const sendResetPasswordLink = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        if (email.includes(' ')) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.blankSpaceNotAllowed })
        }

        const findUser = await userModel.findOne({ email, isDeleted: false });
        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.notRegistered });
        }
        const secretKey = process.env.JWT_SECRET_KEY;
        const issuedAt = Math.floor(Date.now() / 1000);
        const expirationTime = issuedAt + 3600; // 1 hour expiration
        const payload = {
            userId: findUser._id,
            iat: issuedAt,
            exp: expirationTime
        };

        const token = jwt.sign(payload, secretKey);

        const verificationLink = `${process.env.FRONTEND_URL}/verify-reset-link/${token}`;

        const emailSent = await mail(
            email,
            `OTP Reset Password Mail`,
            "Reset Password Mail",
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>OTP Verification</title>
              <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f4f4f4;
              }
              
              .otp-container {
                text-align: center;
              }
              
              h1 {
                font-size: 28px;
                color: #333;
                margin-bottom: 20px;
              }
              
              #otp-code {
                color: #e74c3c; /* Red color for the OTP code */
                font-weight: bold;
                font-size: 36px;
              }
              
              </style>
            </head>
            <body>
              <div class="otp-container">
                <h1>Reset Password</h1>
                <p>Please click the button below to reset password</p>
                <a href="${verificationLink}" style="padding: 10px 20px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
              </div>
            </body>
            </html>`
        );

        res.status(rc.OK).json({ Message: rm.resetLinkSent })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorVerifying, Error: error.message });
    }
}

// ------------------------------------ Verify Reset Password Link --------------------------------------
const verifyResetPasswordLink = async (req, res) => {
    try {
        const { token } = req.params;
        const secretKey = process.env.JWT_SECRET_KEY;

        const decoded = jwt.verify(token, secretKey);

        function isTokenExpired(decoded) {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            return currentTimeInSeconds > decoded.exp;
        }
        if (isTokenExpired(decoded)) {
            res.status(rc.UNAUTHORIZED).json({ Message: rm.tokenExpired });
        } else {
            // res.status(200).json({ Message: rm.tokenVerified });
            const { newPassword } = req.body;
            if (!newPassword) {
                return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
            }

            const updatePassword = await userModel.findOne({
                _id: decoded.userId,
                isDeleted: false
            });

            const saltRounds = 10;

            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            updatePassword.password = hashedPassword;
            await updatePassword.save();

            res.status(rc.OK).json({ Message: rm.passwordUpdated })
        }
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(rc.UNAUTHORIZED).json({ Message: rm.tokenExpired });
        } else {
            res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorVerifyingResetLink, Error: error.message });
        }
    }
}

// ------------------------------------ Create Company --------------------------------------
const createCompany = async (req, res) => {
    try {
        const { compName, compEmail, team, compAddress, compPhone, compTimzeZone, companyForm } = req.body;
        const { userID } = req.user;

        if (compEmail.includes(' ')) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.blankSpaceNotAllowed })
        }

        const newCompany = new companyModel({
            companyOwner: {
                userID: userID,
            },
            compName,
            compEmail,
            compAddress,
            compPhone,
            team: [],
            compTimzeZone,
            companyForm
        });

        const findCompany = await companyModel.findOne({ compEmail });
        if (findCompany) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.cantCreateCompanyOnThisMail })
        }

        if (team && team.length > 0) {
            for (const member of team) {
                const { userID, role, title } = member;

                const findTeamMember = await userModel.findOne({ _id: userID, isDeleted: false });

                if (!findTeamMember) {
                    return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound });
                }

                // Push an object with userID, role, and title into the company's team array
                newCompany.team.push({ userID, role, title });
            }
        }

        await newCompany.save();
        res.json({ Message: rm.companyCreated, Company: newCompany });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCreatingCompany, Error: error.message });
    }
};
// ------------------------------------ Add Team Member --------------------------------------
const addTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }



        const findCompany = await companyModel.findOne({ _id: id });
        if (!findCompany) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.companyNotExist });
        }

        const validateAdmin = await companyModel.findOne({ 'companyOwner.userID': req.user.userID })
        if (!validateAdmin) {
            return res.status(rc.UNAUTHORIZED).json({ Message: rm.onlyAdminAddMember })
        }
        const { team } = req.body;

        for (const member of team) {
            const findUser = await userModel.findOne({ _id: member.userID });

            if (findUser) {
                findCompany.team.push({
                    userID: findUser._id,
                    role: member.role,
                    title: member.title
                });
            } else {
                return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound })
            }
        }

        // Save the updated company document
        const updatedCompany = await findCompany.save();

        res.json({ Message: rm.memberAdded, Company: updatedCompany });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorAddingTeamMember, Error: error.message });
    }
};
// ------------------------------------ Remove Team Member --------------------------------------
const removeTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        const { memberID } = req.body;

        if (!memberID) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const validateAdmin = await companyModel.findOne({ 'companyOwner.userID': req.user.userID });
        if (!validateAdmin) {
            return res.status(rc.UNAUTHORIZED).json({ Message: rm.onlyAdminAddMember })
        }

        const updatedCompany = await companyModel.findOneAndUpdate(
            { _id: id },
            { $pull: { team: { userID: memberID } } },
            { new: true }
        );

        if (!updatedCompany) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.companyNotExist });
        }

        return res.json({ Message: rm.memberRemoved, updatedCompany });
    } catch (error) {
        return res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorRemovingTeamMember, Error: error.message });
    }

};
// ------------------------------------ getAllTeamMembers --------------------------------------
const getAllTeamMembers = async (req, res) => {
    try {
        const { userID } = req.user;
        const findOwner = await companyModel.findOne({ 'companyOwner.userID': userID });
        if (!findOwner) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.onlyOwnerGetTeam });
        }
        res.send(findOwner.team)
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingTeamMembers })
    }
}

// ------------------------------------ change Company Status --------------------------------------
const changeCompanyStatus = async (req, res) => {
    try {
        const { companyID } = req.body;
        if (!companyID) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const findCompany = await companyModel
            .findOne({ _id: companyID })
            .populate('companyOwner');
        if (!findCompany) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.companyNotExist })
        }
        const user = await userModel.findOne({
            _id: req.user.userID,
            $or: [
                { _id: findCompany.companyOwner.userID },
                { _id: { $in: findCompany.team.map(member => member.userID) } }
            ]
        }).populate('companyStatus');
        user.companyStatus = companyID;
        await user.save();
        const updatedUser = await userModel
            .findById(req.user.userID)
            .populate('companyStatus');
        res.json({ Message: rm.companyChanged, Company: updatedUser.companyStatus })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorChagningCompanyStatus, Error: error.message });
    }
}
// ------------------------------------ Get User's Companies --------------------------------------
const getUserCompanies = async (req, res) => {
    try {
        const userId = req.user.userID;
        const findUser = await userModel.findOne({ _id: userId, isDeleted: false });

        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.notRegistered });
        }

        const findCompanies = await companyModel.find({
            $or: [
                { 'companyOwner.userID': userId }, // Check if the user is the company owner
                { 'team.userID': userId } // Check if the user is a team member
            ]
        });

        res.json({ User: findUser.name, Companies: findCompanies, TotalCompanies: findCompanies.length });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingUserCompanies });
    }
};
// ------------------------------------ Create Folder --------------------------------------
const createFolder = async (req, res) => {
    try {
        const { userID } = req.user;
        const { name } = req.body;

        if (!name) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        const companyInfo = await companyModel.findOne({ 'companyOwner.userID': userID });

        if (!companyInfo) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.companyNotExist })
        }


        const isAdminOrOwner = companyInfo.companyOwner.userID.toString() === userID.toString() && companyInfo.companyOwner.role === 'Super Admin';


        if (!isAdminOrOwner && !adminInTeam) {
            return res.status(rc.UNAUTHORIZED).json({ Message: rm.unauthorizedAction });
        }

        const newFolder = new folderModel({
            name,
            folderOwner: [userID]
        });

        await newFolder.save();

        res.json({ Message: rm.folderCreatedSuccessfully, Folder: newFolder });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCreatingFolder, Error: error.message });
    }
};

// ------------------------------------ Get All Folders --------------------------------------

const getAllFolders = async (req, res) => {
    try {
        const { userID } = req.user;

        const folders = await folderModel.find({ folderOwner: userID });

        res.json({ Folders: folders });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorFetchingFolders, Error: error.message });
    }
};


// ------------------------------------ Delete Folder --------------------------------------
const deleteFolder = async (req, res) => {
    try {
        const { folderID } = req.params;

        const deletedFolder = await folderModel.findByIdAndDelete(folderID);

        if (!deletedFolder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        res.json({ message: 'Folder deleted successfully', deletedFolder });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting folder', error: error.message });
    }
}

// ------------------------------------ Upload Document Logic --------------------------------------
const allowedDocumentType = ['application/pdf'];

const DocumentFilter = (req, file, cb) => {
    if (allowedDocumentType.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF Allowed!'), false);
    }
};

const store = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../uploads'); // Folder Destination
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({ storage: store, fileFilter: DocumentFilter });

// Upload Document API
const saveDocumentToServer = async (req, res) => {
    try {
        upload.single('Document')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(rc.BAD_REQUEST).json({ Message: rm.multerError, error: err.message });
            } else if (err) {
                return res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorUploadingDocument, Error: err.message });
            }

            if (!req?.file) {
                return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
            }

            const fileType = req.file.mimetype;
            const fileName = req.file.filename;
            const fileURL = `${fileName}`;

            res.status(rc.OK).json({ message: rm.documentUploadedSuccessfully, url: fileURL });
        });

    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ message: rm.errorUploadingDocument, Error: error.message });
    }
};
// ------------------------------------ First Visit --------------------------------------
const firstVisit = async (req, res) => {
    try {
        const { userID } = req.user;
        const findUser = await userModel.findOne({ _id: userID, isDeleted: false });
        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound })
        }
        findUser.firstVisit = true;
        await findUser.save();
        res.status(rc.OK).json({ Message: rm.userFound, First_Visit: findUser.firstVisit });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorInFirstVisit })
    }
}

// ------------------------------------ Create Document --------------------------------------
const createDocument = async (req, res) => {
    try {
        const { userID } = req.user;
        let docsOwner = userID;
        const { docFolder, docURL, docName } = req.body;
        if (!docURL || !docName) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields })
        }
        const newDoc = new documentModel({
            docURL,
            docName,
            receiver: [],
            docOwner: []
        });
        if (docFolder) {
            newDoc.docFolder.push(docFolder);
        } else {
            const findPending = await folderModel.findOne({ name: "All" });
            if (findPending) {
                newDoc.docFolder = findPending._id;
            }
        }
        newDoc.docOwner.push(docsOwner);
        if (req.body.receiver) {
            newDoc.receiver = req.body.receiver;
        }
        newDoc.status = "pending"
        await newDoc.save();
        res.status(rc.CREATED).json({ Message: rm.docCreatedSuccessfully, Doc: newDoc })
    }
    catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCreatingDocument, Error: error.message })
    }
}
// ------------------------------------ Get All Document --------------------------------------
const getAllDocuments = async (req, res) => {
    try {
        const { userID } = req.user;

        const foundDocuments = await documentModel.find({
            $or: [
                { docOwner: { $in: [userID] } },
                { receiver: { $in: [userID] } }
            ]
        }).populate('receiver', 'name');

        if (!foundDocuments || foundDocuments.length === 0) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.docsNotfound });
        }

        // Transform the result to include receiver names
        const documentsWithReceiverNames = await Promise.all(foundDocuments.map(async (doc) => {
            const receiversWithNames = await Promise.all(doc.receiver.map(async (receiverId) => {
                // Assuming you have a 'Contact' model
                // Replace 'Contact' with your actual contact model
                const contact = await contactModel.findById(receiverId);
                return contact ? contact.name : null;
            }));

            return {
                _id: doc._id,
                docOwner: doc.docOwner,
                receivers: receiversWithNames,
                // Add other fields as needed
            };
        }));

        res.status(rc.OK).json({ Message: rm.foundDocuments, Documents: documentsWithReceiverNames });
    } catch (error) {
        console.error(error);
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingDocs, Error: errro.message });
    }
};

// ------------------------------------ Send Contract --------------------------------------
const sendContract = async (req, res) => {
    try {
        const { userID } = req.user;
        const { documentId, receivers } = req.body;

        if (!documentId || !receivers || receivers.length === 0 || receivers.length === -1) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        const findDoc = await documentModel.findOne({ _id: documentId });

        if (!findDoc) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.docsNotfound });
        }

        findDoc.receiver = receivers;
        await findDoc.save();
        if (!findDoc.receiver || findDoc.receiver.length === 0) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.noReceiver });
        }

        let receiverIds = [];

        if (Array.isArray(findDoc.receiver)) {
            receiverIds = findDoc.receiver.filter(id => id); // Remove potential undefined or empty string values
        } else if (typeof findDoc.receiver === 'string') {
            receiverIds.push(findDoc.receiver); // Add the single string ID to the array
        }


        let findUsers = await contactModel.findOne({ userID: userID });
        if (!findUsers || findUsers.length === 0) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound });
        }

        findUsers = findUsers.contacts

        for (const user of findUsers) {
            console.log(user.email)
            const emailSent = await mail(
                user.email, // Assuming 'email' is the field storing user emails
                `Contract Notification`,
                "Contract Details",
                `<html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Contract Notification</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background-color: #f4f4f4;
                        }
            
                        .contract-container {
                            text-align: center;
                        }
            
                        h1 {
                            font-size: 28px;
                            color: #333;
                            margin-bottom: 20px;
                        }
            
                        #document-id {
                            color: #e74c3c; /* Red color for the Document ID */
                            font-weight: bold;
                            font-size: 24px;
                        }
            
                        .button-container {
                            margin-top: 20px;
                        }
            
                        .action-button {
                            padding: 10px 20px;
                            background-color: #e74c3c;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="contract-container">
                        <h1>Contract Notification</h1>
                        <p>Your contract is ready. Click the button below to view:</p>
                        <div class="button-container">
                        <p>File Name ${findDoc.docName}</p>
                            <a href="${process.env.CONTRACT_LINK}/${findDoc.docURL}" class="action-button">View Contract</a>
                        </div>
                    </div>
                </body>
                </html>`
            );

            // Handle emailSent status here if required
        }

        findDoc.status = "sent";
        await findDoc.save();
        res.status(rc.OK).json({ Contract_Sent: true });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorSendingContract, Error: error.message });
    }
};

// ------------------------------------ Update Name--------------------------------------
const updateUserName = async (req, res) => {
    const { userID } = req.user;
    const { name } = req.body;
    if (!name) {
        return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
    }
    const findUser = await userModel.findOne({ _id: userID, isDeleted: false });
    if (!findUser) {
        return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound });
    }
    findUser.name = name;
    await findUser.save();
    res.status(rc.OK).json({ Message: rm.usereNameUpdatedSuccessfully })
}
// ------------------------------------ Update Name--------------------------------------

const addUserTimeZone = async (req, res) => {
    try {
        const { userID } = req.user;
        const { timeZone, address } = req.body;
        if (!timeZone || !address) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const findUser = await userModel.findOne({ _id: userID, isDeleted: false });
        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.notRegistered });
        }
        findUser.timeZone = timeZone;
        findUser.address = address;
        await findUser.save();
        res.status(rc.OK).json({ Message: rm.timeZoneSuccess, User: findUser })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorAddingTimeNaddress, Error: error.message })
    }
}

// ------------------------------------ Contract Completed--------------------------------------
const contractCompleted = async (req, res) => {
    try {
        const { docID } = req.body;
        const { userID } = req.user;
        if (!docID) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const findDoc = await documentModel.findOne({ _id: docID });
        if (!findDoc) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.docsNotfound });
        }
        findDoc.isSigned = true;
        findDoc.status = "completed";
        const findCompleted = await folderModel.findOne({ name: "Completed", folderOwner: { $in: [userID] } });
        if (findCompleted) {
            findDoc.docFolder.pus(findCompleted._id);
        }
        await findDoc.save();
        res.status(rc.OK).json({ Message: rm.contractCompleted })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCompletingContract })
    }
}

// ------------------------------------ Create Template --------------------------------------
const createTemplate = async (req, res) => {
    try {
        const { userID } = req.user;
        const { tempName, docURL, company, receiver } = req.body;
        if (!tempName || !docURL) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const findUser = await userModel.findOne({ _id: userID, isDeleted: false });
        if (!findUser) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.userNotFound });
        }
        const newTemplate = new templateModel({
            tempName,
            uploadedBy: userID,
            docURL
        });
        if (company) {
            newTemplate.company = company;
        }
        if (receiver) {
            newTemplate.receiver = receiver;
        }
        await newTemplate.save();
        res.status(rc.OK).json({ Message: rm.templateCreated, Template: newTemplate });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCreatingTemplate });
    }
}

// ------------------------------------ Get User Templates --------------------------------------
const getUserTemplates = async (req, res) => {
    try {
        const { userID } = req.user;
        console.log(userID)
        const userTemplates = await templateModel.find({ uploadedBy: userID });
        res.status(rc.OK).json({ Message: rm.templatesFetched, User_Templates: userTemplates });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingTemplates, Error: error.message });
    }
}

// ------------------------------------ Get Company Templates --------------------------------------
const getCompanyTemplates = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === 'null') {
            const companyTemplates = await templateModel.find({ company: null });
            return res.status(rc.OK).json({ Message: rm.templatesFetched, Company_Templates: companyTemplates });
        }

        const companyTemplates = await templateModel.find({ company: id });
        res.status(rc.OK).json({ Message: rm.templatesFetched, Company_Templates: companyTemplates });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingTemplates, Error: error.message });
    }
}
// ------------------------------------ Create Contact --------------------------------------
const createContact = async (req, res) => {
    try {
        const { userID } = req.user;
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        let findContacts = await contactModel.findOne({ userID });
        if (!findContacts) {
            findContacts = new contactModel({
                name,
                email,
                userID,
                contacts: [{ name, email }] // Initialize contacts as an array
            });
            await findContacts.save();
        } else {
            findContacts.contacts.push({ name, email });
            await findContacts.save();
        }
        res.status(rc.CREATED).json({ Message: rm.contactCreated });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorCreatingContact, Error: error.message });
    }
}
// ------------------------------------ Delete Contact --------------------------------------
const deleteContact = async (req, res) => {
    try {
        const { userID } = req.user;
        const contactID = req.params.contactID; // Assuming contactID is passed in the request parameters

        const findContacts = await contactModel.findOne({ userID });
        if (!findContacts) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.contactNotFound });
        }
        // Find the index of the contact to remove
        const contactIndex = findContacts.contacts.find(contact => contact._id.equals(contactID));
        if (contactIndex === -1) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.contactNotFound });
        }

        findContacts.contacts.splice(contactIndex, 1); // Remove the contact
        await findContacts.save();

        res.status(rc.OK).json({ Message: rm.contactDeleted });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorDeletingContact, Error: error.message });
    }
}
// ------------------------------------ Get All Contact --------------------------------------

const getAllContacts = async (req, res) => {
    try {
        const { userID } = req.user;

        const findContacts = await contactModel.findOne({ userID });
        if (!findContacts) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.noContactsFound });
        }

        const allContacts = findContacts.contacts;
        res.status(rc.OK).json({ Contacts: allContacts });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorFetchingContacts, Error: error.message });
    }
}
// ------------------------------------ Update Contact --------------------------------------
const updateContact = async (req, res) => {
    try {
        const { userID } = req.user;
        const { name, email } = req.body;
        const contactID = req.params.contactID; // Assuming contactID is passed in the request parameters
        console.log(contactID)
        if (!name || !email) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }

        const findContacts = await contactModel.findOne({ userID });
        if (!findContacts) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.contactNotFound });
        }

        const contactToUpdate = findContacts.contacts.find(contact => contact._id.equals(contactID));

        if (!contactToUpdate) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.contactNotFound });
        }

        contactToUpdate.name = name;
        contactToUpdate.email = email;

        await findContacts.save();

        res.status(rc.OK).json({ Message: rm.contactUpdated, Contact: contactToUpdate });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorUpdatingContact, Error: error.message });
    }
}

// ------------------------------------ Delete Document --------------------------------------
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const findDoc = await documentModel.findByIdAndDelete(id);
        if (!findDoc) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.docsNotfound });
        }
        res.status(rc.OK).json({ Message: rm.deletedDocument });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorDeletingDocument });
    }
}

// ------------------------------------ Add Receivers in Doc --------------------------------------
const addReceivers = async (req, res) => {
    try {
        const { userID } = req.user;
        const { docID } = req.params;
        const { receivers } = req.body;
        if (!receivers || receivers.length === 0 || receivers.length === -1) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const findDoc = await documentModel.findOne({ _id: docID });
        if (!findDoc) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.docsNotfound });
        }
        findDoc.receiver = receivers;
        await findDoc.save();
        res.json({ Message: rm.receiversAdded, Receiverss: receivers, Document: findDoc });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorAddingReceivers, Error: error.message });
    }
}


// ------------------------------------ Get Single Document --------------------------------------
const getDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const findDoc = await documentModel.findOne({ _id: id });
        if (!findDoc) {
            return res.status(rc.NOT_FOUND).json({ Message: rm.docsNotfound });
        }
        res.status(rc.OK).json({ Message: rm.docFound, Document: findDoc })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingDocument, Error: error.message })
    }
}

// ------------------------------------ Add Credentials to Document --------------------------------------
const addCredentials = async (req, res) => {
    try {
        const { docID } = req.params;
        if (!docID) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        const { credentials } = req.body;
        if (!credentials) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        res.status(rc.CREATED).json({ credentials });
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorAddingCredentials })
    }
}

// ------------------------------------ Add Credentials to PDF --------------------------------------
const addCredentialsToPDF = async (req, res) => {
    try {
        const { docID } = req.params;
        if (!docID) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.enterAllFields });
        }
        // Add Credentials onto PDF
        res.json(docID);
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorAddingCredentials });
    }
}


// ------------------------------------ Search Document --------------------------------------
const searchDocument = async (req, res) => {
    try {
        const { userID } = req.user;
        const { query } = req.body;

        const documents = await documentModel.find({
            docOwner: {
                $in: [userID]
            },
            docName: { $regex: new RegExp(query, 'i') }
        });

        res.json({ Documents: documents });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error searching documents' });
    }
};

// ------------------------------------ Get Documents With Pagination --------------------------------------
const getAllDocumentsWithPagination = async (req, res) => {
    try {
        const { userID } = req.user;
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 items per page
    
        const skip = (page - 1) * pageSize;
    
        const foundDocuments = await documentModel
            .find({
                $or: [
                    { docOwner: { $in: [userID] } },
                    { receiver: { $in: [userID] } }
                ]
            })
            .populate('receiver', 'name')
            .skip(skip)
            .limit(pageSize);
    
        if (!foundDocuments || foundDocuments.length === 0) {
            return res.status(rc.BAD_REQUEST).json({ Message: rm.docsNotfound });
        }
    
        // Transform the result to include receiver names
        const documentsWithReceiverNames = await Promise.all(foundDocuments.map(async (doc) => {
            const receiversWithNames = await Promise.all(doc.receiver.map(async (receiverId) => {
                // Assuming you have a 'Contact' model
                // Replace 'Contact' with your actual contact model
                const contact = await contactModel.findById(receiverId);
                return contact ? contact.name : null;
            }));
    
            return {
                _id: doc._id,
                docOwner: doc.docOwner,
                receivers: receiversWithNames,
                // Add other fields as needed
            };
        }));
    
        res.status(rc.OK).json({ Message: rm.foundDocuments, Documents: documentsWithReceiverNames });
    } catch (error) {
        console.error(error);
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorGettingDocs, Error: error.message });
    }
    
}

// ------------------------------------ Exports --------------------------------------
module.exports = {
    register,
    login,
    verifyEmail,
    sendResetPasswordLink,
    verifyResetPasswordLink,
    createCompany,
    addTeamMember,
    removeTeamMember,
    getAllTeamMembers,
    changeCompanyStatus,
    getUserCompanies,
    createFolder,
    getAllFolders,
    deleteFolder,
    saveDocumentToServer,
    createDocument,
    getAllDocuments,
    firstVisit,
    updateUserName,
    sendContract,
    addUserTimeZone,
    contractCompleted,
    createTemplate,
    getUserTemplates,
    getCompanyTemplates,
    createContact,
    getAllContacts,
    updateContact,
    deleteContact,
    deleteDocument,
    addReceivers,
    getDocument,
    addCredentials,
    addCredentialsToPDF,
    searchDocument,
    getAllDocumentsWithPagination
}
