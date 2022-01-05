const express = require("express");
const web3 = require("../methods/ethereumMethods");
const veChain = require("../methods/veChainMethods");
const router = express.Router();

/**
 * Web3 connection check.
 */
router.post("/", async (req, res, next) => {
  try {
    const result = await web3.web3Method(req);
    console.log('in route result',result)
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * VeChain connection check.
 */
router.post("/vechain", async (req, res, next) => {
  try {
    const result = await veChain.veChainMethod(req);
    console.log('in route result',result)
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
