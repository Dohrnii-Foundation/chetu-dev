const { thorify } = require('thorify');
const Web3 = require('web3');
//const web3 = thorify(new Web3(), "https://testnet.veblocks.net/"); // veChain test network
// const web3 = thorify(new Web3(), "https://sync-testnet.vechain.org/"); // veChain test network
//const web3 = thorify(new Web3(), "https://sync-testnet.veblocks.net/") // veChain test network
const web3 = thorify(new Web3(), "http://3.71.71.72:8669/") // veChain test network
//const web3 = thorify(new Web3(), "http://3.124.193.149:8669"); // veChain main network
const fs = require('fs');
const contractAbiVECHAIN = JSON.parse(fs.readFileSync("VeChainToken.json",'utf8'));
const contractAddressVECHAIN = "0x0867dd816763BB18e3B1838D8a69e366736e87a1";
const walletAddress = '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'   
const contractVechain = new web3.eth.Contract(contractAbiVECHAIN, contractAddressVECHAIN, { from: walletAddress })    
const { Driver,SimpleWallet,SimpleNet } = require('@vechain/connex-driver');
const { Framework } = require('@vechain/connex-framework');

module.exports.veChainMethod = async (req) => {

   try{
///Alternate approach////////////
const wallet = new SimpleWallet();

wallet.import('0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480');

const driver = await Driver.connect(new SimpleNet("http://3.71.71.72:8669/"),wallet)
const connex = new Framework(Framework.guardDriver(driver))
const ammount = 1
const dhn = web3.utils.toBN(ammount * (1000000000000000000)).toString()
const to = '0xEB48fB3443152Adb8C74068e4a117BeaE117a613'
var vetamount ="0x" + (ammount * 10 **18).toString(16);

const transferABI = {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}
const transferMethod = connex.thor.account(contractAddressVECHAIN).method(transferABI);
const txSigningService = transferMethod.transact("0xEB48fB3443152Adb8C74068e4a117BeaE117a613",1000);
const transactionInfo = await txSigningService.gas(3000000).request();
//Logging purpose
console.log("transactionInfo:",transactionInfo);
console.log('DHN receiver:::',await contractVechain.methods.balanceOf('0xEB48fB3443152Adb8C74068e4a117BeaE117a613').call());
console.log('DHN sender:::',await contractVechain.methods.balanceOf('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920').call());
console.log('value of account balance of  sender:::',await web3.eth.getBalance('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));
console.log('value of energy balance of  sender:::',await web3.eth.getEnergy('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));



/////////////Only send the VET tokens//////////////////////////
//     let msg = {
//         to,
//         value: vetamount
//     };
// const signingService = connex.vendor.sign('tx', [msg]);
//     let resp = await signingService.request();
//     console.log("resp:;;;;;", resp);
 
   return true;
    } catch(error) {
        console.log("value of error :::",error);
        return false;
    }

};