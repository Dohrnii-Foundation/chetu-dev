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
      type: String,
      default: "N",
    },
    seedString:{
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validateSeed(seed) {
  let { error } = Joi.object({
    seeds: Joi.array().required(),
  }).validate(seed);

  return error;
}

module.exports.Seed = Seed;
module.exports.validate = validateSeed;
