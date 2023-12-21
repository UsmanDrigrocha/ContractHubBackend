const responseCodes = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

const responseMessages = {
    enterAllFields: "Enter All Fields !",
    blankSpaceNotAllowed: "Blank Spaces is not allowed in mail or number !",
    userRegisteredSuccessfully: "Verify Email !",
    userAlreadyExist: "User Already Registered !",
    userLoggedIn: "User Logged In Successfully !",
    notRegistered: "User Not Registerd !",
    verifyMail: "Verify Your Email !",
    wrongPassword: "Wrong Password !",
    tokenExpired: "Token expired !",
    tokenVerified: "Token Verified !",
    resetLinkSent: "Check Email for reset password link !",
    errorChangingPassword: "Error Changing Password !",
    passwordUpdated: "Password Updated Successfully !",
    companyCreated: "Company Created Successfully !",
    cantInvite: "Can't Invite unregistered user !",
    cantCreateCompanyOnThisMail: "Mail already registered ! Can't Create company on this mail !",
    companyNotExist: "Company Not Exist !",
    memberAdded: 'Team members added successfully',
    memberRemoved: "Member Removed Successfully !",
    onlyAdminAddMember: "Only company owner can add team members !",
    memberRemoved: "Team Member Removed !",
    errorGettingTeamMembers: "Error Getting Team Members !",
    onlyOwnerGetTeam: "Only Owner can get members !",
    errorChagningCompanyStatus: "Error Changing Company Status",
    companyChanged:"Company Changed !",
    errorGettingUserCompanies:"Error Getting User Companies !",
    errorCreatingFolder:"Error Creating Folder !",
    folderCreatedSuccessfully:"Folder Created Successfully !",
    unauthorizedAction:"Unauthorized !",
    errorFetchingFolders:"Error Getting Folders !",
    errorDeletingFolder:"Error Deleting Folder !",



    // Errors :
    errorRegister: "Error Registering User !",
    errorLogin: "Error Logging In User !",
    errorVerifying: "Error Verifying Email !",
    errorVerifyingResetLink: "Error Verifying Reset Link !",
    errorCreatingCompany: "Error Creating Company !",
    errorAddingTeamMember: "Error Adding Team Member !",
    errorRemovingTeamMember: "Error Removing Team Member !"

}

module.exports = {
    responseCodes,
    responseMessages
}