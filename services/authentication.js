const bip39 = require("bip39");
const _ = require("lodash");
const message = require("../lang/message");
const { Seed,validateSeed } = require("../models/seed");
const { VerifiedSeed, validateRequest } = require("../models/verifiedseed");
const { User,validatePassword,validateLogin,validateChangePassword} = require("../models/user");
const { hashPassword,comparePassword } = require('../helper/helper')

/********************* Generate random seed pharse **********************
 * @return {Array | seedArr}
 *
 ********************* Generate Random Seed Pharse **********************/
module.exports.generateRandomSeeds = async () => {
 // const error = validateSeed();
  // if (error)
  //   return { result: false, status: 400, message: error.details[0].message };
  //   const user = await User.find({
  //     _id: options.userId
  //   });
  //   if (user.length === 0)
  //     return { result: false, status: 202, message: message.INVALID_USER_ID };
  const seedStr = bip39.generateMnemonic(256)
  const seedArr = seedStr.split(" ");
  const modifiedArr = seedArr.map((el, i) => {
    return {
      id: i + 1,
      val: el,
    };
  });
  let seed = new Seed({
    seedPhrases: modifiedArr,
    seedString: seedStr,
   // userId: options.userId
  });
  let { seedPhrases, _id, isVerified, date } = await seed.save();

  return { result: true, status: 200, _id, seedPhrases, isVerified, date };
};

/********** Save Verified Seed Pharse With Devive Information ************
 * @param {Object} options
 *
 * @return {Object} seed
 *
 *********** Save Verified Seed Pharse With Device Information ***********/
module.exports.saveVerifiedSeedPhrase = async (options) => {
  const error = validateRequest(options);
  if (error)
    return { result: false, status: 400, message: error.details[0].message };

  const seeds = await Seed.find({
    _id: options.seedId,
    seedPhrases: options.seedPhrases,
  });
  if (seeds.length === 0)
    return { result: false, status: 302, message: message.SEED_NOT_VERIFIED };

  let verifiedSeed = new VerifiedSeed({
    imei1: options.imei1,
    imei2: options.imei2,
    deviceName: options.deviceName,
    seedPhrases: options.seedPhrases,
    seedUniqueId: options.seedUniqueId,
  });
  verifiedSeed = await verifiedSeed.save();
  return { result: true, status: 200, seed: verifiedSeed };
};

/********** Validate Seed Phrases ************
 * @param {Object} options
 *
 * @return {Object} seed
 *
 *********** Validate Seed Phrases ***********/

module.exports.validateSeed = async (options) => {
  const seeds = await Seed.find({
    _id: options.seedId,
    seedPhrases: options.seedPhrases,
  });
  if (seeds.length === 0)
    return { result: false, status: 400, error: message.SEED_NOT_VERIFIED };

  await Seed.findByIdAndUpdate(options.seedId, { isVerified: true });

  return { result: true, status: 200, message: message.SEED_VERIFIED };
};


/********** Create Password ************
 * @param {Object} options
 *
 * @return {Object} status, userId
 *
 *********** Create Password ***********/
 module.exports.createPassword = async (options) => {
  const error = validatePassword(options);
  if (error)
    return { result: false, status: 400, message: error.details[0].message };

   let encryptedPassword = await hashPassword(options.password)
  let user = new User({
    deviceName: options.deviceName,
    password: encryptedPassword
  });
  const{ _id } = await user.save();
  return { result: true, status: 200, userId: _id,message:message.CREATE_SUCCESSFULLY };
};

/********** Login ************
 * @param {Object} options
 *
 * @return {Object} status
 *
 *********** Login ***********/
 module.exports.login = async (options) => {
  const error = validateLogin(options);
  if (error)
    return { result: false, status: 400, message: error.details[0].message };
    const userDetail = await User.find({
      _id: options.userId,
    });
    if (userDetail.length === 0)
      return {
        result: false,
        status: 202,
        message: message.INVALID_USER_ID,
      };
   let compareResult = await comparePassword(options.password,userDetail[0].password)
  if(compareResult == false){
    return { result: false, status: 202,message:message.INVALID_PASSWORD };
  }
  return { result: true, status: 200,message:message.FETCH_SUCCESSFULLY };
};
/********** Change Password ************
 * @param {Object} options
 *
 * @return {Object} status
 *
 ***********  Change Password ***********/
 module.exports.changePassword = async (options) => {
  const error = validateChangePassword(options);
  if (error)
    return { result: false, status: 400, message: error.details[0].message };
    const userDetail = await User.find({
      _id: options.userId,
    });
    if (userDetail.length === 0)
      return {
        result: false,
        status: 202,
        message: message.INVALID_USER_ID,
      };
   let compareResult = await comparePassword(options.oldPassword,userDetail[0].password)
  if(compareResult == false){
    return { result: false, status: 202,message:message.INVALID_PASSWORD };
  }
  let encryptedPassword = await hashPassword(options.newPassword)
  const filter = { _id:  options.userId };
  const update = { password: encryptedPassword};
  let updatedValue = await User.findOneAndUpdate(
         filter,
         update,
         {
           new: true,
         }
       );
  return { result: true, status: 200,message:message.UPDATE_SUCCESSFULLY };
};
