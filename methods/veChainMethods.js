const { thorify } = require('thorify');
const Web3 = require('web3');
const web3 = thorify(new Web3(), "https://testnet.veblocks.net/"); // veChain test network
//const web3 = thorify(new Web3(), "http://3.124.193.149:8669"); // veChain main network
const fs = require('fs');
const contractAbiVECHAIN = JSON.parse(fs.readFileSync("VeChainToken.json",'utf8'));
const contractAddressVECHAIN = "0x0867dd816763BB18e3B1838D8a69e366736e87a1";

const contractVechain = new web3.eth.Contract(contractAbiVECHAIN, contractAddressVECHAIN)
        
const { Transaction, secp256k1} = require('thor-devkit');
module.exports.veChainMethod = async (req) => {

   try{

  let chainTag = await web3.eth.getChainTag()
  let blockRef = await web3.eth.getBlockRef()
  console.log('value of account balance of sender by balanceOf contract method:::', await contractVechain.methods.balanceOf('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920').call());
    console.log('value of account balance of  sender:::', await web3.eth.getBalance('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));
     console.log('value of energy balance of  sender:::', await web3.eth.getEnergy('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));

  let data = contractVechain.methods.transfer("0xEB48fB3443152Adb8C74068e4a117BeaE117a613", 10).encodeABI()
  console.log('data;;;;',data)
    const clauses = [
      {
        from: '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920',
        to: '0xEB48fB3443152Adb8C74068e4a117BeaE117a613',
        value: 10,
        data: data
      }
     ]
    const gas = Transaction.intrinsicGas(clauses)
    let body = Transaction.Body = {
      chainTag: chainTag,
      blockRef: blockRef,
      expiration: 720,
      clauses: clauses,
      gasPriceCoef: 128,
      gas,
      dependsOn: null,
      nonce: Date.now()
  }
    console.log('gas:::::::',gas)
    const tx = new Transaction(body)
    const signingHash = tx.signingHash()
    console.log('signingHash;;;;;',signingHash)
    const PRIVATE_KEY = Buffer.from('0x857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480'.slice(2), 'hex')
   
    console.log('PRIVATE_KEY;;;',PRIVATE_KEY)
   tx.signature = secp256k1.sign(signingHash, PRIVATE_KEY)
const raw = tx.encode()
 console.log('raw;;;;;;',raw)
 const decoded = Transaction.decode(raw)
 console.log('decoded;;;;;;',decoded)
 const hexSignature = `0x${tx.signature.toString('hex')}`
 console.log('hexSignature;;;;',hexSignature)
 console.log('raw.toString;;;;',raw.toString('hex'))
const transactionId = await web3.eth.sendSignedTransaction(`0x${raw.toString('hex')}`)
.once("transactionHash", function(hash) {
   console.log('hash;;;;;',hash)
     })
  .once("receipt", async function(receipt) {
    console.log('receipt;;;;;',receipt)
  })
  .once("error", async function(error) {
    console.log('error;;;;;',error)
  });
   console.log('transactionId;;',transactionId)

       return true
    } catch(error) {
        console.log("value of error :::",error);
        return false;
    }

};