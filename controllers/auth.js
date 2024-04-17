const jwt = require("jsonwebtoken");
require("dotenv").config();
const otpGenerator = require("otp-generator");

const User = require("../models/user");

const filterObj = require("../utils/filterObj");

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
};

// registration -> 1st step
exports.register = async (req, res, next) => {
  const { email, password } = req.body;

  const filterBody = filterObj(req.body, "email", "password");

  const existing_user = await User.findOne({ email: email });

  if (existing_user && existing_user.verified) {
    res.status(403).json({
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

  res.status(200).json({
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
    res.status(403).json({
      status: "error",
      message: "Invalid Email or OTP is expired",
    });
  }

  if (user.verified) {
    res.status(403).json({
      status: "error",
      message: "User already verified",
    });
  }

  if (!(await user.compareOTP(otp, user.otp))) {
    res.status(403).json({
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

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
  });
};
