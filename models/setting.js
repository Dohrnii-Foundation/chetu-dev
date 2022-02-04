const Joi = require("joi");
const mongoose = require("mongoose");

const Support = mongoose.model(
  "Support",
  new mongoose.Schema({
    message: {
      type: String,
      required: true
    },
    walletAddress: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateMail(request) {
  let { error } = Joi.object({
    message: Joi.string().required(),
    walletAddress: Joi.string().required()
  }).validate(request);

  return error;
}

module.exports.Support = Support;
module.exports.validateMail = validateMail;
