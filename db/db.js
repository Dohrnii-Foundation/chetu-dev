const mongoose = require("mongoose");
const config = require("config");
const dbDebug = require("debug")("app:db");

mongoose
  .connect(
    `mongodb+srv://${config.get("dbConfig.userName")}:${config.get(
      "dbConfig.password"
    )}@${config.get("dbConfig.host")}/${config.get(
      "dbConfig.dbName"
    )}?retryWrites=true&w=majority`
  )
  .then(() => {
    dbDebug("Connected to DB...");
  })
  .catch((err) => dbDebug("Could not connect to DB", err));
