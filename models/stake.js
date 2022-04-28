const mongoose = require("mongoose");
const Joi = require("joi");

const Stake = mongoose.model(
  "Stake",
  new mongoose.Schema({
    userId: {
      type: mongoose.Types.ObjectId,
      required: true 
    },
    walletAddress: {
      type: String,
      required: true,
    },
    stakePeriod: {
      type: String,
      enum : ['3M','6M','12M'],
      required: true,
    },
    stakeId: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Number
    },
    endDate: {
      type: Number
    },
    token: {
      type: Number
    },
    withdraw: {
      type: Boolean,
      default: false,
    },
    blockChain: {
      type: String,
      enum : ['ETHEREUM','VECHAIN','BSC','POLYGON'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateStake(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required(),
    userId: Joi.string().required(),
    blockChain: Joi.string().required(),
    stakePeriod: Joi.string().required(),
    encryptedPrivateKey: Joi.string().required(),
    amount: Joi.number().required(),
  }).validate(request);

  return error;
}
function validateUnStake(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required(),
    userId: Joi.string().required(),
    blockChain: Joi.string().required(),
    stakePeriod: Joi.string().required(),
    encryptedPrivateKey: Joi.string().required(),
    stakeDbId: Joi.string().required(),
  }).validate(request);

  return error;
}
function validateStakeAvailableTokenPayload(request) {
  let { error } = Joi.object({
    walletAddress: Joi.string().required()
  }).validate(request);

  return error;
}
function validateStakeOveriew(request) {
  let { error } = Joi.object({
    blockChain: Joi.string().required(),
    walletAddress: Joi.string().required(),
  }).validate(request);

  return error;
}
function validateStakeDetail(request) {
  let { error } = Joi.object({
    blockChain: Joi.string().required(),
    walletAddress: Joi.string().required(),
    stakePeriod: Joi.string().required()
  }).validate(request);

  return error;
}
module.exports.Stake = Stake;
module.exports.validateStake = validateStake;
module.exports.validateStakeAvailableTokenPayload = validateStakeAvailableTokenPayload;
module.exports.validateStakeOveriew = validateStakeOveriew;
module.exports.validateStakeDetail = validateStakeDetail;
module.exports.validateUnStake = validateUnStake;