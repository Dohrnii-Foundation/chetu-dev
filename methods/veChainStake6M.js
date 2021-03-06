const { thorify } = require('thorify');
const Web3 = require('web3');
const fs = require('fs');
//const web3 = thorify(new Web3(), "http://3.71.71.72:8669/") // veChain test network
const web3 = thorify(new Web3(), "http://54.93.45.40:8669"); // veChain main network
//const contractAddressVECHAIN = "0x0867dd816763BB18e3B1838D8a69e366736e87a1";  //test network
const contractAddressVECHAIN = "0x8e57aadF0992AfCC41F7843656C6c7129f738F7b";  //main network
//const contractAddressStake = "0x9A849566209d78784eC42701DE203D4b9502f2A4"; //6months  testnet
const contractAddressStake = "0x732C69E4cb74279E1a9A6f31764D2C4668e1cba1"; //6months  mainnet
const contractAbiStake = JSON.parse(fs.readFileSync("ABI.json",'utf8'));   
const contractAbiDHN = JSON.parse(fs.readFileSync("VeChainToken.json",'utf8'));     
const { Driver,SimpleWallet,SimpleNet } = require('@vechain/connex-driver');
const { Framework } = require('@vechain/connex-framework');
const { Stake } = require("../models/stake");
const message = require("../lang/message");
const { signTransaction,axiosGet,verifyUserAddress,untilLockingEnd,delay  } = require("../helper/helper");
const CryptoJS = require("crypto-js");
const { TransactionHistory } = require("../models/transactionHistory");

module.exports.veChainStake6M = async (options) => {
   let walletAddress = options.walletAddress
// const walletAddress = '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'
  let privateKey //= '0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480'
  let decyptedKey = CryptoJS.AES.decrypt(options.encryptedPrivateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString(CryptoJS.enc.Utf8);
      privateKey = decyptedKey
   const wallet = new SimpleWallet();
      wallet.import(privateKey);
   //const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet) //test network
   const driver = await Driver.connect(new SimpleNet("http://54.93.45.40:8669"),wallet) //main network
   const connex = new Framework(Framework.guardDriver(driver))
     const balanceOfABI = { "constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
     const balanceOfMethod = connex.thor.account(contractAddressVECHAIN).method(balanceOfABI)
    let senderBalance = await balanceOfMethod.call(walletAddress)
    let amountInWei = await web3.utils.toWei((options.amount).toString(), 'ether');
    if(parseInt(senderBalance.decoded.balance) < parseInt(amountInWei))
    return { result: false, status: 202, message: message.INSUFFICIENT_BALANCE }
    const senderAccount = connex.thor.account(walletAddress)
    let senderDetail = await senderAccount.get() 
    let senderEnergy = web3.utils.toBN(senderDetail.energy).toString()
    if(Number(senderEnergy) < Number('2000000000000000000'))
    return { result: false, status: 202, message: message.INSUFFICIENT_ENERGY }
    const approveABI = {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }

    const stakeABI = {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "stake",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    } 
     try{
      const approveMethod = connex.thor.account(contractAddressVECHAIN).method(approveABI);
      let t1 = approveMethod.asClause(contractAddressStake,amountInWei)
      const signingService = connex.vendor.sign('tx', [t1]);
      let approveResponse = await signTransaction(signingService);
      if(approveResponse){             
      const stakeMethod = connex.thor.account(contractAddressStake).method(stakeABI);
     let t1 = stakeMethod.asClause(amountInWei)
     const signingService = connex.vendor.sign('tx', [t1]);
     let stakeResponse = await signTransaction(signingService);

     if(stakeResponse){  
     // const currentDate = new Date();
      let startTimestamp = Date.now()
     // let maturityTimestamp = startTimestamp + 100000// test network
      let maturityTimestamp = startTimestamp + (86400000 * 183)// main network

       //hold functionality for 11 seconds
       await delay(11000)
     // call swagger API to get Stake length //
     // const url = 'http://3.71.71.72:8669/accounts/0x9A849566209d78784eC42701DE203D4b9502f2A4/storage/0x0000000000000000000000000000000000000000000000000000000000000005' // test network

      const url = 'http://54.93.45.40:8669/accounts/0x732C69E4cb74279E1a9A6f31764D2C4668e1cba1/storage/0x0000000000000000000000000000000000000000000000000000000000000005' // main network
      let response 
          response = await axiosGet(url);
      let stakeId = 0
      if(response.data){
        // console.log('respnse.data;;;;',response.data)
        // console.log(Number(web3.utils.toBN(response.data.value).toString()) - 1)
        stakeId = Number(web3.utils.toBN(response.data.value).toString()) - 1

      // call stakes method to verify the account address //  
      const contractStakeDHN = new web3.eth.Contract(contractAbiStake,contractAddressStake, { from: walletAddress });
      const iterate = async _ => {
        console.log('Start')
          for(let i=0; i< 10; i++){
            let userDetail = await verifyUserAddress(contractStakeDHN,stakeId)
            if(userDetail.user == walletAddress){
              console.log('user matched')
              break;
               }
             stakeId = stakeId - 1 
               }
               console.log('End')
             }
             await Promise.all([iterate()])
             // console.log('stakeId after promise.all;;;',stakeId)
               // check if record already exists
               const stakeRecord = await Stake.find({
                stakePeriod: options.stakePeriod,
                stakeId: stakeId,
              });
              if (stakeRecord.length !== 0)
                return { result: false, status: 202, error: message.SOMETHING_WENT_WRONG_TRY_AGAIN };
             // save stake record in database // 
               let stake = new Stake({
              userId: options.userId,
              walletAddress: options.walletAddress,
              stakePeriod: options.stakePeriod,
              stakeId: stakeId, 
              startDate: startTimestamp, 
              endDate: maturityTimestamp, 
              blockChain: options.blockChain,
              token: options.amount
            });
        await stake.save(); 
         // save stake record in transaction collection
         let transactionHistory = new TransactionHistory({
          walletAddressTo: contractAddressStake,
          walletAddressFrom: options.walletAddress,
          amount: options.amount,
          coinName: "Dohrnii",
          blockChain: 'VECHAIN',
          feeCoinShortName: 'VTHO',
          fee: '0.4',
          txId: stakeResponse.txid 
        });
        await transactionHistory.save();
        return {
          result: true,
          status: 200,
          message: message.STAKE_SUCCESSFULLY,
            };
              }
         } 
       }
     } catch (err){          
      return { result: false, status: 202, message:err.message }
     }    
 } 
 module.exports.veChainUnStake6M = async (options) => {
  let walletAddress = options.walletAddress 
  let stakePeriod = options.stakePeriod  
  let stakeDbId = options.stakeDbId;
  const stakeDetail = await Stake.find({
    _id: stakeDbId, stakePeriod: stakePeriod
  });
  if (stakeDetail.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_STAKE_ID_WITH_STAKE_PERIOD
    };
    if(stakeDetail[0].withdraw === true)
    return {
      result: false,
      status: 202,
      message: message.STAKE_ALREADY_WITHDRAW
    };
  //  const walletAddress = '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'
    let privateKey //= '0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480'
    let decyptedKey = CryptoJS.AES.decrypt(options.encryptedPrivateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString(CryptoJS.enc.Utf8);
        privateKey = decyptedKey
     const wallet = new SimpleWallet();
        wallet.import(privateKey);
    // const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet) //test network
     const driver = await Driver.connect(new SimpleNet("http://54.93.45.40:8669"),wallet) //main network
     const connex = new Framework(Framework.guardDriver(driver))
  
      const unStakeABI = {
            "inputs": [
              {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
              }
            ],
            "name": "unstake",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
       try{
        const contractStakeDHN = new web3.eth.Contract(contractAbiStake,contractAddressStake, { from: walletAddress });
        let untilLockingEndResult = await untilLockingEnd(contractStakeDHN,stakeDetail[0].stakeId)

         if(Number(untilLockingEndResult) != 0)
         return {
          result: false,
          status: 202,
          message: message.STAKE_PERIOD_NOT_COMPLETED
        }; 

        const unStakeMethod = connex.thor.account(contractAddressStake).method(unStakeABI);
       let t1 = unStakeMethod.asClause(stakeDetail[0].stakeId)
       const signingService = connex.vendor.sign('tx', [t1]);
       let unStakeResponse = await signTransaction(signingService);
        if(unStakeResponse){
          // update withdraw status to true
          const filter = { _id:  stakeDbId };
          const update = { withdraw: true};
          await Stake.findOneAndUpdate(
                 filter,
                 update,
                 {
                   new: true,
                 }
               );
          // save unstake record in transaction collection
         let transactionHistory = new TransactionHistory({
          walletAddressTo: options.walletAddress,
          walletAddressFrom: contractAddressStake,
          amount: stakeDetail[0].token,
          coinName: "Dohrnii",
          blockChain: 'VECHAIN',
          feeCoinShortName: 'VTHO',
          fee: '0.4',
          txId: unStakeResponse.txid 
        });
        await transactionHistory.save();       
          return {
            result: true,
            status: 200,
            message: message.UNSTAKE_SUCCESSFULLY
              };
        }
       } catch (err){          
        return { result: false, status: 202, message:err.message }
       }  
 } 


