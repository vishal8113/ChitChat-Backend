const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const cloudinary = require("../Services/cloudinaryService");

exports.EditProfile = async (req, res) => {
  const { name, about, image, email } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (image) {
      const uploadImage = await cloudinary.uploader.upload(image, {
        folder: "profileImages",
      });

      if (!uploadImage.secure_url) {
        return res.status(503).json({
          status: "error",
          message: "Failed to upload image,Please try again!!",
        });
      }
      user.imageUrl = uploadImage.secure_url;
    }

    user.name = name;
    user.about = about;

    await user.save();

    let url;

    if (user.imageUrl) {
      url = user.imageUrl;
    }
    return res.status(200).json({
      status: "success",
      message: "Profile Updated Successfully",
      name,
      about,
      url,
    });
  } catch (err) {
    console.log(err);
    return res.status(503).json({
      status: "error",
      message: "Some Error Occurred",
    });
  }
};

exports.deleteUserAccount = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email }).select("+password");
    if (!user || !(await user.ComparePassword(password, user.password))) {
      return res.status(403).json({
        status: "error",
        message: "Invalid Password",
      });
    }
    await User.deleteOne({ email: email });

    return res.status(200).json({
      status: "success",
      message: "User Account Deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(503).json({
      status: "error",
      message: "Some Error Occurred",
    });
  }
};

exports.getUsers = async (req, res, next) => {
  const All_users = await User.find({
    verified: true,
  }).select("name imageUrl _id");

  const cnt_user = req.user;

  console.log(cnt_user);

  const remaining_users = All_users.filter(
    (user) =>
      !cnt_user.friends.includes(user._id) &&
      user._id.toString() !== cnt_user._id.toString()
  );

  console.log(remaining_users);

  return res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users fetched successfully",
  });
};

exports.getFriendRequests = async (req, res, next) => {
  const requests = await FriendRequest.find({
    recipient: req.user._id,
  }).populate("sender", "_id name imageUrl");

  return res.status(200).json({
    status: "success",
    data: requests,
    message: "Friend Requests fetched successfully",
  });
};

exports.getFriends = async (req, res, next) => {
  const cnt_user = await User.find(req.user._id).populate(
    "friends",
    "_id name imageUrl"
  );

  return res.status(200).json({
    status: "success",
    data: cnt_user.friends,
    message: "Friends fetched successfully",
  });
};
