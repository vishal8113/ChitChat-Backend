const jwt = require("jsonwebtoken");
require("dotenv").config();
const otpGenerator = require("otp-generator");

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

  await User.findByIdAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  });

  // send mail to user

  return res.status(200).json({
    status: "success",
    message: "OTP sent successfully",
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

  if (!(await user.compareOTP(otp, user.otp))) {
    return res.status(403).json({
      status: "error",
      message: "Invalid OTP",
    });
  }

  // OTP is correct

  user.verified = true;
  user.otp = undefined;
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
  const { email } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(403).json({
      status: "error",
      message: "Invalid Email",
    });
  }

  // Generate the token

  const resetToken = user.createPasswordResetToken();

  const resetUrl = `http:localhost:3000/auth/reset-password/code=${resetToken}`;

  try {
    // send this resetUrl to user

    return res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email",
    });
  } catch {
    user.passwordResetToken = undefined;
    passwordResetExpires = undefined;

    await User.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
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
