const { WalletAddress } = require("../models/walletAddress");
const { User } = require("../models/user");
const message = require("../lang/message");
const { validateStakePeriod } = require("../helper/helper");
const veChainStake3 = require('../methods/veChainStake3M');
const veChainStake6 = require('../methods/veChainStake6M');
const veChainStake12 = require('../methods/veChainStake12M');

module.exports.veChainStake = async (options) => {

     let stakePeriod  = await validateStakePeriod(options)
     if(stakePeriod == 'INVALID'){
       return { result: false, status: 202, message: message.INVALID_STAKE_PERIOD };
      }
        const userDetail = await User.find({
          _id: options.userId,
        });
        if (userDetail.length === 0)
          return {
            result: false,
            status: 202,
            message: message.INVALID_USER_ID,
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
      if(stakePeriod == '3M'){
        //const result = await veChainStake3Test.veChainStake3M(options);// veChainStake3.veChainStake3M(options); replace this later
        const result = await veChainStake3.veChainStake3M(options); 
        return result
       } else if(stakePeriod == '6M'){
        const result = await veChainStake6.veChainStake6M(options);
        return result   
       } else if(stakePeriod == '12M'){
        const result = await veChainStake12.veChainStake12M(options)
       return result   
       }

 } 

 module.exports.veChainUnStake = async (options) => {

  let stakePeriod  = await validateStakePeriod(options)
  if(stakePeriod == 'INVALID'){
    return { result: false, status: 202, message: message.INVALID_STAKE_PERIOD };
   }
     const userDetail = await User.find({
       _id: options.userId,
     });
     if (userDetail.length === 0)
       return {
         result: false,
         status: 202,
         message: message.INVALID_USER_ID,
       };

  const walletAddress = await WalletAddress.find({
     walletAddress: options.walletAddress,
   });
   if (walletAddress.length === 0)
     return {
      result: false,
      status: 202,
      message: message.INVALID_WALLET_ADDRESS
    };
   if(stakePeriod == '3M'){
     const result = await veChainStake3.veChainUnStake3M(options);
     return result
    } else if(stakePeriod == '6M'){
     const result = await veChainStake6.veChainUnStake6M(options);  
     return result   
    } else if(stakePeriod == '12M'){
     const result = await veChainStake12.veChainUnStake12M(options);
    return result   
    }

} 


