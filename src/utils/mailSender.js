const nodemailer = require('nodemailer');
const { ApiError } = require('./ApiError');

const mailSender= async (email,title,body)=>{
    try {
        let transporter= nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user:  process.env.MAIL_USER,
                pass : process.env.MAIL_PASS,
            }
        });
        let info= await transporter.sendMail({
            from: 'jaiavasthi',
            to:email,
            subject:title,
            html:body
        });
        console.log("Email info", info);
        return info;
        
    } 
    catch(error){
            throw new ApiError(500,"Failed To Send Email");
    }

}

module.exports = mailSender; 