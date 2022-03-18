const mongoose = require("mongoose");
const config = require("config");
const dbDebug = require("debug")("app:db");

mongoose
  .connect(
    `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@${process.env.HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    dbDebug("Connected to DB...");
    console.log("Connected to DB...");
  })
  .catch((err) => {
    dbDebug("Could not connect to DB", err)
    console.log("Could not connect to DB", err)
  }
    );
