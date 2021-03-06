const nodemailer = require("nodemailer");
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
    user: "wallet@dohrnii.io",//"chetuindia56@gmail.com",//"chetuanmol0801@gmail.com", 
    pass: "WALLET4dohrn11!",//"chetu@5656",//"anmols1234", 
  },
});
 
let mailOptions = {
  from: 'wallet@dohrnii.io',//"chetuindia56@gmail.com",//"chetuanmol0801@gmail.com", 
  to: 'info@dohrnii.io',//"info@dohrnii.org"
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

    let price = await axiosGet(`https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum,vechain,vethor-token,binancecoin,&vs_currencies=usd&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`)

        let obj = {
            eth: price.data.ethereum.usd,
            vet: price.data.vechain.usd,
            vthor: price.data['vethor-token'].usd,
           // matic: price.data['matic-network'].usd,
            binancecoin: price.data.binancecoin.usd,
        }
        let val = await axiosGet('https://api.pancakeswap.info/api/v2/tokens/0xff8BBc599EA030AA69d0298035dFE263740a95bC')
        let dhn = Number(val.data.data.price).toFixed(5)

        switch (coin) {
            case 'VET': 
                 coinUsdValue = coinValue * obj.vet
                break;
            case 'VTHO': 
                coinUsdValue = coinValue * obj.vthor
                break;
            case 'DHN': 
                coinUsdValue = coinValue * dhn
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
       // console.log('stakeResponse in signTransaction function',stakeResponse)
         resolve(stakeResponse)
       }catch(err){
         //  console.log('err in signTransaction function',err.message)
          reject(err)
       }
   })
}
const axiosGet = (url)=>{
    
    return new Promise(async(resolve,reject)=>{
        try{
         let stakeResponse = await axios.get(url);
        // console.log('stakeResponse in axiosGet function',stakeResponse)
          resolve(stakeResponse)
        }catch(err){
          //  console.log('err in axiosGet function',err.message)
           reject(err)
        }
    })
 }
 module.exports.verifyUserAddress = (contractStakeDHN,stakeId)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let result = await contractStakeDHN.methods.stakes(stakeId).call();
          //  console.log('result in verifyUserAddress function;;',result)
            resolve(result)
          }catch(err){
          // console.log('err in verifyUserAddress function;;',err.message)
            reject(err)
          }
    })
 }

 module.exports.untilLockingEnd = (contractStakeDHN,stakeId)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let result = await contractStakeDHN.methods.untilLockingEnd(stakeId).call();
           // console.log('result in untilLockingEnd function;;',result)
            resolve(result)
          }catch(err){
          // console.log('err in untilLockingEnd function;;',err.message)
            reject(err)
          }
    })
 }

 module.exports.delay = (msec)=>{
    return new Promise((resolve)=>{
      setTimeout(()=>{
        console.log(`delay function for ${msec} milli second`)
        resolve(true)
      },msec)
    })
  }
exports.axiosGet = axiosGet;