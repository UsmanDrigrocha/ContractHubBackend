const responseCodes = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

const responseMessages={
    enterAllFields:"Enter All Fields !",
    blankSpaceNotAllowed:"Blank Spaces is not allowed in mail or number !",
    userRegisteredSuccessfully:"Verify Email !",
    userAlreadyExist:"User Already Registered !",
    userLoggedIn:"User Logged In Successfully !",
    notRegistered:"User Not Registerd !",
    verifyMail:"Verify Your Email !",
    wrongPassword:"Wrong Password !",
    tokenExpired: "Token expired !" ,
    tokenVerified:"Token Verified !",
    resetLinkSent:"Check Email for reset password link !",
    errorChangingPassword:"Error Changing Password !",
    passwordUpdated:"Password Updated Successfully !",


    // Errors :
    errorRegister:"Error Registering User !",
    errorLogin:"Error Logging In User !",
    errorVerifying:"Error Verifying Email !",
    errorVerifyingResetLink:"Error Verifying Reset Link !"

}

module.exports = {
    responseCodes,
    responseMessages
}