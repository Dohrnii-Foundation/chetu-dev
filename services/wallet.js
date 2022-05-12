const message = require("../lang/message");
const EthereumQRPlugin = require("ethereum-qr-code");
const { WalletAddress, validateRequest,validateWalletDetailPayload,validateWalletListPayload,validateWalletUpdatePayload,validateRestoreWalletPayload } = require("../models/walletAddress");
const { validateTransferPayload,
  TransactionHistory,
  validateTransfer,
  validateBlockChainTransfer,validateBlockChainFee  } = require("../models/transactionHistory");
const { Stake } = require("../models/stake");
const { validateStake,validateUnStake, validateStakeAvailableTokenPayload, validateStakeOveriew,validateStakeDetail } = require('../models/stake')
const debug = require("debug")("app:walletlog");
const { Seed } = require("../models/seed");
const CryptoJS = require("crypto-js");
const ethers = require('ethers');
const bip39 = require("bip39");
const { validateWalletRestoreType,validateBlockChain,validateStakePeriod } = require('../helper/helper');
const veChain = require('../methods/veChainMethods');
const veChainTemp = require('../methods/veChainStake3M'); //remove when switch to mainnet
const ethereum = require('../methods/ethereumMethods');
const bsc = require('../methods/bscMethods');
//const polygon = require('../methods/polygonMethods');
const veChainStak = require('../methods/veChainStaking');
const moment = require('moment');
/********** Create Wallet ************
 * @param {Object} options
 *
 * @return {Object} walletAddress
 *
 *********** Create Wallet***********/
module.exports.createWalletByBSC = async (req) => {
  const options = req.body;
  const error = validateRequest(options);
  if (error)
    return { result: false, status: 202, message: error.details[0].message };
  const seed = await Seed.find({
    _id: options.seedId,
  });
  if (seed.length === 0)
    return { result: false, status: 202, message: message.SEED_NOT_VERIFIED };
    if (seed[0].walletCreated == true)
    return { result: false, status: 202, message: message.COMMING_SOON };
  
    let mnemonicWallet = ethers.Wallet.fromMnemonic(seed[0].seedString);
  const encryptedKey = CryptoJS.AES.encrypt(mnemonicWallet.privateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString();
  let code = await generateQrCode(mnemonicWallet.address);
  let walletAddress = new WalletAddress({
    imei1: options.imei1,
    imei2: options.imei2,
    deviceName: options.deviceName,
    seedId: options.seedId,
    walletName:options.walletName,
    walletAddress: mnemonicWallet.address,
   // userId: options.userId,
    qrCode: code,
  });
  const value = await walletAddress.save();
  const filter = { _id: options.seedId };
  const update = { seedPhrases: ['1','2'],seedString:"wallet created",walletCreated:true };
   await Seed.findOneAndUpdate(
    filter,
    update,
    {
      new: true,
    }
  );
  return {
    result: true,
    status: 200,
    message: message.WALLET_CREATED_SUCCESSFULLY,
    walletAddress: mnemonicWallet.address,
    walletName: value.walletName,
    privateKey: mnemonicWallet.privateKey,
    encryptedPrivateKey: encryptedKey, 
    qrCode: code,
    balance: 0
  };
};
/********** Transfer token ************
 * @param {Object} options
 *
 * @return {Object} status
 *
 *********** Transfer token ***********/
module.exports.createTransfer = async (req) => {
  const options = req.body;
  const error = validateTransfer(options);
  if (error)
    return { result: false, status: 202, message: error.details[0].message };
  const addressFrom = await WalletAddress.find({
    walletAddress: options.walletAddressFrom
  });
  const addressTo = await WalletAddress.find({
    walletAddress: options.walletAddressTo
  });
  if (addressFrom.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_WALLET_ADDRESS,
    };
  if (addressTo.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_WALLET_ADDRESS,
    };

  if (addressFrom[0].balance < options.amount) {
    return {
      result: false,
      status: 202,
      message: message.INSUFFICIENT_BALANCE,
    };
  }
  const filter_from = { walletAddress: options.walletAddressFrom }; 
  const update_from = { balance: addressFrom[0].balance - options.amount };
  const filter_to = { walletAddress: options.walletAddressTo }; 
  const update_to = { balance: addressTo[0].balance + options.amount };

    await WalletAddress.findOneAndUpdate(
    filter_from,
    update_from,
    {
      new: true,
    }
  );
    await WalletAddress.findOneAndUpdate(
    filter_to,
    update_to,
    {
      new: true,
    }
  );
  let transactionHistory = new TransactionHistory({
    walletAddressTo: options.walletAddressTo,
    walletAddressFrom: options.walletAddressFrom,
    amount: options.amount,
    seedIdTo: addressTo[0].seedId,
    seedIdFrom: addressFrom[0].seedId,
    coinName: "Etherium",
  });
  await transactionHistory.save();
  return {
    result: true,
    status: 200,
    message: message.AMOUNT_TRANSFER_SUCCESSFULLY,
  };
};
// /********** Fetch Wallet detail ************
//  * @param {Object} options
//  *
//  * @return {Object} walletdetail
//  *
//  *********** Fetch Wallet detail ***********/
// module.exports.walletDetail = async (req) => {
//   const options = req.body;
//   const error = validateWalletDetailPayload(options)
//     if (error)
//     return { result: false, status: 202, message: error.details[0].message };
//   const seed = await Seed.find({
//     _id: options.seedId,
//   });
//   if (seed.length === 0)
//     return {
//       result: false,
//       status: 202,
//       message: message.INVALID_SEED_ID,
//     };

//    let walletDetail = await WalletAddress.aggregate([
//         {
//           $match:
//           {'walletAddress': options.walletAddress, }
//         },
//         {
//         $lookup:
//          {
//         from: 'tokens',
//         localField: 'walletAddress',
//         foreignField:'walletAddress',
//         as: 'tokenData'
//          }
//         },
//       ])
//       let walletBalance = await WalletAddress.aggregate([
//         {
//           $match:
//           {'walletAddress': options.walletAddress, }
//         },
//         {
//           $lookup:
//            {
//           from: 'tokens',
//           localField: 'walletAddress',
//           foreignField:'walletAddress',
//           as: 'tokenDataForSum'
//            }
//           },
//           { "$project": {
//             "total": { "$sum": "$tokenDataForSum.coinUsdValue" }
//           }} 
//       ])
//    if(walletDetail.length == 0)
//    return {
//     result: true,
//     status: 200,
//     message: message.NO_RECORD_FOUND,
//    }
//   return {
//     result: true,
//     status: 200,
//     message: message.FETCH_SUCCESSFULLY,
//     walletAddress: walletDetail[0].walletAddress,
//     walletName: walletDetail[0].walletName,
//     qrCode: walletDetail[0].qrCode,
//     balance: walletBalance[0].total,
//    data: walletDetail[0].tokenData.map((el,i) => {
//     return {
//         coinId: i +1,
//         coinIcon: el.coinIcon,
//         coinName: el.coinName,
//         coinShortName: el.coinShortName,
//         coinValue: el.coinValue,
//         coinUsdValue: el.coinUsdValue,
//         coinStandard: el.coinStandard,
//         blockChain: el.blockChain
//     }
//   })
//   };
// };

/********** Fetch Wallet detail ************
 * @param {Object} options
 *
 * @return {Object} walletdetail
 *
 *********** Fetch Wallet detail ***********/
 module.exports.walletDetail = async (req) => {
  const options = req.body;
  const error = validateWalletDetailPayload(options)
    if (error)
    return { result: false, status: 202, message: error.details[0].message };
  const walletDetail = await WalletAddress.find({
    walletAddress: options.walletAddress,
  });
  if (walletDetail.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_WALLET_ADDRESS,
    };
    let filterValue = []
    let tokenValue = await Promise.all([  
                          veChain.veChainToken(options.walletAddress, "DHN"),                      
                          veChain.veChainToken(options.walletAddress, "VET"),
                          veChain.veChainToken(options.walletAddress, "VTHO"),
                          ethereum.ethereumToken(options.walletAddress, "DHN"),
                          ethereum.ethereumToken(options.walletAddress, "ETH"),
                          bsc.bscToken(options.walletAddress, "DHN"),
                          bsc.bscToken(options.walletAddress, "BNB") 
                        ])

    for(const el of tokenValue){
      filterValue.push(el.coinUsdValue)
    }
    let balance = filterValue.reduce((a, b) => a + b, 0)
    return {
      result: true,
      status: 200,
      message: message.FETCH_SUCCESSFULLY,
      walletAddress: walletDetail[0].walletAddress,
      walletName: walletDetail[0].walletName,
      qrCode: walletDetail[0].qrCode,
      balance: balance,
      data: tokenValue
    }; 
};
/********** Fetch Wallet List ************
 * @param {Object} options
 *
 * @return {Array | mappedWalletDetail} walletdetail
 *
 *********** Fetch Wallet List ***********/
module.exports.walletList = async (req) => {
  const options = req.body;
  const error = validateWalletListPayload(options)
    if (error)
    return { result: false, status: 202, message: error.details[0].message };
  //   const user = await User.find({
  //     _id: options.userId,
  //   });
  //   if (user.length === 0)
  //     return {
  //       result: false,
  //       status: 202,
  //       message: message.INVALID_USER_ID,
  //     };

  // let walletDetail = await WalletAddress.find({
  //   seedId: options.seedId
  // });
  const seed = await Seed.find({
    _id: options.seedId,
  });
  if (seed.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_SEED_ID,
    };

  let walletDetail = await WalletAddress.find({
    seedId: options.seedId
  });
  if(walletDetail.length == 0)
   return {
    result: true,
    status: 200,
    message: message.NO_RECORD_FOUND,
   }
  let filterValue = []
  let tokenValue = await Promise.all([
                        ethereum.ethereumToken(walletDetail[0].walletAddress, "ETH"),
                        ethereum.ethereumToken(walletDetail[0].walletAddress, "DHN"),
                        veChain.veChainToken(walletDetail[0].walletAddress, "VET"),
                        veChain.veChainToken(walletDetail[0].walletAddress, "VTHO"),
                        veChain.veChainToken(walletDetail[0].walletAddress, "DHN"),
                        bsc.bscToken(walletDetail[0].walletAddress, "BNB"),
                        bsc.bscToken(walletDetail[0].walletAddress, "DHN")
                      ])
                      
  for(const el of tokenValue){
    filterValue.push(el.coinUsdValue)
  }
  let balance = filterValue.reduce((a, b) => a + b, 0)
   
   let mappedWalletDetail = walletDetail.map(el=>{
    return{
      walletAddress: el.walletAddress,
      walletName: el.walletName,
      qrCode: el.qrCode,
      balance: balance
    }
  })
  return {
    result: true,
    status: 200,
    message: message.FETCH_SUCCESSFULLY,
    data: mappedWalletDetail
  };
};
/********** Fetch Transaction history ************
 * @param {Object} options
 *
 * @return {Array | mappedValue} walletdetail
 *
 *********** Fetch Transaction history  ***********/
module.exports.walletTransactionHistory = async (req) => {
  const options = req.body;
  const error = validateTransferPayload(options);
  if (error)
    return { result: false, status: 202, message: error.details[0].message };
  let filter = [];
    switch(options.transactionType){
        case 'All':
          filter.push({ walletAddressFrom: options.walletAddress }, { walletAddressTo: options.walletAddress });
        break;
        case 'Send':
          filter.push({ walletAddressFrom: options.walletAddress });
        break; 
        case 'Receive':
          filter.push({ walletAddressTo: options.walletAddress });
        break; 
        default:
          debug('in default')
        break; 
    }

    if(filter.length == 0)
      return {
            result: false,
            status: 202,
            message: message.INVALID_TRANSACTION_TYPE,
          };
  const walletAddress = await WalletAddress.find({
    walletAddress: options.walletAddress,
  });
  if (walletAddress.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_WALLET_ADDRESS,
    };
  let transactionDetail = await TransactionHistory.find({
    $or: filter,
  }).select("-__v");
            let mappedValue = transactionDetail.map(el => {
              return {
                _id: el._id,
                walletAddressTo: el.walletAddressTo,
                walletAddressFrom: el.walletAddressFrom,
                amount: el.amount,
                transactionType: el.walletAddressFrom == options.walletAddress ? 'Send' : 'Receive',
                coinName: el.coinName,
                blockChain: el.blockChain,
                date: el.date,
                fee: el.fee,
                feeCoinShortName: el.feeCoinShortName,
                txId: el.txId == undefined ? null : el.txId
              };
            });
  return {
    result: true,
    status: 200,
    message: message.FETCH_SUCCESSFULLY,
    data: mappedValue,
  };
};
/********** Update Wallet ************
 * @param {Object} options
 *
 * @return {Array | mappedWalletDetail} walletdetail
 *
 *********** Update Wallet ***********/
 module.exports.updateWallet = async (req) => {
  const options = req.body;
  const error = validateWalletUpdatePayload(options)
    if (error)
    return { result: false, status: 202, message: error.details[0].message };

  let walletDetail = await WalletAddress.find({
    walletAddress: options.walletAddress
  });
   if(walletDetail.length == 0)
   return {
    result: true,
    status: 200,
    message: message.NO_RECORD_FOUND,
   }
   const filter = { walletAddress:  options.walletAddress };
   const update = { walletName:  options.walletName };
   let updatedValue =  await WalletAddress.findOneAndUpdate(
          filter,
          update,
          {
            new: true,
          }
        );
        // let filterValue = []
        // let tokenValue = await Promise.all([  
        //                       veChain.veChainToken(options.walletAddress, "DHN"),                      
        //                       veChain.veChainToken(options.walletAddress, "VET"),
        //                       veChain.veChainToken(options.walletAddress, "VTHO"),
        //                       ethereum.ethereumToken(options.walletAddress, "DHN"),
        //                       ethereum.ethereumToken(options.walletAddress, "ETH"),
        //                       bsc.bscToken(options.walletAddress, "DHN"),
        //                       bsc.bscToken(options.walletAddress, "BNB") 
        //                     ])
    
        // for(const el of tokenValue){
        //   filterValue.push(el.coinUsdValue)
        // }
        // let balance = filterValue.reduce((a, b) => a + b, 0) 
  return {
    result: true,
    status: 200,
    message: message.WALLET_NAME_UPDATE_SUCCESSFULLY,
    walletAddress: updatedValue.walletAddress,
    walletName: updatedValue.walletName
    // data: [
    //   {
    //     walletAddress: updatedValue.walletAddress,
    //     walletName: updatedValue.walletName,
    //     // qrCode: updatedValue.qrCode,
    //     // balance: balance
    //   }
    // ]
  };
};
/**********Restore Wallet ************
 * @param {Object} options
 *
 * @return {Object} seedId, walletAddress
 *
 *********** Restore Wallet ***********/
 module.exports.restoreWallet = async (req) => {
  const options = req.body;
  const error = validateRestoreWalletPayload(options)
    if (error)
    return { result: false, status: 202, message: error.details[0].message };
    let type = await validateWalletRestoreType(options.restoreType);
    if(type == 'INVALID')
    return{ result: false, status: 202, message: message.INVALID_RESTORE_TYPE }

    if(type == 'SEED_PHRASE'){
      if(bip39.validateMnemonic(options.restorePayload)==false){
        return {result: false, status: 202, message: message.INVALID_SEED }
      }
      let mnemonicWallet = ethers.Wallet.fromMnemonic(options.restorePayload);
      let wallet = await WalletAddress.find({
        walletAddress: mnemonicWallet.address
      });
      const encryptedKey = CryptoJS.AES.encrypt(mnemonicWallet.privateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString();
      if (wallet.length == 0){
        const encryptedKey = CryptoJS.AES.encrypt(mnemonicWallet.privateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString();
        //insert new wallet address in db
        let seed = new Seed({
          seedPhrases: ['1','2'],
          seedString: "recoverd from mnemonic",
         // userId: options.userId,
          isVerified: true,
          walletCreated: true,
        });
        let { _id} = await seed.save();
        let walletAddress = new WalletAddress({
          seedId: _id,
          walletName: 'Dohrnii',
          walletAddress: mnemonicWallet.address,
         // userId: options.userId,
          qrCode: 'qrCode'
        });
        const value = await walletAddress.save();
        return {
          result: true,
          status: 200,
          message: message.WE_HAVE_FOUND_YOUR_WALLET,
          seedId: _id,
          walletAddress: value.walletAddress,
          privateKey: mnemonicWallet.privateKey,
          encryptedPrivateKey: encryptedKey,
        }
      }

      return {
        result: true,
        status: 200,
        message: message.WE_HAVE_FOUND_YOUR_WALLET,
        seedId: wallet[0].seedId,
        walletAddress: wallet[0].walletAddress,
        privateKey: mnemonicWallet.privateKey,
        encryptedPrivateKey: encryptedKey
      }
    } else {
     try{
      let privateKey = options.restorePayload
      let derivedWallet =  new ethers.Wallet(privateKey)
      let wallet = await WalletAddress.find({
        walletAddress: derivedWallet.address
      });
      let encryptedKey = CryptoJS.AES.encrypt(privateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString();
      if (wallet.length == 0) {
       let encryptedKey = CryptoJS.AES.encrypt(privateKey, process.env.SECRET_KEY_FOR_PRIVATE_KEY).toString();
          //insert new wallet address in db
        let seed = new Seed({
          seedPhrases: ['1','2'],
          seedString: "recoverd from privateKey",
        //  userId: options.userId,
          isVerified: true,
          walletCreated: true,
        });
        let { _id} = await seed.save();
        let walletAddress = new WalletAddress({
          seedId: _id,
          walletName: 'Dohrnii',
          walletAddress: derivedWallet.address,
         // userId: options.userId,
          qrCode: 'qrCode',
        });
        const value = await walletAddress.save();
        return {
          result: true,
          status: 200,
          message: message.WE_HAVE_FOUND_YOUR_WALLET,
          seedId: _id,
          walletAddress: value.walletAddress,
          privateKey: privateKey,
          encryptedPrivateKey: encryptedKey
        }
      }
      return {
        result: true,
        status: 200,
        message: message.WE_HAVE_FOUND_YOUR_WALLET,
        seedId: wallet[0].seedId,
        walletAddress: wallet[0].walletAddress,
        privateKey: privateKey,
        encryptedPrivateKey: encryptedKey
      }
    } catch(err){
      return { result: false, status: 202, message: err.message };
    }
  }
};
/**********Estimate Gas ************
 * @param {Object} options
 *
 * @return {Object} Gas Price
 *
 *********** Estimate Gas ***********/
 module.exports.estimateGas = async (req) => {
  const options = req.body;
    const error = validateBlockChainFee(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
      let blockChain  = await validateBlockChain(options)
      if(blockChain == 'INVALID'){
        return { result: false, status: 202, message: message.INVALID_BLOCK_CHAIN };
       }
       if(blockChain == 'ETHEREUM'){
        const result = await ethereum.ethereumGas(req);
        return result
       }else if(blockChain == 'VECHAIN'){
        const result = await veChain.veChainGas(req)
        return result   
       }else if(blockChain == 'BSC'){
        const result = await bsc.bscGas(req)
       return result   
       }else if(blockChain == 'POLYGON'){
        const result = await polygon.polygonGas(req)
        return result   
       }  
};
/********** Stake ************
 * @param {Object} options
 *
 * @return {Object} Status
 *
 *********** Stake ***********/
 module.exports.Stake = async (req) => {
  const options = req.body;
    const error = validateStake(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
      let blockChain  = await validateBlockChain(options)
      if(blockChain == 'INVALID'){
        return { result: false, status: 202, message: message.INVALID_BLOCK_CHAIN };
       }
     if(blockChain == 'VECHAIN'){
        const result = await veChainStak.veChainStake(options)
        return result   
       }else {
        return { result: false, status: 202, message: message.ONLY_SUPPORT_VECHAIN}; 
       }
};
/********** Available Token for Stake ************
 * @param {Object} options
 *
 * @return {Object} options
 *
 *********** Available Token for Stake ***********/
 module.exports.AvailableTokenForStake = async (req) => {
  const options = req.body;
    const error = validateStakeAvailableTokenPayload(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
      const walletDetail = await WalletAddress.find({
        walletAddress: options.walletAddress,
      });
      if (walletDetail.length === 0)
        return {
          result: false,
          status: 202,
          message: message.INVALID_WALLET_ADDRESS,
        };
       // let tokenValue = await veChain.veChainToken(options.walletAddress, "DHN")  Remove comment when switch to mainnet
        let tokenValue = await veChainTemp.veChainToken(options.walletAddress, "DHN")    
            return {
              result: true,
              status: 200,
              message: message.FETCH_SUCCESSFULLY,
              coinUsdValue: tokenValue.coinUsdValue,
              coinValue: tokenValue.coinValue,
              coinShortName: tokenValue.coinShortName
            };                   
};

/********** Stake Token Overview ************
 * @param {Object} options
 *
 * @return {Object} options
 *
 *********** Stake Token Overview ***********/
 module.exports.StakeTokenOverview = async (req) => {
  const options = req.body;
    const error = validateStakeOveriew(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
      let blockChain  = await validateBlockChain(options)
      if(blockChain !== 'VECHAIN'){
        return { result: false, status: 202, message: message.ONLY_SUPPORT_VECHAIN };
       }
      const walletDetail = await WalletAddress.find({
        walletAddress: options.walletAddress
      });
      if (walletDetail.length === 0)
        return {
          result: false,
          status: 202,
          message: message.INVALID_WALLET_ADDRESS,
        };

        let threeMonth = []
        let sixMonth = []
        let twelveMonth = []
        const stakeDetail = await Stake.find({
          walletAddress: options.walletAddress, withdraw: false
        });
        for(const el of stakeDetail) {
          if(el.stakePeriod ==='3M'){
            threeMonth.push(el.token)
          }else if(el.stakePeriod ==='6M'){
            sixMonth.push(el.token)
          }else{
            twelveMonth.push(el.token)
          }
        }
        let token3M = threeMonth.reduce((a, b) => a + b, 0)
        let token6M = sixMonth.reduce((a, b) => a + b, 0)
        let token12M = twelveMonth.reduce((a, b) => a + b, 0)
            return {
              result: true,
              status: 200,
              message: message.FETCH_SUCCESSFULLY,
              data: [
                {
                  stakePeriod:'3M',
                  token: token3M,
                  rewardPercentage: 10,
                  description: '3 MONTHS STAKING'
              },
                {
                  stakePeriod:'6M',
                  token: token6M,
                  rewardPercentage: 15,
                  description: '6 MONTHS STAKING'
                },
                {
                  stakePeriod:'12M',
                  token: token12M,
                  rewardPercentage: 20,
                  description: '12 MONTHS STAKING'
                }
              ]
            };                   
};

/********** Stake Token detail ************
 * @param {Object} options
 *
 * @return {Object} options
 *
 *********** Stake Token detail ***********/
 module.exports.StakeTokenDetail = async (req) => {
  const options = req.body;
    const error = validateStakeDetail(options);
    if (error)
      return { result: false, status: 202, message: error.details[0].message };
      let blockChain  = await validateBlockChain(options)
      if(blockChain !== 'VECHAIN'){
        return { result: false, status: 202, message: message.ONLY_SUPPORT_VECHAIN };
       }
       let stakePeriod  = await validateStakePeriod(options)
       if(stakePeriod == 'INVALID'){
         return { result: false, status: 202, message: message.INVALID_STAKE_PERIOD };
        } 
      const walletDetail = await WalletAddress.find({
        walletAddress: options.walletAddress
      });
      if (walletDetail.length === 0)
        return {
          result: false,
          status: 202,
          message: message.INVALID_WALLET_ADDRESS,
        };
        const stakeDetail = await Stake.find({
          walletAddress: options.walletAddress, stakePeriod: options.stakePeriod, withdraw: false
        });
     
         let currentDate = Date.now();
        const mappedValue = stakeDetail.map(el=>{
          return {
            stakeDbId: el._id,
            endDate: moment(el.endDate).format('DD/MM/YYYY'),
            stakeMatured: currentDate >= el.endDate,
            token: el.token,
            stakePeriod: el.stakePeriod
          }
        })
            return {
              result: true,
              status: 200,
              message: message.FETCH_SUCCESSFULLY,
              data: mappedValue
            };                   
};
/********** UnStake ************
 * @param {Object} options
 *
 * @return {Object} Status
 *
 *********** UnStake ***********/
 module.exports.UnStake = async (req) => {
  const options = req.body;
  const error = validateUnStake(options);
  if (error)
    return { result: false, status: 202, message: error.details[0].message };
    let blockChain  = await validateBlockChain(options)
    if(blockChain == 'INVALID'){
      return { result: false, status: 202, message: message.INVALID_BLOCK_CHAIN };
     }
   if(blockChain == 'VECHAIN'){
      const result = await veChainStak.veChainUnStake(options)
      return result   
     }else {
      return { result: false, status: 202, message: message.ONLY_SUPPORT_VECHAIN}; 
     }
};
/********** Test Route ************
 * @param {Object} options
 *
 * @return {Object} 
 *
 *********** Test Route ***********/
 module.exports.test = async () => {
        return { result: true, status: 200, message: "Wallet API works!!!!!!!"};    
};
/********** Generate QrCode ************
 * @param {Object} address
 *
 * @return {Object } qrCode
 *
 *********** Generate QrCode   ***********/
function generateQrCode(address) {
  const qr = new EthereumQRPlugin();
  return new Promise((resolve, reject) => {
    const qrCode = qr.toDataUrl({
      to: address,
      gas: 4200,
      value: 1,
    });
    qrCode.then((code) => {
      resolve(code.value);
    });
  });
}

/********** Save Verified Seed Pharse With Devive Information ************/
