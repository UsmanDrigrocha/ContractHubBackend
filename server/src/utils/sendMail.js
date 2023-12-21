const nodemailer = require("nodemailer");
require('dotenv').config();

async function mail(sendMailto, mailSubject, mailText, mailHTMLBody) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'cleveland.parisian@ethereal.email',
                pass: 'cDTr4VD2vgnU77Gbcu'
            }
        });

        const info = await transporter.sendMail({
            from: '"Contract Hub 👻" <contracthub@example.com>', // sender address
            to: `${sendMailto}`, // recipient address
            subject: `${mailSubject} ✔`, // Subject line
            text: `${mailText}`, // plain text body
            html: `${mailHTMLBody}`, // html body
        });
        
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

module.exports = mail;
