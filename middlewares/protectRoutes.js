const promisify = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();
exports.protectRoutes = async (req, res, next) => {
  let token;

  // 1) check for token in headers and cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startswith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    return res.status(402).json({
      status: "error",
      message: "Invalid token",
    });
  }

  //  verify the token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) check if the user exists

  const valid_user = await User.findById(decodedToken.userId);

  if (!valid_user) {
    return res.status(403).json({
      status: "error",
      message: "User not found",
    });
  }

  req.user = valid_user;
  next();
};
