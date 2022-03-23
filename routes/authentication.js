const express = require("express");
const authentication = require("../services/authentication");
const router = express.Router();

/**
 * Generate random seed phrase.
 */
router.post("/seed", async (req, res, next) => {
  try {
   // const options = req.body;
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

/**
 * Create Password.
 */
 router.post("/create/password", async (req, res, next) => {
  try {
    const options = req.body;
    const result = await authentication.createPassword(options);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Login.
 */
 router.post("/login", async (req, res, next) => {
  try {
    const options = req.body;
    const result = await authentication.login(options);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Change Password.
 */
 router.post("/change/password", async (req, res, next) => {
  try {
    const options = req.body;
    const result = await authentication.changePassword(options);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
