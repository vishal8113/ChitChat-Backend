const mongoose = require("mongoose");

require("dotenv").config();

const db_url = process.env.DB_URL.replace(
  "<password>",
  process.env.DB_PASSWORD
);

const dbConnect = () => {
  mongoose
    .connect(db_url)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
};

module.exports = dbConnect;
