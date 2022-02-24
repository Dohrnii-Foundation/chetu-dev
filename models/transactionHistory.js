const Joi = require("joi");
const mongoose = require("mongoose");

const TransactionHistory = mongoose.model(
  "TransactionHistory",
  new mongoose.Schema({
    walletAddressTo: {
      type: String,
      required: true,
    },
    walletAddressFrom: {
      type: String,
      required: true,
    },
    seedIdTo: {
      type: mongoose.Types.ObjectId,
    },
    seedIdFrom: {
      type: mongoose.Types.ObjectId,
    },
    amount: {
      type: Number,
      required: true,
    },
    coinName: {
      type: String,
      required: true,
    },
    blockChain: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);
function validateTransfer(request) {
  let { error } = Joi.object({
    walletAddressTo: Joi.string().required(),
    walletAddressFrom: Joi.string().required(),
    amount: Joi.number().required(),
  }).validate(request);

  return error;
}
function validateBlockChainTransfer(request) {
  let { error } = Joi.object({
    walletAddressTo: Joi.string().required(),
    walletAddressFrom: Joi.string().required(),
    amount: Joi.number().required(),
    coinShortName: Joi.string().required(),
    blockChain: Joi.string()
  }).validate(request);

  return error;
}
function validateTransferPayload(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required(),
    transactionType: Joi.string().required()
  }).validate(request);

  return error;
}
module.exports.TransactionHistory = TransactionHistory;
module.exports.validateTransfer = validateTransfer;
module.exports.validateTransferPayload = validateTransferPayload;
module.exports.validateBlockChainTransfer = validateBlockChainTransfer;