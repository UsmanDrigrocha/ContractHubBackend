const { responseCodes: rc, responseMessages: rm } = require('../utils/response');

const userModel = require('../models/user/userModel');

const bcrypt = require('bcrypt');

const { generateTokenVersion } = require('../utils/generateTokenVersion');

const jwt = require('jsonwebtoken');

const mail = require('../utils/sendMail');

const { TokenExpiredError } = jwt;

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

        // const tokenVersion = generateTokenVersion(10);

        let newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            // tokenVersion
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
        res.status(rc.OK).json({ Message: rm.userRegisteredSuccessfully })
    } catch (error) {
        res.status(rc.INTERNAL_SERVER_ERROR).json({ Message: rm.errorRegister, Error: error.message });
    }
}

// ------------------------------------ Login --------------------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)
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
            console.log(updatePassword)

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

// ------------------------------------ ----- --------------------------------------


// ------------------------------------ Exports --------------------------------------

module.exports = {
    register,
    login,
    verifyEmail,
    sendResetPasswordLink,
    verifyResetPasswordLink
}