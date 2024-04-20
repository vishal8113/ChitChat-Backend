const nodemailer = require("nodemailer");
const otpTemplate = require("../../Templates/Mail/otpTemplate");
require("dotenv").config();
const sendOtp = (email, otp, res) => {
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
    html: otpTemplate(email, otp),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);

      return res.status(502).json({
        status: "error",
        message: "Failed to Send OTP",
      });
    } else {
      console.log("Email sent: " + info.response);

      return res.status(200).json({
        status: "success",
        message: "OTP sent successfully",
      });
    }
  });
};

module.exports = sendOtp;
