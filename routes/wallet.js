const express = require("express");
const wallet = require("../services/wallet");
const router = express.Router();

/**
 * Create Wallet.
 */
router.post("/create", async (req, res, next) => {
  try {
    const result = await wallet.createWalletByBSC(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * Transfer token.
 */
router.post("/transfertoken", async (req, res, next) => {
  try {
    //In this API, we are working with mock request/ response data,we will replace this with the actual data later.
    const result = await wallet.createTransfer(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * Get Wallet Detail.
 */
router.post("/walletdetail", async (req, res, next) => {
  try {
  //In this API, we are working with mock request/ response data,we will replace this with the actual data later.
    const result = await wallet.walletDetail(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * Get Wallet List.
 */
router.post("/walletlist", async (req, res, next) => {
  try {
    //In this API, we are working with mock request/ response data,we will replace this with the actual data later.
    const result = await wallet.walletList(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * Get Transaction history.
 */
router.post("/transactionhistory", async (req, res, next) => {
  try {
    //In this API, we are working with mock request/ response data,we will replace this with the actual data later.
    const result = await wallet.walletTransactionHistory(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
