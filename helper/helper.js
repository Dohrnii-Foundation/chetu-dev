const nodemailer = require("nodemailer");
const CoinGecko = require('coingecko-api');
const bcrypt = require('bcryptjs');
const axios = require('axios');

module.exports.validateBlockChain = async(option) => {
    let blockChain
    switch (option.blockChain) {
        case 'ETHEREUM': 
        blockChain = 'ETHEREUM'
            break;
        case 'VECHAIN': 
        blockChain = 'VECHAIN'
            break;
        case 'BSC': 
        blockChain = 'BSC'
            break;
        case 'POLYGON': 
        blockChain = 'POLYGON'
            break;    
        default: 
        blockChain = 'INVALID'
        }
        return blockChain
}
module.exports.validateStakePeriod = async(option) => {
    let stakePeriod
    switch (option.stakePeriod) {
        case '3M': 
        stakePeriod = '3M'
            break;
        case '6M': 
        stakePeriod = '6M'
            break;
        case '12M': 
        stakePeriod = '12M'
            break;   
        default: 
        stakePeriod = 'INVALID'
        }
        return stakePeriod
}

module.exports.sendMail = async(option) => {
 
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "chetuindia56@gmail.com",//"chetuanmol0801@gmail.com", 
    pass: "chetu@5656",//"anmols1234", 
  },
});
 
let mailOptions = {
  from: "chetuindia56@gmail.com",//"chetuanmol0801@gmail.com", 
  to: 'info@dohrnii.org',//"info@dohrnii.org"
  subject: `Query from Wallet User`, 
  text: `User ${option.userName} (${option.usermailId}) (${option.walletAddress}) has send the query:  ${option.message}` // body of email
};
 return new Promise((resolve,reject)=>{
    transporter.sendMail(mailOptions, (error, information) => {
        if (error) {
            console.log('error.message;;;',error.message)
          reject(error.message)
        } else {
          resolve(true)
        }
      });
 })

}
module.exports.coinUsdValue = async(coin,coinValue)=>{
  let coinUsdValue
  const CoinGeckoClient = new CoinGecko();
    let price = await CoinGeckoClient.simple.price({
      ids: ['ethereum', 'vechain', 'vethor-token', 'dai', 'binancecoin', 'matic-network'],
      vs_currencies: ['usd'],
  });
   let obj = {
     eth: price.data.ethereum.usd,
     vet: price.data.vechain.usd,
     vthor: price.data['vethor-token'].usd,
     dai: price.data.dai.usd,
     matic: price.data['matic-network'].usd,
     binancecoin: price.data.binancecoin.usd,
   }
   switch (coin) {
    case 'VET': 
         coinUsdValue = coinValue * obj.vet
        break;
    case 'VTHO': 
        coinUsdValue = coinValue * obj.vthor
        break;
    case 'DHN': 
        coinUsdValue = 0 //coinValue * obj.dai
        break;
    case 'ETH': 
        coinUsdValue = coinValue * obj.eth
       break;
    case 'BNB': 
       coinUsdValue = coinValue * obj.binancecoin
       break;
    case 'MATIC': 
       coinUsdValue = coinValue * obj.matic
       break;
    default: 
        coinUsdValue = 'INVALID'
    }
    return coinUsdValue
}
module.exports.validateCoinShortNameVechain = async(coin)=>{
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
module.exports.validateCoinShortNameEthereum = async(coin)=>{
  let coinValue
  switch (coin) {
      case 'ETH': 
          coinValue = 'ETH'
          break;
      case 'DHN': 
          coinValue = 'DHN'
          break;    
      default: 
          coinValue = 'INVALID'
      }
      return coinValue
}
module.exports.validateCoinShortNameBsc = async(coin)=>{
  let coinValue
  switch (coin) {
      case 'BNB': 
          coinValue = 'BNB'
          break;
      case 'DHN': 
          coinValue = 'DHN'
          break;    
      default: 
          coinValue = 'INVALID'
      }
      return coinValue
}
module.exports.validateCoinShortNamePolygon = async(coin)=>{
    let coinValue
    switch (coin) {
        case 'MATIC': 
            coinValue = 'MATIC'
            break;
        case 'DHN': 
            coinValue = 'DHN'
            break;    
        default: 
            coinValue = 'INVALID'
        }
        return coinValue
  }
module.exports.validateWalletRestoreType = async(type)=>{
  let restoreType
  switch (type) {
      case 'PRIVATE_KEY': 
      restoreType = 'PRIVATE_KEY'
          break;
      case 'SEED_PHRASE': 
      restoreType = 'SEED_PHRASE'
          break;
      default: 
      restoreType = 'INVALID'
      }
      return restoreType
}
module.exports.hashPassword = async(password)=>{
    let salt = bcrypt.genSaltSync(10);
    let hashPassword = bcrypt.hashSync(password, salt);
    return hashPassword
}
module.exports.comparePassword = async(password,hash)=>{
    let result = bcrypt.compareSync(password,hash);
    return result
}
module.exports.signTransaction = (signingService)=>{
   return new Promise(async(resolve,reject)=>{
       try{
        let stakeResponse = await signingService.gas(200000).request();
         resolve(stakeResponse)
       }catch(err){
          // console.log('err in signTransaction function',err.message)
          reject(err)
       }
   })
}
module.exports.axiosGet = (url)=>{
    return new Promise(async(resolve,reject)=>{
        try{
         let stakeResponse = await axios.get(url);
          resolve(stakeResponse)
        }catch(err){
           // console.log('err in axiosGet function',err.message)
           reject(err)
        }
    })
 }
 module.exports.verifyUserAddress = (contractStakeDHN,stakeId)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let result = await contractStakeDHN.methods.stakes(stakeId).call();
           // console.log('stakeVerifyResponse;;',result)
            resolve(result)
          }catch(err){
          //  console.log('err.message;;',err.message)
            reject(err)
          }
    })
 }