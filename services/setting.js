const message = require("../lang/message");
const { Support, validateMail } = require("../models/setting");
const { WalletAddress } = require("../models/walletAddress");
const { sendMail } = require("../helper/helper");



/********** Send mail to support and save ************
 * @param {Object} options
 *
 * @return {Object} mail
 *
 *********** Send mail to support and save ***********/
module.exports.sendMailToSupport = async (req) => {
    const options = req.body;
  const error = validateMail(options);
  if (error)
    return { result: false, status: 202, message: error.details[0].message };

  const wallet = await WalletAddress.find({
    walletAddress: options.walletAddress,
  });
  if (wallet.length === 0)
    return { result: false, status: 202, message: message.INVALID_WALLET_ADDRESS };
      let sendMailResult = await sendMail(options);
      if(sendMailResult == false){
        return { result: true, status: 202, message: message.MAIL_SEND_FAILED };
      }
  // Save Mail
  let mailToSupport = new Support({
    message: options.message,
    walletAddress: options.walletAddress,
    email: options.usermailId,
  });
      await mailToSupport.save();
  return { result: true, status: 200, message: message.MAIL_SEND_SUCCESSFULLY };
};


