const nodemailer = require("nodemailer");
require('dotenv').config();

async function mail(sendMailto, mailSubject, mailText, mailHTMLBody) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use a service recognized by Nodemailer (e.g., 'gmail')
            auth: {
                user: process.env.MAIL_EMAIL,
                pass: process.env.MAIL_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: `"Contract Hub 👻" ${process.env.MAIL_FROM}`, // sender address
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
