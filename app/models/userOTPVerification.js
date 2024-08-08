const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userOTPVerificationSchema =  new Schema({
    emailId: { type: String, required: true },//instead of userid we can use emailid,after login can use useid
    otp: { type: String, required: true },
    createdAt:{ type: Date},
    expiresAt:{ type: Date },
   
  });
  const userOTPVerification = mongoose.model('userOTPVerification', userOTPVerificationSchema);

module.exports = userOTPVerification;