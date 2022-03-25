const Web3 = require('web3');
const fs = require('fs');
//const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')); // bsc test network
const web3 = new Web3(new Web3.providers.HttpProvider(' https://bsc-dataseed.binance.org/')); // bsc main network
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const contractabiDHN = JSON.parse(fs.readFileSync("ABIBSCETHPOLY.json",'utf8'));
//const contractAddressDHN = "0xa6dbFb9a95104A6bD622957e5FB9ea7FbdAC8fd4"; //test network
const contractAddressDHN = "0xff8BBc599EA030AA69d0298035dFE263740a95bC"; //main network
const { WalletAddress } = require("../models/walletAddress");
const message = require("../lang/message");
const { coinUsdValue,validateCoinShortNameBsc } = require("../helper/helper"); 
const CryptoJS = require("crypto-js");

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
          let privateKey
          if(options.encryptedPrivateKey){
           let decyptedKey = CryptoJS.AES.decrypt(options.encryptedPrivateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString(CryptoJS.enc.Utf8);
            privateKey = decyptedKey
          }else{
            privateKey = addressFrom[0].privateKey;
          }
          let walletAddress = addressFrom[0].walletAddress;
          if(coinShortName == 'BNB') {
            let senderAccountInWei = await web3.eth.getBalance(walletAddress)
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
  
       let transactionHistory = new TransactionHistory({
         walletAddressTo: options.walletAddressTo,
         walletAddressFrom: options.walletAddressFrom,
         amount: options.amount,
         coinName: "BNB",
         blockChain: 'BSC',
         feeCoinShortName: 'BNB',
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
      //const walletAddress = "0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920";
      const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });
      let senderBalance = await contractDHN.methods.balanceOf(walletAddress).call();
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
 
      let transactionHistory = new TransactionHistory({
        walletAddressTo: options.walletAddressTo,
        walletAddressFrom: options.walletAddressFrom,
        amount: options.amount,
        coinName: "Dohrnii",
        blockChain: 'BSC',
        feeCoinShortName: 'BNB',
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

   module.exports.bscToken = async (walletAddress,coinShortName) => {

        let coinShortNameReturn = await validateCoinShortNameBsc(coinShortName);
        if(coinShortNameReturn == 'INVALID')
        return{ result: false, status: 202, message: message.INVALID_COIN_SHORT_NAME }

          if(coinShortName == 'BNB') {
            let senderBalanceInWei = await web3.eth.getBalance(walletAddress)
             try{
         let senderBalanceInBnb = await web3.utils.fromWei(web3.utils.toBN(senderBalanceInWei).toString(), 'ether')
         let coinValueUsd = await coinUsdValue(coinShortName,Number(senderBalanceInBnb) )             
  
       return {
        coinId: 7,
        coinIcon: "api.dohrniiwallet.ch/bnb.png",
        coinName: "BNB",
        coinShortName: "BNB",
        coinValue: Number(senderBalanceInBnb),
        coinUsdValue: coinValueUsd,
        coinStandard: "BEP-20",
        blockChain: "BSC"
         };     
             } catch(err){
              return { result: false, status: 202, message:err.message }
             }
    }else if(coinShortName == 'DHN'){
      const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });
      let senderBalance = await contractDHN.methods.balanceOf(walletAddress).call();
    try{
        let senderBalanceInBnb = await web3.utils.fromWei(web3.utils.toBN(senderBalance).toString(),'ether')
        let coinValueUsd = await coinUsdValue(coinShortName,Number(senderBalanceInBnb))              
      return {
        coinId: 6,
        coinIcon: "api.dohrniiwallet.ch/dhn.png",
        coinName: "Dohrnii",
        coinShortName: "DHN",
        coinValue: Number(senderBalanceInBnb),
        coinUsdValue: coinValueUsd,
        coinStandard: "BEP-20",
        blockChain: "BSC"
      };   
    }catch(err){
      return { result: false, status: 202, message:err.message }
     } 
    }
  }