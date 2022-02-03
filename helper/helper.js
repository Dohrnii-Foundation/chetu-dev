module.exports.validateBlockChain = async(option) =>{
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