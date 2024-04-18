const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  inageUrl: {
    type: String,
  },
  about: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `${props.value} is not a valid email address`,
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    validate: {
      validator: function (password) {
        return password.length >= 6;
      },
      message: `Password must be at least 6 characters long`,
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: Number,
  },
  otp_expiry_time: {
    type: Date,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) {
    return next();
  }

  this.otp = await bcrypt.hash(this.otp, 12);

  next();
});

userSchema.methods.createPasswordResetToken = function () {
  // randomBytes() -> buffer -> pseudo-random data, 32 bytes of random data
  // toString("hex") -> random bytes to a hexadecimal string representation , hexadecimal strings most suitable for tokens, Easy to transit over network
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256") // Converts input data, fixed size of string bytes, // Hash object (algorithm sha256)
    .update(resetPasswordToken) // updates that token with our hash object
    .digest("hex"); // convert in hexadecimal format

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return this.passwordResetToken;
};

userSchema.methods.ComparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.CompareOTP = async function (candidateOTP, userOTP) {
  return await bcrypt.compare(candidateOTP, userOTP);
};

const User = mongoose.model("User", userSchema);
module.exports = User;