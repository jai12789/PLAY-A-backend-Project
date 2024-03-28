import mongoose ,{Schema} from "mongoose"
import { ApiError } from "../utils/ApiError";
const mailSender = require('../utils/mailSender.js')

const otpSchema= new mongoose.Schema({
    email:{
        type:String,
        required : true,
    },
    otp:{
        type:String,
        required : true,
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 60*5 // expires after 5 minutes of generation
    },

})

//Send emails 
async function sendVerificationEmail(email,otp){
    try {
        const mailResponse= await mailSender(
            email, "Verification Email",`<h1> Please enter your OTP</h1>
            <p>Here is your otp code :${otp}</p>`
        );
        console.log("Email sent successfully", mailResponse);
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating OTP")
    }

}

otpSchema.pre('save', async function(next){
    console.log("New doc save to database");
    if(this.new){
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

export const otpschema= mongoose.model("OTP",otpSchema)