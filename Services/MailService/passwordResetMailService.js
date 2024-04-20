const nodemailer = require("nodemailer");
const passwordResetTemplate = require("../../Templates/Mail/passwordResetTemplate");
require("dotenv").config();
const sendPasswordResetEmail = (email, resetUrl, res) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "officialacc080@gmail.com",
    to: email,
    subject: "Your OTP for Verification",
    html: passwordResetTemplate(email, resetUrl),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);

      return res.status(502).json({
        status: "error",
        message: "Failed to Send Password Reset Email",
      });
    } else {
      console.log("Email sent: " + info.response);

      return res.status(200).json({
        status: "success",
        message: "Password Reset Email sent successfully",
      });
    }
  });
};

module.exports = sendPasswordResetEmail;
