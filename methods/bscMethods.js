const Web3 = require('web3');
const fs = require('fs');
const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')); // bsc test network
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const contractabiDHN = JSON.parse(fs.readFileSync("ABIBSCETHPOLY.json",'utf8'));
const contractAddressDHN = "0xa6dbFb9a95104A6bD622957e5FB9ea7FbdAC8fd4";
const { WalletAddress } = require("../models/walletAddress");
const { Token } = require("../models/token");
const message = require("../lang/message");
const { coinUsdValue,validateCoinShortNameBsc } = require("../helper/helper"); 

module.exports.bscMethod = async (req) => {
    const options = req.body;
    const error = validateBlockChainTransfer(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
        let coinShortName = await validateCoinShortNameBsc(options.coinShortName);
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
          if(coinShortName == 'BNB') {
            let senderAccountInWei = await web3.eth.getBalance(walletAddress)
            let receiverAccountInWei = await web3.eth.getBalance(options.walletAddressTo)
            let amount = await web3.utils.toWei((options.amount).toString(), 'ether');
                if(parseInt(senderAccountInWei) < parseInt(amount))
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
            let gasPrice = await web3.eth.getGasPrice()
            const gasLimit = 21000
            let gasConsumed = gasLimit * parseInt(gasPrice)
            let senderAccountInBnb = await web3.utils.fromWei(web3.utils.toBN(senderAccountInWei).toString(), 'ether')
            let gasInBnb = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether')
            let coinUpdatedValue = Number(senderAccountInBnb) - (options.amount + Number(gasInBnb));
        let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)             
       let filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'BNB', blockChain: 'BSC' }; 
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
        let receiverAccountInBnb = await web3.utils.fromWei(web3.utils.toBN(receiverAccountInWei).toString(), 'ether')
        let coinUpdatedValue = Number(receiverAccountInBnb) + options.amount
         let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)
           let filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'BNB', blockChain: 'BSC' }; 
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
         coinName: "BNB",
         blockChain: 'BSC'
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
    }else if(coinShortName == 'DHN'){
     // const walletAddress = "0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920";
      const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });
      let senderBalance = await contractDHN.methods.balanceOf(walletAddress).call();
      let receiverBalance = await contractDHN.methods.balanceOf(options.walletAddressTo).call();
      let amountInWei = await web3.utils.toWei((options.amount).toString(), 'ether');
      if(parseInt(senderBalance) < parseInt(amountInWei))
      return { result: false, status: 202, message: message.INSUFFICIENT_BALANCE }
    try{
      let count = await web3.eth.getTransactionCount(walletAddress)
      let gasPrice = await web3.eth.getGasPrice()
     
      let gasLimit = await contractDHN.methods.transfer(options.walletAddressTo, amountInWei).estimateGas({
          from: walletAddress,
          to: contractAddressDHN,
      });
     let data = contractDHN.methods.transfer(options.walletAddressTo, amountInWei).encodeABI()
     let payload = {
        from: walletAddress,    
        nonce: web3.utils.toHex(count),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
        to: contractAddressDHN,  
        data: data,
      };
     // const privateKey = '0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480'
      const signed = await web3.eth.accounts.signTransaction(payload, privateKey);
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      if(receipt){
        let senderBalanceInBnb = await web3.utils.fromWei(web3.utils.toBN(senderBalance).toString(),'ether')
        let coinUpdatedValue = parseInt(senderBalanceInBnb) - (options.amount );
      let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)              
     let filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'DHN',blockChain: 'BSC' }; 
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
        let receiverBalanceInBnb = await web3.utils.fromWei(web3.utils.toBN(receiverBalance).toString(),'ether')
          let coinUpdatedValue = parseInt(receiverBalanceInBnb) + options.amount
          let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)
          let filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'DHN',blockChain: 'BSC' };
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
        coinName: "Dohrnii",
        blockChain: 'BSC'
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
    }
  }

  module.exports.bscGas = async (req) => {
    const options = req.body;
    let coinShortName = await validateCoinShortNameBsc(options.coinShortName);
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
      let walletAddress = addressFrom[0].walletAddress;
      if(coinShortName == 'BNB'){
        let gasPrice = await web3.eth.getGasPrice()
        const gasLimit = 21000
        let gasConsumed = gasLimit * parseInt(gasPrice)
        let gasInBnb = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 
        return {
          result: true,
          status: 200,
          message: message.FETCH_SUCCESSFULLY,
          gasConsumed: gasInBnb,
          gasUnit:'BNB'
         }
      } else if(coinShortName == 'DHN'){
        const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });
        let amountInWei = await web3.utils.toWei((options.amount).toString(), 'ether');
        let gasPrice = await web3.eth.getGasPrice()
        let gasLimit = await contractDHN.methods.transfer(options.walletAddressTo, amountInWei).estimateGas({
            from: walletAddress,
            to: contractAddressDHN,
        });
        let gasConsumed = gasLimit * parseInt(gasPrice)
        let gasInBnb = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 
       return {
        result: true,
        status: 200,
        message: message.FETCH_SUCCESSFULLY,
        gasConsumed: gasInBnb,
        gasUnit:'BNB'
       }
      }
   } 