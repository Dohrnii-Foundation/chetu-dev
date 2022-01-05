const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/1e08f56f5e8f46c9be366f614b88f2ef')); // kovan test network
const fs = require('fs');
const contractabiDHN = JSON.parse(fs.readFileSync("IERC20.json",'utf8'));
const contractAddressDHN = "0xB63E3f2Fbe7A6529641A9792fA402af57F4910eA";
         
  const walletAddress = "0x8EFef04B92271d94a04d8aaeFe5C6A6597e68b68"; 
const contractDHN = new web3.eth.Contract(contractabiDHN,contractAddressDHN, { from: walletAddress });

module.exports.web3Method = async (req) => {
  
    //let connect = await web3.eth.net.isListening()

   // web3.personal.unlockAccount("0x8EFef04B92271d94a04d8aaeFe5C6A6597e68b68", "ebb0d66ec1f4de8df9870b6284cf2c3d8c7eb0cd4223a9c3e3ceed7b4c988983", 1000);
    // const options = {
    //     to: "0xFdab82913EE8b1ac6a7c52736dC598475Db29cc1", // address where you want to transfer tokens
    //     value: 100000000000000, // amount you want to transfer (1matic= 100000000000000000)
    //     gas: "21000", // gas value for this transaction to succed

    // };

    try{
        const count = await web3.eth.getTransactionCount(walletAddress)
        const gasPrice = await web3.eth.getGasPrice()
         const gasLimit = await contractDHN.methods.transfer('0xFdab82913EE8b1ac6a7c52736dC598475Db29cc1', 10).estimateGas({
            from: walletAddress,
            to: contractAddressDHN,
        });
       let data = contractDHN.methods.transfer("0xFdab82913EE8b1ac6a7c52736dC598475Db29cc1", 10).encodeABI()
       let options = {
          "from": walletAddress,     // account of user
          "nonce": web3.utils.toHex(count),
          "gasPrice": web3.utils.toHex(gasPrice),
          "gasLimit": web3.utils.toHex(gasLimit),
          "to": contractAddressDHN,   // contract address
          "data": data,
        };
        const signed = await web3.eth.accounts.signTransaction(options, '0xebb0d66ec1f4de8df9870b6284cf2c3d8c7eb0cd4223a9c3e3ceed7b4c988983');
        //submitting transaction to blockchain
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        console.log(receipt);
        
        console.log('value of account balance of  sender:::', await contractDHN.methods.balanceOf(walletAddress).call());
    
        console.log('value of account balance of receiver:::', await contractDHN.methods.balanceOf("0xFdab82913EE8b1ac6a7c52736dC598475Db29cc1").call());

        return true;
    }

    catch(error){
        console.log("value of error :::",error);
        return false;
    }

};