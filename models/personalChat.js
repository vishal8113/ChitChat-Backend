const mongoose = require("mongoose");

const PersonalChatSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    }, // meri id (from) , receiver ki id (to) // participants -> 2
  ],
  messages: [
    {
      to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        enum: ["text", "media", "link", "reply"],
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
      },
    },
  ],
});

const PersonalChat = new mongoose.model("PersonalChat", PersonalChatSchema);

module.exports = PersonalChat;
