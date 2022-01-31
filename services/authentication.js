const bip39 = require("bip39");
const _ = require("lodash");
const message = require("../lang/message");
const { Seed } = require("../models/seed");
const { VerifiedSeed, validateRequest } = require("../models/verifiedseed");

/********************* Generate random seed pharse **********************
 * @return {Array | seedArr}
 *
 ********************* Generate Random Seed Pharse **********************/
module.exports.generateRandomSeeds = async () => {
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
    seedString: seedStr
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

  await Seed.findByIdAndUpdate(options.seedId, { isVerified: "Y" });

  return { result: true, status: 200, message: message.SEED_VERIFIED };
};
