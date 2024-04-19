const jwt = require("jsonwebtoken");
require("dotenv").config();
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

const User = require("../models/user");

const filterObj = require("../utils/filterObj");
const crypto = require("crypto");

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
};

// registration -> 1st step
exports.register = async (req, res, next) => {
  const { email, password } = req.body;

  const filterBody = filterObj(req.body, "email", "password");

  const existing_user = await User.findOne({ email: email });

  if (existing_user && existing_user.verified) {
    return res.status(403).json({
      status: "Error",
      message: "Email already exists",
    });
  } else if (existing_user) {
    await User.findOneAndUpdate({ email: email }, filterBody, {
      new: true,
      validateModifiedOnly: true,
    });

    req.userId = existing_user._id;

    next();
  } else {
    const new_user = await User.create(filterBody);

    req.userId = new_user._id;

    next();
  }
};

// 2nd step -> otp generation
exports.sendOtp = async (req, res, next) => {
  const { userId } = req;
  const new_otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  const otp_expiry_time = Date.now() + 10 * 60 * 1000;

  const user = await User.findByIdAndUpdate(userId, {
    otp_expiry_time: otp_expiry_time,
  });

  user.otp = new_otp.toString();

  await user.save({ new: true, validateModifiedOnly: true });

  // send mail to user
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "officialacc080@gmail.com",
    to: user.email,
    subject: "Your OTP for Verification",
    text: `Your OTP for verification is ${new_otp}`,
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

exports.verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email: email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(403).json({
      status: "error",
      message: "Invalid Email or OTP is expired",
    });
  }

  if (user.verified) {
    return res.status(403).json({
      status: "error",
      message: "User already verified",
    });
  }

  if (!(await user.CompareOTP(otp, user.otp))) {
    return res.status(403).json({
      status: "error",
      message: "Invalid OTP",
    });
  }

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
  });

  // OTP is correct

  user.verified = true;
  user.otp = undefined;
  user.otp_expiry_time = undefined;

  await user.save();
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Both Email and Password must be provided",
    });
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.ComparePassword(password, user.password))) {
    return res.status(403).json({
      status: "error",
      message: "Invalid Credentials",
    });
  }

  const token = createToken(user._id);

  return res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
  });
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "There is no user with email address.",
    });
  }

  // Generate the token

  const resetToken = user.createPasswordResetToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });
  try {
    // send this resetUrl to user
    const resetUrl = `http:localhost:3000/auth/reset-password/code=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "officialacc080@gmail.com",
      to: user.email,
      subject: "Request for Password Reset",
      text: `Password Reset Link for chitchat app is: ${resetUrl}`,
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
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(503).json({
      message: "There was an error sending the email. Try again later!",
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  // 1-> Get user on the basis of their token

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If user is not found
  if (!user) {
    return res.status(403).json({
      status: "error",
      message: "Password reset token is invalid or has expired",
    });
  }

  // update the password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // log in our app , send jwt token
  const token = createToken(user._id);

  return res.status(200).json({
    status: "success",
    message: "Password updated successfully",
    token,
  });
};
