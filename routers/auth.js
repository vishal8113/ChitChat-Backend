const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/register", authController.register, authController.sendOtp);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
