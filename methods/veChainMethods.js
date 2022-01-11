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

const contractVechain = new web3.eth.Contract(contractAbiVECHAIN, contractAddressVECHAIN)
 const walletAddress = '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'       
const { Transaction, secp256k1} = require('thor-devkit');
module.exports.veChainMethod = async (req) => {

   try{

  let chainTag = await web3.eth.getChainTag()
  let blockRef = await web3.eth.getBlockRef()
  console.log('DHN of sender by balanceOf contract method:::', await contractVechain.methods.balanceOf('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920').call());
  console.log('DHN of receiver by balanceOf contract method:::', await contractVechain.methods.balanceOf('0xEB48fB3443152Adb8C74068e4a117BeaE117a613').call());
    console.log('value of account balance of  sender:::', await web3.eth.getBalance('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));
     console.log('value of energy balance of  sender:::', await web3.eth.getEnergy('0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920'));

  let data = await contractVechain.methods.transfer("0xEB48fB3443152Adb8C74068e4a117BeaE117a613", 100).encodeABI()
  console.log('data;;;;',data)
    const clauses = [
      {
      // from: '0x5C74975236Cb48582e1959Fa26aEbddDFC2b5920',
        to: '0x0867dd816763BB18e3B1838D8a69e366736e87a1',
        value: 100,
        data: data
      }
     ]
    const gas = await contractVechain.methods.transfer('0xEB48fB3443152Adb8C74068e4a117BeaE117a613', 100).estimateGas({
      from: walletAddress,
      to: contractAddressVECHAIN,
  });
    let body = Transaction.Body = {
      chainTag: chainTag,
      blockRef: blockRef,
      expiration: 720,
      clauses: clauses,
      gasPriceCoef: 128,
      gas: gas,
      dependsOn: null,
      nonce: Date.now()
  }
    console.log('gas:::::::',gas)
    console.log("body;;;;;;",body) 
    const tx = new Transaction(body)
    const signingHash = tx.signingHash()
    console.log('signingHash;;;;;',signingHash)
    const PRIVATE_KEY = Buffer.from('857877a619dcef1b4467eca7b986ecab675f689e0385b63f540763308c2ae480', 'hex')
   
    console.log('PRIVATE_KEY;;;',PRIVATE_KEY)
   tx.signature = secp256k1.sign(signingHash, PRIVATE_KEY)
const raw = tx.encode()
 console.log('raw;;;;;;',raw)
 const decoded = Transaction.decode(raw)
 console.log('decoded;;;;;;',decoded)
 console.log('raw.toString;;;;',raw.toString('hex'))
   return new Promise((resolve,reject)=>{
       
       web3.eth.sendSignedTransaction(`0x${raw.toString('hex')}`)
        .then(result=>{
             console.log('result in promise',result)
             resolve(true)
          }).catch(error=>{
            console.log('error in promise;;;',error)
            reject(false)
          }) 
      })

    } catch(error) {
        console.log("value of error :::",error);
        return false;
    }

};