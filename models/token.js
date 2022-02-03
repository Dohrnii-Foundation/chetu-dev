const mongoose = require("mongoose");

const Token = mongoose.model(
  "Token",
  new mongoose.Schema({
    seedId: {
      type: mongoose.Types.ObjectId,
      required: true 
    },
    walletAddress: {
      type: String,
      required: true,
    },
    coinIcon: {
      type: String,
      default: "",
    },
    coinName: {
      type: String,
      required: true,
    },
    coinShortName: {
      type: String,
      required: true,
    },
    coinValue: {
      type: Number,
      default: 0,
    },
    coinUsdValue: {
      type: Number,
      default: 0,
    },
    coinStandard: {
      type: String,
      default:""
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);


module.exports.Token = Token;
