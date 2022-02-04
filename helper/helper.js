const nodemailer = require("nodemailer");

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
  subject: "Test Subject", 
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