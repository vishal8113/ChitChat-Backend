require("dotenv").config();
const express = require("express");
require("dotenv").config();

const { Server } = require("socket.io");
const { createServer, request } = require("http");

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

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, {
      socket_id,
    });
  }

  // create friend request
  socket.on("friend-request", async (data) => {
    const to = await User.findById(data.to);
    const from = await User.findById(data.from);

    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });

    // send the friend request

    io.to(to.socket_id).emit("new-friend-request", {
      message: "New friend request received",
    });

    io.to(from.socket_id).emit("request-sent", {
      message: "Friend request sent",
    });
  });

  socket.on("accept-request", async (data) => {
    const request_doc = await FriendRequest.findById(data.request_id);

    const sender = await User.findById(request_doc.sender);
    const recipient = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    recipient.friends.push(request_doc.sender);

    await sender.save({ new: true, validateModifiedOnly: true });
    await recipient.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request-accepted", {
      message: "Request accepted successfully",
    });

    io.to(recipient.socket_id).emit("request-accepted", {
      message: "Request accepted successfully",
    });
  });

  socket.on("end", () => {
    console.log("Closing the connection...");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

// soxket.emit("xyz",{to:id,from:id})
// soxket.on("xyz",(msg) => {
//   console.log(msg)
// })
