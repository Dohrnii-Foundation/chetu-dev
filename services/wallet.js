const message = require("../lang/message");
const EthereumQRPlugin = require("ethereum-qr-code");
const { WalletAddress, validateRequest,validateWalletDetailPayload,validateWalletListPayload,validateWalletUpdatePayload,validateRestoreWalletPayload } = require("../models/walletAddress");
const { validateTransferPayload,
  TransactionHistory,
  validateTransfer,
  validateBlockChainTransfer  } = require("../models/transactionHistory");
const { Token } = require("../models/token");
const debug = require("debug")("app:walletlog");
const { Seed } = require("../models/seed");
const CryptoJS = require("crypto-js");
const config = require("config");
const ethers = require('ethers');
const bip39 = require("bip39");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { validateWalletRestoreType,validateBlockChain } = require('../helper/helper');
const veChain = require('../methods/veChainMethods');
const ethereum = require('../methods/ethereumMethods');
const bsc = require('../methods/bscMethods');
const polygon = require('../methods/polygonMethods');
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
    if(bip39.validateMnemonic(seed[0].seedString)==false){
      return {result: false, status: 202, message: message.INVALID_SEED }
    }
    let mnemonicWallet = ethers.Wallet.fromMnemonic(seed[0].seedString);
    let wallet = await WalletAddress.find({
      walletAddress: mnemonicWallet.address
    });
    if (wallet.length > 0)
    return { result: false, status: 202, message: message.MULTIPLE_WALLET_NOT_SUPPORTED };
 // let encryptedKey = CryptoJS.AES.encrypt(privateKey,config.get('secretKey') ).toString();
  let code = await generateQrCode(mnemonicWallet.address);
  let walletAddress = new WalletAddress({
    imei1: options.imei1,
    imei2: options.imei2,
    deviceName: options.deviceName,
    seedId: options.seedId,
    walletName:options.walletName,
    walletAddress: mnemonicWallet.address,
    privateKey: mnemonicWallet.privateKey,
    qrCode: code, 
  });
  const value = await walletAddress.save();
     // create default Tokens
       await Token.insertMany([
     {
    coinName: "Ethereum",
    coinShortName: "ETH",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/ether.PNG",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "ETHEREUM"
  },
  {
    coinName: "Dohrnii",
    coinShortName: "DHN",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/dai.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"ERC-20",
    blockChain: "ETHEREUM"
  },
  {
    coinName: "VeChain",
    coinShortName: "VET",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/veChain.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "VECHAIN"
  },
  {
    coinName: "VeThor Token",
    coinShortName: "VTHO",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/veThor.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "VECHAIN"
  },
  {
    coinName: "Dohrnii",
    coinShortName: "DHN",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/dai.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"VET",
    blockChain: "VECHAIN"
  },
  {
    coinName: "BNB",
    coinShortName: "BNB",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/bnb.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "BSC"
  },
  {
    coinName: "Dohrnii",
    coinShortName: "DHN",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/dai.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "BSC"
  },
  {
    coinName: "Polygon",
    coinShortName: "MATIC",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/matic.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "POLYGON"
  },
  {
    coinName: "Dohrnii",
    coinShortName: "DHN",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/dai.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address,
    coinStandard:"",
    blockChain: "POLYGON"
  }
  ]);
  return {
    result: true,
    status: 200,
    message: message.WALLET_CREATED_SUCCESSFULLY,
    walletAddress: mnemonicWallet.address,
    walletName: value.walletName,
    privateKey: value.privateKey,
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
  const seed = await Seed.find({
    _id: options.seedId,
  });
  if (seed.length === 0)
    return {
      result: false,
      status: 202,
      message: message.INVALID_SEED_ID,
    };

   let walletDetail = await WalletAddress.aggregate([
        {
          $match:
          {'walletAddress': options.walletAddress, }
        },
        {
        $lookup:
         {
        from: 'tokens',
        localField: 'walletAddress',
        foreignField:'walletAddress',
        as: 'tokenData'
         }
        },
      ])
      let walletBalance = await WalletAddress.aggregate([
        {
          $match:
          {'walletAddress': options.walletAddress, }
        },
        {
          $lookup:
           {
          from: 'tokens',
          localField: 'walletAddress',
          foreignField:'walletAddress',
          as: 'tokenDataForSum'
           }
          },
          { "$project": {
            "total": { "$sum": "$tokenDataForSum.coinUsdValue" }
          }} 
      ])
   if(walletDetail.length == 0)
   return {
    result: true,
    status: 200,
    message: message.NO_RECORD_FOUND,
   }
  return {
    result: true,
    status: 200,
    message: message.FETCH_SUCCESSFULLY,
    walletAddress: walletDetail[0].walletAddress,
    walletName: walletDetail[0].walletName,
    qrCode: walletDetail[0].qrCode,
    balance: walletBalance[0].total,
   data: walletDetail[0].tokenData.map((el) => {
    return {
        coinIcon: el.coinIcon,
        coinName: el.coinName,
        coinShortName: el.coinShortName,
        coinValue: el.coinValue,
        coinUsdValue: el.coinUsdValue,
        coinStandard: el.coinStandard,
        blockChain: el.blockChain
    }
  })
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
  let walletBalance = await WalletAddress.aggregate([
    {
      $match:
      {'seedId': ObjectId(options.seedId), }
    },
    {
      $lookup:
       {
      from: 'tokens',
      localField: 'seedId',
      foreignField:'seedId',
      as: 'tokenDataForSum'
       }
      },
      { "$project": {
        "total": { "$sum": "$tokenDataForSum.coinUsdValue" }
      }} 
  ])
   if(walletDetail.length == 0)
   return {
    result: true,
    status: 200,
    message: message.NO_RECORD_FOUND,
   }
   let mappedWalletDetail = walletDetail.map(el=>{
    return{
      walletAddress: el.walletAddress,
      walletName: el.walletName,
      qrCode: el.qrCode,
      balance: walletBalance[0].total
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
                date: el.date
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
        let walletBalance = await WalletAddress.aggregate([
          {
            $match:
            {'walletAddress': options.walletAddress, }
          },
          {
            $lookup:
             {
            from: 'tokens',
            localField: 'walletAddress',
            foreignField:'walletAddress',
            as: 'tokenDataForSum'
             }
            },
            { "$project": {
              "total": { "$sum": "$tokenDataForSum.coinUsdValue" }
            }} 
        ])
  return {
    result: true,
    status: 200,
    message: message.UPDATE_SUCCESSFULLY,
    data: [
      {
        walletAddress: updatedValue.walletAddress,
        walletName: updatedValue.walletName,
        qrCode: updatedValue.qrCode,
        balance: walletBalance[0].total
      }
    ]
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
      if (wallet.length == 0)
      return { result: false, status: 202, message: message.NO_RECORD_FOUND };
      return {
        result: true,
        status: 200,
        message: message.FETCH_SUCCESSFULLY,
        seedId:wallet[0].seedId,
        walletAddress: wallet[0].walletAddress
      }
    } else {
     try{
      let privateKey = options.restorePayload
      let derivedWallet =  new ethers.Wallet(privateKey)
      let wallet = await WalletAddress.find({
        walletAddress: derivedWallet.address
      });
      if (wallet.length == 0)
      return { result: false, status: 202, message: message.NO_RECORD_FOUND };
      return {
        result: true,
        status: 200,
        message: message.FETCH_SUCCESSFULLY,
        seedId:wallet[0].seedId,
        walletAddress: wallet[0].walletAddress
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
    const error = validateBlockChainTransfer(options);
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
