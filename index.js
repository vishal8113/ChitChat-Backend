require("dotenv").config();
const express = require("express");
require("dotenv").config();

const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const routes = require("./routers/index");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

const dbConnect = require("./config/config.js");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const PersonalChat = require("./models/personalChat");

const port = process.env.PORT || 8000;

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

dbConnect();

app.use(helmet());
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 10000000,
  })
);

app.use(express.json({ limit: "50mb" }));

app.use("/api/v1", routes);

const limiter = rateLimit({
  max: 2000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/chitchat", limiter);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

server.listen(port, () => {
  console.log(`sever is running at port at ${port}`);
});

io.on("connection", async (socket) => {
  const user_id = socket.handshake.query["user_id"];

  const socket_id = socket.id;

  if (user_id != null && Boolean(user_id)) {
    try {
      User.findByIdAndUpdate(user_id, {
        socket_id,
        status: "Online",
      });
    } catch (e) {
      console.log(e);
    }
  }

  // create friend request
  socket.on("friend_request", async (data) => {
    console.log(data);
    const to = await User.findById(data.to);
    const from = await User.findById(data.from);

    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });

    // send the friend request

    io.to(to.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });

    io.to(from.socket_id).emit("request_sent", {
      message: "Friend request sent",
    });
  });

  socket.on("accept_request", async (data) => {
    const request_doc = await FriendRequest.findById(data.request_id);

    const sender = await User.findById(request_doc.sender);
    const recipient = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    recipient.friends.push(request_doc.sender);

    await sender.save({ new: true, validateModifiedOnly: true });
    await recipient.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Request accepted successfully",
    });

    io.to(recipient.socket_id).emit("request_accepted", {
      message: "Request accepted successfully",
    });
  });

  socket.on("getAllPersonalConversations", async ({ user_id }, callback) => {
    try {
      const existing_conversations = await PersonalChat.find({
        participants: { $all: [user_id] },
      }).populate("participants", "name imageUrl _id status email");

      callback(existing_conversations);
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("start_conversation", async (data) => {
    const { to, from } = data;

    // check existing conversations

    const existing_conversation = await PersonalChat.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate("participants", "name imageUrl _id status email");

    // pehle baat ho rkhi ho
    if (existing_conversation.length > 0) {
      socket.emit("start_chat", existing_conversation[0]);
    }
    // first time chat
    else {
      let chat = await PersonalChat.create({
        participants: [to, from],
      });

      chat = await PersonalChat.findById(chat._id).populate(
        "participants",
        "name imageUrl _id status email"
      );

      socket.emit("start_chat", chat);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      if (data.conversation_id !== null) {
        const { messages } = await PersonalChat.findById(
          data.conversation_id
        ).select("messages");
        callback(messages);
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("text_message", async (data) => {
    // Link msg , Text Msg
    const { message, conversation_id, from, to, type } = data; //from -> id, to -> id

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    const new_message = {
      to,
      from,
      type,
      created_at: Date.now(),
      text: message,
    };

    const chat = await PersonalChat.findById(conversation_id);
    if (!chat) {
      console.log("Conversation Id is empty!!!");
      return;
    }
    chat.messages.push(new_message);
    await chat.save({ new: true, validateModifiedOnly: true });

    // emit incoming message -> to user

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    // emit outgoing_message -> from user

    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });
  });

  socket.on("file_message", (data) => {
    // Media Msg (Audio,Video,Document,Image)
  });

  socket.on("end", async (data) => {
    // Find user_id and then set the status to offline
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, {
        status: "Offline",
      });
    }

    // TODO => broadcast user disconnected

    console.log("Closing the connection...");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});
