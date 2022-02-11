const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/1e08f56f5e8f46c9be366f614b88f2ef')); // kovan test network
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const { WalletAddress } = require("../models/walletAddress");
const { Token } = require("../models/token");
const message = require("../lang/message");
const { coinUsdValue,validateCoinShortNameEthereum } = require("../helper/helper"); 

module.exports.ethereumMethod = async (req) => {

    const options = req.body;
    const error = validateBlockChainTransfer(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
        let coinShortName = await validateCoinShortNameEthereum(options.coinShortName);
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
          if(coinShortName == 'ETH') {
            let senderAccountInWei = await web3.eth.getBalance(walletAddress)
            let receiverAccountInWei = await web3.eth.getBalance(options.walletAddressTo)
            let amount = (options.amount * 10 **18).toString()
                if(senderAccountInWei < amount)
             return{
                result: false, status: 202, message: message.INSUFFICIENT_BALANCE   
             }
             try{
              let payload = {
               to: options.walletAddressTo, 
               value: amount, 
               gas: "21000", 
                   }; 
         let signed = await web3.eth.accounts.signTransaction(payload, privateKey);
        //submitting transaction to blockchain
        let receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
           if(receipt){
            let senderAccountInEth = await web3.utils.fromWei(web3.utils.toBN(senderAccountInWei).toString(), 'ether')
            let gasInEth = await web3.utils.fromWei(web3.utils.toBN(21000).toString(),'ether')
            let coinUpdatedValue = Number(senderAccountInEth) - (options.amount + Number(gasInEth));
        let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)                 
       let filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'ETH'  }; 
       let update_from = { coinValue: coinUpdatedValue, coinUsdValue: coinValue };
            //Update database
         await Token.findOneAndUpdate(
         filter_from,
         update_from,
         {
           new: true,
         }
       );
       if(addressTo.length > 0){
        let receiverAccountInEth = await web3.utils.fromWei(web3.utils.toBN(receiverAccountInWei).toString(), 'ether')
        let coinUpdatedValue = Number(receiverAccountInEth) + options.amount
         let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)
           let filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'ETH' }; 
           let update_to = { coinValue: coinUpdatedValue, coinUsdValue: coinValue };
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
         coinName: "Ethereum",
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
  }