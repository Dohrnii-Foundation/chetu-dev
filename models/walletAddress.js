const Joi = require("joi");
const mongoose = require("mongoose");

const WalletAddress = mongoose.model(
  "WalletAddress",
  new mongoose.Schema({
    imei1: {
      type: String
    },
    imei2: {
      type: String
    },
    deviceName: {
      type: String
    },
    seedId: {
      type: mongoose.Types.ObjectId,
      required: true 
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true
    },
    privateKey: {
      type: String,
      required: true
    },
    walletName: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateRequest(request) {
  let { error } = Joi.object({
    imei1: Joi.string(),
    imei2: Joi.string(),
    deviceName: Joi.string(),
    walletName: Joi.string().required(),
    seedId: Joi.string().required(),
  }).validate(request);

  return error;
}
function validateWalletDetailPayload(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required(),
    seedId: Joi.string().required(),
  }).validate(request);

  return error;
}
function validateWalletListPayload(request) {
  let { error } = Joi.object({
    seedId: Joi.string().required(),
  }).validate(request);

  return error;
}
function validateWalletUpdatePayload(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required(),
    walletName: Joi.string().required(),
  }).validate(request);

  return error;
}
module.exports.WalletAddress = WalletAddress;
module.exports.validateRequest = validateRequest;
module.exports.validateWalletDetailPayload = validateWalletDetailPayload;
module.exports.validateWalletListPayload = validateWalletListPayload;
module.exports.validateWalletUpdatePayload = validateWalletUpdatePayload;