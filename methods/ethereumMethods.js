const Web3 = require('web3');
const fs = require('fs');
const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/1e08f56f5e8f46c9be366f614b88f2ef')); // rinkeby test network
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const contractabiDHN = JSON.parse(fs.readFileSync("ABIBSCETHPOLY.json",'utf8'));
const contractAddressDHN = "0x0d7c93752eA82628d9b1270cB49cC435B3701F46";
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
            let senderAccountInEth = await web3.utils.fromWei(web3.utils.toBN(senderAccountInWei).toString(), 'ether')
            let gasInEth = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether')
            let coinUpdatedValue = Number(senderAccountInEth) - (options.amount + Number(gasInEth));
        let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)                 
       let filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'ETH', blockChain: 'ETHEREUM'  }; 
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
           let filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'ETH',blockChain: 'ETHEREUM'  }; 
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
         blockChain: 'ETHEREUM',
         feeCoinShortName: 'ETH',
         fee: options.fee  
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
       const signed = await web3.eth.accounts.signTransaction(payload, privateKey);
       const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
       if(receipt){
         let senderBalanceInEth = await web3.utils.fromWei(web3.utils.toBN(senderBalance).toString(),'ether')
         let coinUpdatedValue = parseInt(senderBalanceInEth) - (options.amount );
       let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)
      let filter_from = { walletAddress: options.walletAddressFrom, coinShortName: 'DHN',blockChain: 'ETHEREUM' }; 
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
         let receiverBalanceInEth = await web3.utils.fromWei(web3.utils.toBN(receiverBalance).toString(),'ether')
           let coinUpdatedValue = parseInt(receiverBalanceInEth) + options.amount
           let coinValue = await coinUsdValue(coinShortName,coinUpdatedValue)
           let filter_to = { walletAddress: options.walletAddressTo, coinShortName: 'DHN',blockChain: 'ETHEREUM' };
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
         blockChain: 'ETHEREUM',
         feeCoinShortName: 'ETH',
         fee: options.fee 
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

 module.exports.ethereumGas = async (req) => {
  const options = req.body;
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
    let walletAddress = addressFrom[0].walletAddress;
    if(coinShortName == 'ETH'){
      let gasPrice = await web3.eth.getGasPrice()
      const gasLimit = 21000
      let gasConsumed = gasLimit * parseInt(gasPrice)
      let gasInEth = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 
      return {
        result: true,
        status: 200,
        message: message.FETCH_SUCCESSFULLY,
        gasConsumed: gasInEth,
        gasUnit:'ETH'
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
      let gasInEth = await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 
     return {
      result: true,
      status: 200,
      message: message.FETCH_SUCCESSFULLY,
      gasConsumed: gasInEth,
      gasUnit:'ETH'
     }
    }
 } 

 module.exports.ethereumToken = async (walletAddress,coinShortName) => {

      let coinShortNameReturn = await validateCoinShortNameEthereum(coinShortName);
      if(coinShortNameReturn == 'INVALID')
      return{ result: false, status: 202, message: message.INVALID_COIN_SHORT_NAME }

        if(coinShortName == 'ETH') {
          let senderAccountInWei = await web3.eth.getBalance(walletAddress)
           try{
          let senderBalanceInEth = await web3.utils.fromWei(web3.utils.toBN(senderAccountInWei).toString(), 'ether')
      let coinValueUsd = await coinUsdValue(coinShortName,Number(senderBalanceInEth))                 
     return {
        coinId: 5,
        coinIcon: "api.dohrniiwallet.ch/ether.PNG",
        coinName: "Ethereum",
        coinShortName: "ETH",
        coinValue: Number(senderBalanceInEth),
        coinUsdValue: coinValueUsd,
        coinStandard: "",
        blockChain: "ETHEREUM"
       }; 
           } catch(err){
            return { result: false, status: 202, message:err.message }
           }
  }else if(coinShortName == 'DHN'){
     const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });
     let senderBalance = await contractDHN.methods.balanceOf(walletAddress).call();
   try{
       let senderBalanceInEth = await web3.utils.fromWei(web3.utils.toBN(senderBalance).toString(),'ether')
     let coinValueUsd = await coinUsdValue(coinShortName,Number(senderBalanceInEth))
     return {
      coinId: 4,
      coinIcon: "api.dohrniiwallet.ch/dai.png",
      coinName: "Dohrnii",
      coinShortName: "DHN",
      coinValue: Number(senderBalanceInEth),
      coinUsdValue: coinValueUsd,
      coinStandard: "ERC-20",
      blockChain: "ETHEREUM"
     };
    
   }catch(err){
     return { result: false, status: 202, message:err.message }
    } 
   }
}