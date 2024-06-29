const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protectRoutes } = require("../middlewares/protectRoutes");

router.put("/editProfile", userController.EditProfile);
router.post("/removeUser", userController.deleteUserAccount);
router.get("/getUsers", protectRoutes, userController.getUsers);
router.get(
  "/getFriendRequests",
  protectRoutes,
  userController.getFriendRequests
);
router.get("/getFriends", protectRoutes, userController.getFriends);

module.exports = router;
