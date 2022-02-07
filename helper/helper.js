const nodemailer = require("nodemailer");
const CoinGecko = require('coingecko-api');

module.exports.validateBlockChain = async(option) => {
    let blockChain
    switch (option.blockChain) {
        case 'ETHEREUM': 
        blockChain = 'ETHEREUM'
            break;
        case 'VECHAIN': 
        blockChain = 'VECHAIN'
            break;
        default: 
        blockChain = 'INVALID'
        }
        return blockChain
}

module.exports.sendMail = async(option) => {
 
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "chetuanmol0801@gmail.com", 
    pass: "anmols1234", 
  },
});
 
let mailOptions = {
  from: "chetuanmol0801@gmail.com", 
  to: "saquibm@chetu.com", 
  subject: `Query from ${option.walletAddress} user`, 
  text: option.message // body of email
};
 return new Promise((resolve,reject)=>{
    transporter.sendMail(mailOptions, (error, information) => {
        if (error) {
          reject(false)
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
      ids: ['ethereum', 'vechain', 'vethor-token', 'dai'],
      vs_currencies: ['usd'],
  });
   let obj = {
     eth: price.data.ethereum.usd,
     vet: price.data.vechain.usd,
     vthor: price.data['vethor-token'].usd,
     dai: price.data.dai.usd
   }
   switch (coin) {
    case 'VET': 
         coinUsdValue = coinValue * obj.vet
        break;
    case 'VTHO': 
        coinUsdValue = coinValue * obj.vthor
        break;
    case 'DHN': 
        coinUsdValue = coinValue * obj.dai
        break;
    default: 
        coinUsdValue = 'INVALID'
    }
    return coinUsdValue
}