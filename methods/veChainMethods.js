const { thorify } = require('thorify');
const Web3 = require('web3');
const fs = require('fs');
//const web3 = thorify(new Web3(), "https://testnet.veblocks.net/"); // veChain test network
// const web3 = thorify(new Web3(), "https://sync-testnet.vechain.org/"); // veChain test network
//const web3 = thorify(new Web3(), "https://sync-testnet.veblocks.net/") // veChain test network
//const web3 = thorify(new Web3(), "http://3.71.71.72:8669/") // veChain test network
const web3 = thorify(new Web3(), "http://54.93.45.40:8669"); // veChain main network
//const contractAddressVECHAIN = "0x0867dd816763BB18e3B1838D8a69e366736e87a1";  //test network
const contractAddressVECHAIN = "0x8e57aadF0992AfCC41F7843656C6c7129f738F7b";  //main network
const contractAbiDHN = JSON.parse(fs.readFileSync("VeChainToken.json",'utf8'));      
const { Driver,SimpleWallet,SimpleNet } = require('@vechain/connex-driver');
const { Framework } = require('@vechain/connex-framework');
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const { WalletAddress } = require("../models/walletAddress");
const message = require("../lang/message");
const { coinUsdValue,validateCoinShortNameVechain } = require("../helper/helper");
const CryptoJS = require("crypto-js");

module.exports.veChainMethod = async (req) => {

    const options = req.body;
    const error = validateBlockChainTransfer(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
        let coinShortName = await validateCoinShortNameVechain(options.coinShortName);
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
      let privateKey //= '0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480'
      if(options.encryptedPrivateKey){
       let decyptedKey = CryptoJS.AES.decrypt(options.encryptedPrivateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString(CryptoJS.enc.Utf8);
        privateKey = decyptedKey
      }else{
        privateKey = addressFrom[0].privateKey;
      }
      let walletAddress = addressFrom[0].walletAddress;
      const wallet = new SimpleWallet();
      wallet.import(privateKey);
      //const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet) //test network
     const driver = await Driver.connect(new SimpleNet("http://54.93.45.40:8669"),wallet) // main network
      const connex = new Framework(Framework.guardDriver(driver))
      if(coinShortName == 'DHN'){
       // const walletAddress = "0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920";
        const balanceOfABI = { "constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
        const transferABI = { "constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}
        const balanceOfMethod = connex.thor.account(contractAddressVECHAIN).method(balanceOfABI)
        let senderBalance = await balanceOfMethod.call(walletAddress)
        let amountInWei = await web3.utils.toWei((options.amount).toString(), 'ether');
        if(parseInt(senderBalance.decoded.balance) < parseInt(amountInWei))
        return { result: false, status: 202, message: message.INSUFFICIENT_BALANCE }
      try{
        const transferMethod = connex.thor.account(contractAddressVECHAIN).method(transferABI);
        let t1 = transferMethod.asClause(options.walletAddressTo,amountInWei)
        const signingService = connex.vendor.sign('tx', [t1]);
        let response = await signingService.request();
        if(response){             
        let transactionHistory = new TransactionHistory({
          walletAddressTo: options.walletAddressTo,
          walletAddressFrom: options.walletAddressFrom,
          amount: options.amount,
          coinName: "Dohrnii",
          blockChain: 'VECHAIN',
          feeCoinShortName: 'VTHO',
          fee: options.fee,
          txId: response.txid 
        });
        await transactionHistory.save();
        return {
          result: true,
          status: 200,
          message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
          txId: response.txid
        };
        }
      }catch(err){
        return { result: false, status: 202, message:err.message }
      }      
    } else if(coinShortName == 'VET') {
            const senderAccount = connex.thor.account(walletAddress)
            let senderDetail = await senderAccount.get() 
            let senderBalance = web3.utils.toBN(senderDetail.balance).toString()
             let amountInHex ="0x" + (options.amount * 10 **18).toString(16);
             let amount = web3.utils.toBN(amountInHex).toString()
             if(parseInt(senderBalance) < parseInt(amount))
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
        let transactionHistory = new TransactionHistory({
          walletAddressTo: options.walletAddressTo,
          walletAddressFrom: options.walletAddressFrom,
          amount: options.amount,
          coinName: "VeChain",
          blockChain: 'VECHAIN',
          feeCoinShortName: 'VTHO',
          fee: options.fee,
          txId: response.txid 
        });
        await transactionHistory.save();
        return {
          result: true,
          status: 200,
          message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
          txId: response.txid 
        }; 
        }      
           } catch(err){
            return { result: false, status: 202, message:err.message }
           }    
    } else if(coinShortName == 'VTHO') {
      const transferABI = {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}
      const senderAccount = connex.thor.account(walletAddress)
      let senderDetail = await senderAccount.get() 
      let senderEnergy = web3.utils.toBN(senderDetail.energy).toString()
      let amountInHex ="0x" + (options.amount * 10 **18).toString(16);
      let amount = web3.utils.toBN(amountInHex).toString()
       if(Number(senderEnergy) < Number(amount))
       return{
          result: false, status: 202, message: message.INSUFFICIENT_BALANCE   
       }
  try{
           // transfer VTHO token
  const transferMethod = connex.thor.account(walletAddress).method(transferABI)
  const energyClause = transferMethod.asClause(options.walletAddressTo, amount)
  const signingService = connex.vendor.sign('tx', [energyClause]);
  let response = await signingService.request();
  if(response){          

  let transactionHistory = new TransactionHistory({
    walletAddressTo: options.walletAddressTo,
    walletAddressFrom: options.walletAddressFrom,
    amount: options.amount,
    coinName: "VeThor Token",
    blockChain: 'VECHAIN',
    feeCoinShortName: 'VTHO',
    fee: options.fee,
    txId: response.txid  
  });
  await transactionHistory.save();
  return {
    result: true,
    status: 200,
    message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
    txId: response.txid
    }; 
  }      
     } catch(err){
      return { result: false, status: 202, message:err.message }
     }    
  }     
};

module.exports.veChainGas = async (req) => {
  const options = req.body;
  let coinShortName = await validateCoinShortNameVechain(options.coinShortName);
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
    // let walletAddress = addressFrom[0].walletAddress;
    //   const gasPriceCoef = 128
    //   const gasLimit = 21000
    if(coinShortName == 'VET'){
     // let gasConsumed = gasLimit * gasPriceCoef
      let gasInVtho = '0.4'//= await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 

      return {
        result: true,
        status: 200,
        message: message.THIS_TRANSACTION_WILL_COST_YOU,
        gasConsumed: gasInVtho,
        gasUnit:'VTHO'
       }
    } else if(coinShortName == 'VTHO'){
     // let gasConsumed = gasLimit * gasPriceCoef
      let gasInVtho = '0.4'//= await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 
     return {
      result: true,
      status: 200,
      message: message.THIS_TRANSACTION_WILL_COST_YOU,
      gasConsumed: gasInVtho,
      gasUnit:'VTHO'
     }
    } else if(coinShortName == 'DHN'){
    //   const contractDHN = new web3.eth.Contract(contractAbiDHN,contractAddressVECHAIN, { from: walletAddress });
    //   let amountInWei = await web3.utils.toWei((options.amount).toString(), 'ether');
    //   let data = contractDHN.methods.transfer(options.walletAddressTo, amountInWei).encodeABI()
    //   const clauses =  [{
    //     to: options.walletAddressTo,
    //     value: options.amount,
    //     data: data
    // }]
    // calc intrinsic gas
    // const gasLimit = Transaction.intrinsicGas(clauses)
    // let gasConsumed = gasLimit * gasPriceCoef
    let gasInVtho = '0.4'//= await web3.utils.fromWei(web3.utils.toBN(gasConsumed),'ether') 

     return {
      result: true,
      status: 200,
      message: message.THIS_TRANSACTION_WILL_COST_YOU,
      gasConsumed: gasInVtho,
      gasUnit:'VTHO'
     }
    }
 } 
 module.exports.veChainToken = async (walletAddress,coinShortName) => {

      let coinShortNameReturn = await validateCoinShortNameVechain(coinShortName);
      if(coinShortNameReturn == 'INVALID')
      return{ result: false, status: 202, message: message.INVALID_COIN_SHORT_NAME }
       
    const wallet = new SimpleWallet();
   // const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet) //test network
     const driver = await Driver.connect(new SimpleNet("http://54.93.45.40:8669"),wallet) // main network
    const connex = new Framework(Framework.guardDriver(driver))
    if(coinShortName == 'DHN'){
      //const walletAddress = "0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920";
      const balanceOfABI = { "constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
      const balanceOfMethod = connex.thor.account(contractAddressVECHAIN).method(balanceOfABI)
      let senderBalance = await balanceOfMethod.call(walletAddress)
      let senderBalanceInVet = await web3.utils.fromWei(web3.utils.toBN(senderBalance.decoded.balance).toString(), 'ether')
    try{
      let coinBalance = Number(senderBalanceInVet)
      let coinValueUsd = await coinUsdValue(coinShortName,coinBalance)              
      return {
        coinId: 1,
        coinIcon: "api.dohrniiwallet.ch/dhn.png",
        coinName: "Dohrnii",
        coinShortName: "DHN",
        coinValue: coinBalance,
        coinUsdValue: coinValueUsd,
        coinStandard: "VET",
        blockChain: "VECHAIN"
      };
    }catch(err){
      return { result: false, status: 202, message:err.message }
    }      
  } else if(coinShortName == 'VET') {
          const senderAccount = connex.thor.account(walletAddress)
          let senderDetail = await senderAccount.get() 
          let senderBalance = web3.utils.toBN(senderDetail.balance).toString()
      try{
      let coinBalance = Number(web3.utils.fromWei(senderBalance, 'ether'));
       let coinValueUsd = await coinUsdValue(coinShortName,coinBalance)                   
      return {
        coinId: 2,
        coinIcon: "api.dohrniiwallet.ch/veChain.png",
        coinName: "VeChain",
        coinShortName: "VET",
        coinValue: coinBalance,
        coinUsdValue: coinValueUsd,
        coinStandard: "VET",
        blockChain: "VECHAIN"
      };    
         } catch(err){
          return { result: false, status: 202, message:err.message }
         }    
  } else if(coinShortName == 'VTHO') {
    const senderAccount = connex.thor.account(walletAddress)
    let senderDetail = await senderAccount.get() 
    let senderEnergy = web3.utils.toBN(senderDetail.energy).toString()
try{
  let coinBalance = Number(web3.utils.fromWei(senderEnergy, 'ether'))
  let coinValueUsd = await coinUsdValue(coinShortName,coinBalance)               
return {
        coinId: 3,
        coinIcon: "api.dohrniiwallet.ch/vtho.png",
        coinName: "VeThor Token",
        coinShortName: "VTHO",
        coinValue: coinBalance,
        coinUsdValue: coinValueUsd,
        coinStandard: "VET",
        blockChain: "VECHAIN"
  }; 
    
   } catch(err){
    return { result: false, status: 202, message:err.message }
   }    
}     
};
