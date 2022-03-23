const Joi = require("joi");
const mongoose = require("mongoose");

const Seed = mongoose.model(
  "Seed",
  new mongoose.Schema({
    seedPhrases: {
      type: Array,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    seedString:{
      type: String,
      required: true
    },
    walletCreated:{
      type: Boolean,
      default: false
    },
    userId:{
      type: mongoose.Types.ObjectId,
     // required: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateSeed(seed) {
  let { error } = Joi.object({
    userId: Joi.string().required(),
  }).validate(seed);

  return error;
}

module.exports.Seed = Seed;
module.exports.validate = validateSeed;
