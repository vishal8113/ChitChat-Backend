const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protectRoutes } = require("../middlewares/protectRoutes");

router.put("/editProfile", userController.EditProfile);
router.post("/removeUser", userController.deleteUserAccount);
router.get("/getUsers", protectRoutes, userController.getUsers);
router.get("/getFriends", userController.getFriends);
router.get("/getFriendRequests", userController.getFriendRequests);

module.exports = router;
