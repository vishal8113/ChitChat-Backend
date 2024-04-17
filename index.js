require("dotenv").config();
const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

const dbConnect = require("./config/config.js");

const app = express();

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
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json({ limit: "10kb" }));

const limiter = rateLimit({
  max: 2000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

if (process.env.NODE_ENV === "DEVELOPMENT") {
  app.use(morgan("dev"));
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

app.listen(port, () => {
  console.log(`sever is running at port at ${port}`);
});
