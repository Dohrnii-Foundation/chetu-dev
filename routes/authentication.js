const express = require("express");
const authentication = require("../services/authentication");
const router = express.Router();

/**
 * Generate random seed phrase.
 */
router.post("/seed", async (req, res, next) => {
  try {
    const result = await authentication.generateRandomSeeds();
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Validate seed phrases.
 */
router.post("/validateSeed", async (req, res, next) => {
  try {
    const options = req.body;
    const result = await authentication.validateSeed(options);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Store Matched Seed Phrase With Device Information.
 */
router.post("/saveSeedPhrase", async (req, res, next) => {
  try {
    const options = req.body;
    const result = await authentication.saveVerifiedSeedPhrase(options);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
