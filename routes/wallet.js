const express = require("express");
const wallet = require("../services/wallet");
const veChain= require('../methods/veChainMethods');
const ethereum = require('../methods/ethereumMethods');
const message = require('../lang/message');
const {validateBlockChain} = require('../helper/helper');
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
       let options = req.body
       if(options.blockChain == undefined ){
        res.status(202).send({result: false, status: 202, message: message.INVALID_BLOCK_CHAIN});
       }
      let blockChain  = await validateBlockChain(options)
      if(blockChain == 'INVALID'){
        res.status(202).send({result: false, status: 202, message: message.INVALID_BLOCK_CHAIN});
       }
       if(blockChain == 'ETHEREUM'){
        const result = await ethereum.ethereumMethod(req);
        res.status(result.status || 200).send(result);
       }else if(blockChain == 'VECHAIN'){
        const result = await veChain.veChainMethod(req)
        res.status(result.status || 200).send(result);     
       }
    
  } catch (err) {
    next(err);
  }
});
/**
 * Get Wallet Detail.
 */
router.post("/walletdetail", async (req, res, next) => {
  try {
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
    const result = await wallet.walletTransactionHistory(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});
/**
 * Update Wallet.
 */
 router.put("/update", async (req, res, next) => {
  try {
    const result = await wallet.updateWallet(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
