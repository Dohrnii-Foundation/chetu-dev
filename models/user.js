const Joi = require("joi");
const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    password:{
      type: String,
      required: true
    },
    deviceName:{
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);


function validatePassword(user) {
  let { error } = Joi.object({
    password: Joi.string().required(),
    deviceName: Joi.string().required(),
  }).validate(user);

  return error;
}

function validateLogin(user) {
  let { error } = Joi.object({
    userId: Joi.string().required(),
    password: Joi.string().required(),
  }).validate(user);

  return error;
}
function validateChangePassword(user) {
  let { error } = Joi.object({
    userId: Joi.string().required(),
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }).validate(user);

  return error;
}

module.exports.User = User;
module.exports.validatePassword = validatePassword;
module.exports.validateLogin = validateLogin;
module.exports.validateChangePassword = validateChangePassword;