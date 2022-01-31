const message = require("../lang/message");
const EthereumQRPlugin = require("ethereum-qr-code");
const { WalletAddress, validateRequest,validateWalletDetailPayload,validateWalletListPayload } = require("../models/walletAddress");
const { validateTransferPayload } = require("../models/transactionHistory");
const { Token } = require("../models/token");
const debug = require("debug")("app:walletlog");
const {
  TransactionHistory,
  validateTransfer,
} = require("../models/transactionHistory");
const { Seed } = require("../models/seed");
const CryptoJS = require("crypto-js");
const config = require("config");
const ethers = require('ethers');
const bip39 = require("bip39");
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
    coinName: "Etherium",
    coinShortName: "ETH",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/ether.PNG",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address
  },
  {
    coinName: "VeChain",
    coinShortName: "VET",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/veChain.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address
  },
  {
    coinName: "VeThor Token",
    coinShortName: "VTHO",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/veThor.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address
  },
  {
    coinName: "Dohrnii Coin",
    coinShortName: "DHN",
    coinIcon: "https://dohrniifoundationi2-qa.chetu.com/dai.png",
    seedId: options.seedId,
    walletAddress: mnemonicWallet.address
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

  let walletDetail = await WalletAddress.find({
    seedId: options.seedId,
    walletAddress: options.walletAddress
  });
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
    balance: walletDetail[0].balance,
    data: [
      {
        coinIcon: walletDetail[0].coinIcon,
        coinName: walletDetail[0].coinName,
        coinShortName: walletDetail[0].coinShortName,
        coinValue: walletDetail[0].coinValue,
        coinUsdValue: walletDetail[0].coinUsdValue,
      },
    ],
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
      balance: el.balance
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
                "_id": el._id,
            "walletAddressTo": el.walletAddressTo,
            "walletAddressFrom": el.walletAddressFrom,
            "seedIdTo": el.seedIdTo,
            "seedIdFrom": el.seedIdFrom,
            "amount": el.amount,
            "transactionType": el.walletAddressFrom == options.walletAddress ? 'Send' : 'Receive',
            "coinName": el.coinName,
            "date": el.date
              };
            });
  return {
    result: true,
    status: 200,
    message: message.FETCH_SUCCESSFULLY,
    data: mappedValue,
  };
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
