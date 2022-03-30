const { thorify } = require('thorify');
const Web3 = require('web3');
const fs = require('fs');
//const web3 = thorify(new Web3(), "https://testnet.veblocks.net/"); // veChain test network
// const web3 = thorify(new Web3(), "https://sync-testnet.vechain.org/"); // veChain test network
//const web3 = thorify(new Web3(), "https://sync-testnet.veblocks.net/") // veChain test network
const web3 = thorify(new Web3(), "http://3.71.71.72:8669/") // veChain test network
//const web3 = thorify(new Web3(), "http://3.124.193.149:8669"); // veChain main network
//const contractAddressStak = "0x0e3771a0169d786BC9E6Cc2D2aDcd2bD3f80f864"; //3months //signanture = '0xa694fc3a'
//const contractAddressStak = "0x9A849566209d78784eC42701DE203D4b9502f2A4"; //6months  //signature = '0xa694fc3a'
const contractAddressStak = "0xE397e12F51CB3311b5D0D0C77bBF44133F3b6210"; //12months //signature = '0xa694fc3a'
const contractAbiDHNStak = JSON.parse(fs.readFileSync("ABI.json",'utf8'));      
const { Driver,SimpleWallet,SimpleNet } = require('@vechain/connex-driver');
const { Framework } = require('@vechain/connex-framework');
const { TransactionHistory, validateBlockChainTransfer } = require("../models/transactionHistory");
const { WalletAddress } = require("../models/walletAddress");
const { Token } = require("../models/token");
const message = require("../lang/message");
const { coinUsdValue,validateCoinShortNameVechain } = require("../helper/helper");
//////////////////////Implement thor-devkit/////////////////////////// 
// const cry = require('thor-devkit/dist/cry')
// const Transaction = require('thor-devkit/dist/transaction').Transaction

// 3 month (50s): 0x0e3771a0169d786BC9E6Cc2D2aDcd2bD3f80f864
// 6 month (100s) : 0x9A849566209d78784eC42701DE203D4b9502f2A4
// 1 year(150s): 0xE397e12F51CB3311b5D0D0C77bBF44133F3b6210

const { Transaction, secp256k1, address, abi } = require('thor-devkit');
//const fetch = require('node-fetch');
const axios = require('axios');

module.exports.veChainStaking = async (req) => {
  const amount = 1
  const walletAddress = '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'
  const walletAddressTo = "0xb5De9FA2Cfb660AC61ca009B754e256301147BDf"
  const contractDHN = new web3.eth.Contract(contractAbiDHNStak,contractAddressStak, { from: walletAddress });
  let amountInWei = await web3.utils.toWei((amount).toString(), 'ether');
  let data = contractDHN.methods.stake(amountInWei).encodeABI()
  let chainTag = await web3.eth.getChainTag()
  let blockRef = await web3.eth.getBlockRef()
  console.log('chainTag;;',chainTag)
  console.log('blockRef;;;',blockRef)
  console.log('data;;;',data)
  const abi_dict ={
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  } 

 //// # Verify if abi_dict is in good shape.
//let f1 = abi.FUNCTION(abi_dict)

//# Get a function instance of the abi.
let f = new abi.Function(abi_dict)
console.log('f;;;;;',f)
f.encode([ 1 ] )
console.log('f.encode;;;;;',f)

///# Get function selector:
// let selector = f.selector.hex()
// console.log('selector;;;',selector)
  const clauses =  [{
    to: contractAddressStak,
    value: 0,
    data: '0xa694fc3a'
}]
//return true
  // Construct transaction body.
  const txBody = {
      // Test-net: 0x27,  Main-net: 0x4a.
      chainTag: 0x27,
      // After which block this tx should happen?
      // 16 characters of block ID.
      blockRef: blockRef,//'0x004984e1064ed410', // need to look later
                        //'0x00b457b0b4a353c9'
      // Expires after 30 days.
      expiration: 30 * 8640,
      // Call the contract method "increaseAmount"
      clauses: clauses,
      gasPriceCoef: 0,
      gas: 50000,
      dependsOn: null,
      nonce: 12345678//'0xa3b6232f' // Random number // replace this later with Date.now() after convert it to hex
      // Must include this field to activate VIP-191.
      // reserved: { 
      //     features: 1
      // }
  }
  // Construct a transaction.
  const tx = new Transaction(txBody)


    // User private key.
    const originPriv = Buffer.from(
      '857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480',
      'hex'
  )
  console.log('originPriv;;;',originPriv)
  // User public address: 0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920
  const pubKey = secp256k1.derivePublicKey(originPriv)
  console.log('pubKey;;;',pubKey)
  const addr = address.fromPublicKey(pubKey)
  console.log('addr;;;',addr)

  // Construct the hash for signing.
const originHash = tx.signingHash()
console.log('originHash;;;',originHash)
  // Construct the user signature.
const originSignature = secp256k1.sign(originHash, originPriv)
console.log('originSignature;;;;',originSignature)
tx.signature = originSignature
// Convert the tx to raw format.
const rawTx = '0x' + tx.encode().toString('hex')
console.log('rawTx;;;;',rawTx)
  
try{
       // Submit the raw transaction by hand to the test-net.
    //  const url = 'https://sync-testnet.vechain.org/transactions'
      const url = 'http://3.71.71.72:8669/transactions'
    let response = await axios.post(url, {
            raw:rawTx
      })
      console.log('response;;;;',response)
      console.log('respnse.data;;;;',response.data)
      // const response = await fetch(url, {
      //                         method: 'post',
      //                         body: JSON.stringify({'raw': rawTx}),
      //                         headers: {'Content-Type': 'application/json'}
      //                       });
      //     const data = await response.json();

      //  console.log('data;;;;;',data);
  //  let result = await fetch(url, {
  //         method: 'POST',
  //         headers: {
  //             'Accept': 'application/json',
  //             'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify({'raw': rawTx})
  //     })
  //     console.log('result;;;;;;',result)
  //     console.log('result.text();;;;',result.text())
      // .then(response => {
      //     response.text().then(r => {console.log(r)})
      // }).catch(err => {
      //     console.log('err', err)
      // })
      return true
}catch(err){
    console.log('err.message;;;;',err.message)
   console.log('err;;;;',err)
   return false
}
   
 } 
