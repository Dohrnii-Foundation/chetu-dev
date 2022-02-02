const { thorify } = require('thorify');
const Web3 = require('web3');
//const web3 = thorify(new Web3(), "https://testnet.veblocks.net/"); // veChain test network
// const web3 = thorify(new Web3(), "https://sync-testnet.vechain.org/"); // veChain test network
//const web3 = thorify(new Web3(), "https://sync-testnet.veblocks.net/") // veChain test network
const web3 = thorify(new Web3(), "http://3.71.71.72:8669/") // veChain test network
//const web3 = thorify(new Web3(), "http://3.124.193.149:8669"); // veChain main network
const fs = require('fs');
const contractAbiVECHAIN = JSON.parse(fs.readFileSync("VeChainToken.json",'utf8'));
const contractAddressVECHAIN = "0x0867dd816763BB18e3B1838D8a69e366736e87a1";      
const { Driver,SimpleWallet,SimpleNet } = require('@vechain/connex-driver');
const { Framework } = require('@vechain/connex-framework');
const { TransactionHistory, validateVechainTransfer } = require("../models/transactionHistory");
const { WalletAddress } = require("../models/walletAddress");
const { Token } = require("../models/token");
const message = require("../lang/message");

module.exports.veChainMethod = async (req) => {

    const options = req.body;
    const error = validateVechainTransfer(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
        let coinShortName = await validateCoinShortName(options.coinShortName);
        if(coinShortName == 'INVALID')
        return{ result: false, status: 202, message: message.INVALID_COIN_SHORT_NAME }
         
      const addressFrom = await WalletAddress.find({
        walletAddress: options.walletAddressFrom
      });
      if (addressFrom.length === 0)
      return {
        result: false,
        status: 202,
        message: message.INVALID_WALLET_ADDRESS,
      };
      const addressTo = await WalletAddress.find({
        walletAddress: options.walletAddressTo
      });
      let privateKey = addressFrom[0].privateKey;
      let walletAddress = addressFrom[0].walletAddress;
      const wallet = new SimpleWallet();
      wallet.import(privateKey);
      const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet)
      const connex = new Framework(Framework.guardDriver(driver))
      if(coinShortName == 'DHN'){
      
        const balanceOfABI = { "constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
        const transferABI = { "constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}
        const balanceOfMethod = connex.thor.account(contractAddressVECHAIN).method(balanceOfABI)
        let senderBalance = await balanceOfMethod.call(walletAddress)
        let receiverBalance = await balanceOfMethod.call(options.walletAddressTo)
  
        if(Number(senderBalance.decoded.balance) < options.amount)
        return { result: false, status: 202, message: message.INSUFFICIENT_BALANCE }
      try{
        const transferMethod = connex.thor.account(contractAddressVECHAIN).method(transferABI);
        let t1 = transferMethod.asClause(options.walletAddressTo,options.amount)
        const signingService = connex.vendor.sign('tx', [t1]);
        let response = await signingService.request();
        if(response){
            //Update database
        const filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'DHN'  }; 
        const update_from = { coinValue: Number(senderBalance.decoded.balance) - options.amount };
      
          await Token.findOneAndUpdate(
          filter_from,
          update_from,
          {
            new: true,
          }
        );
        if(addressTo.length > 0){
            const filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'DHN' }; 
            const update_to = { coinValue: Number(receiverBalance.decoded.balance) + options.amount };
            await Token.findOneAndUpdate(
                filter_to,
                update_to,
                {
                  new: true,
                }
              );
        }
   
        let transactionHistory = new TransactionHistory({
          walletAddressTo: options.walletAddressTo,
          walletAddressFrom: options.walletAddressFrom,
          amount: options.amount,
          coinName: "Dohrnii Coin",
        });
        await transactionHistory.save();
        return {
          result: true,
          status: 200,
          message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
        };
        }
      }catch(err){
        return { result: false, status: 202, message:err.message }
      }      
    } else if(coinShortName == 'VET') {
            const senderAccount = connex.thor.account(walletAddress)
            let senderDetail = await senderAccount.get() 
            let senderBalance = web3.utils.toBN(senderDetail.balance).toString()
            const receiverAccount = connex.thor.account(options.walletAddressTo)
            let receiverDetail = await receiverAccount.get() 
            let receiverBalance = web3.utils.toBN(receiverDetail.balance).toString()
             let amountInHex ="0x" + (options.amount * 10 **18).toString(16);
             let amount = web3.utils.toBN(amountInHex).toString()
             if(senderBalance < amount)
             return{
                result: false, status: 202, message: message.INSUFFICIENT_BALANCE   
             }
        try{
                 // transfer VET token
         let payload = {
         to: options.walletAddressTo,
         value: amountInHex
         };
        const signingService = connex.vendor.sign('tx', [payload]);
        let response = await signingService.request();
        if(response){
                   //Update database
        const filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'VET'  }; 
        const update_from = { coinValue: Number(web3.utils.fromWei(senderBalance, 'ether')) - options.amount };
      
          await Token.findOneAndUpdate(
          filter_from,
          update_from,
          {
            new: true,
          }
        );
        if(addressTo.length > 0){
            const filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'VET' }; 
            const update_to = { coinValue: Number(web3.utils.fromWei(receiverBalance, 'ether')) + options.amount };
            await Token.findOneAndUpdate(
                filter_to,
                update_to,
                {
                  new: true,
                }
              );
        }
   
        let transactionHistory = new TransactionHistory({
          walletAddressTo: options.walletAddressTo,
          walletAddressFrom: options.walletAddressFrom,
          amount: options.amount,
          coinName: "VeChain",
        });
        await transactionHistory.save();
        return {
          result: true,
          status: 200,
          message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
        }; 
        }      
           } catch(err){
            return { result: false, status: 202, message:err.message }
           }    
    }   
};

function validateCoinShortName(coin){
    let coinValue
            switch (coin) {
                case 'VET': 
                    coinValue = 'VET'
                    break;
                case 'VTHO': 
                    coinValue = 'VTHO'
                    break;
                case 'DHN': 
                    coinValue = 'DHN'
                    break;
                default: 
                    coinValue = 'INVALID'
                }
                return coinValue
}