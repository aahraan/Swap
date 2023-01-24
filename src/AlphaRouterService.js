const { AlphaRouter, SWAP_ROUTER_ADDRESS } = require('@uniswap/smart-order-router')
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')
const { ethers, BigNumber } = require('ethers')
const JSBI = require('jsbi')
const ERC20ABI = require('./abi.json')

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'
const REACT_APP_WALLET_ADDRESS = process.env.REACT_APP_WALLET_ADDRESS
const privateKey = process.env.REACT_APP_WALLET_PRIVKEY


const ARBITRUM_WETH = process.env.REACT_APP_ARBITRUM_WETH
const ARBITRUM_DAI = process.env.REACT_APP_ARBITRUM_DAI

const POLYGON_WETH = process.env.REACT_APP_POLYGON_WETH
const POLYGON_DAI = process.env.REACT_APP_POLYGON_DAI

const OPTIMISM_WETH = process.env.REACT_APP_OPTIMISM_WETH
const OPTIMISM_DAI = process.env.REACT_APP_OPTIMISM_DAI

var REACT_APP_INFURA_URL = process.env.REACT_APP_INFURA_URL
console.log("The RPC Endpoint : "+REACT_APP_INFURA_URL)
var chainId = parseInt(process.env.REACT_APP_ARBITRUM_CHAINID)
console.log("The chain id : "+chainId)
var web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL)
var router = new AlphaRouter({ chainId: chainId, provider: web3Provider })
var wallet = new ethers.Wallet(privateKey, web3Provider)



const name0 = 'Wrapped Ether'
const symbol0 = 'WETH'
const decimals0 = 18
var address0 = ARBITRUM_WETH

const name1 = 'DAI Token'
const symbol1 = 'DAI'
const decimals1 = 18
var address1 = ARBITRUM_DAI



var WETH = new Token(chainId, address0, decimals0, symbol0, name0)
var UNI = new Token(chainId, address1, decimals1, symbol1, name1)

export var getWethContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider)
export var getUniContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)





export const getPrice = async (inputAmount, slippageAmount, deadline, walletAddress,network) => {

  if(network == 1)
  {
    console.log("Creating transaction for Arbitrum")
    REACT_APP_INFURA_URL = process.env.REACT_APP_INFURA_URL
    chainId = parseInt(process.env.REACT_APP_ARBITRUM_CHAINID)
    address0 = ARBITRUM_WETH
    address1 = ARBITRUM_DAI
    WETH = new Token(chainId, address0, decimals0, symbol0, name0)
    UNI = new Token(chainId, address1, decimals1, symbol1, name1)
    web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL)
    router = new AlphaRouter({ chainId: chainId, provider: web3Provider })
    wallet = new ethers.Wallet(privateKey, web3Provider)
    getWethContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider)
    getUniContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)
  }
  else if(network == 2)
  {
    console.log("Creating transaction for Polygon")
    REACT_APP_INFURA_URL = process.env.REACT_APP_POLYGON_URL
    chainId = parseInt(process.env.REACT_APP_POLYGON_CHAINID)
    address0 = POLYGON_WETH
    address1 = POLYGON_DAI
    WETH = new Token(chainId, address0, decimals0, symbol0, name0)
    UNI = new Token(chainId, address1, decimals1, symbol1, name1)
    web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL)
    router = new AlphaRouter({ chainId: chainId, provider: web3Provider })
    wallet = new ethers.Wallet(privateKey, web3Provider)
    getWethContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider)
    getUniContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)
  }
  else if(network ==3)
  {
    console.log("Creating transaction for Optimism")
    REACT_APP_INFURA_URL = process.env.REACT_APP_OPTIMISM_URL
    chainId = parseInt(process.env.REACT_APP_OPTIMISM_CHAINID)
    address0 = OPTIMISM_WETH
    address1 = OPTIMISM_DAI
    WETH = new Token(chainId, address0, decimals0, symbol0, name0)
    UNI = new Token(chainId, address1, decimals1, symbol1, name1)
    web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL)
    router = new AlphaRouter({ chainId: chainId, provider: web3Provider })
    wallet = new ethers.Wallet(privateKey, web3Provider)
    getWethContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider)
    getUniContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)
    
  }
  const percentSlippage = new Percent(slippageAmount, 100)
  const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals0)
  const currencyAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei))
  console.log("currencyAmount",currencyAmount)
  console.log("UNI",UNI)

  console.log("INPUT",TradeType.EXACT_INPUT)

  console.log("walletAddress",walletAddress)
  console.log("percentSlippage",percentSlippage)
  console.log("deadline",deadline)



  const route = await router.route(
    currencyAmount,
    UNI,
    TradeType.EXACT_INPUT,
    {
      recipient: walletAddress,
      slippageTolerance: percentSlippage,
      deadline: deadline,
    }
  )

  console.log(`Quote Exact In: ${route}`);

  
  //console.log("gasprice"+route.gasPriceWei)
   

  const transaction = {
    data: route.methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route.methodParameters.value),
    from: walletAddress,
    gasPrice: BigNumber.from(route.gasPriceWei),
    gasLimit: ethers.utils.hexlify(820000)
  }

  console.log(transaction)
  const quoteAmountOut = route.quote.toFixed(6)
  const ratio = (inputAmount / quoteAmountOut).toFixed(4)

  return [
    transaction,
    quoteAmountOut,
    ratio
  ]
}

export const runSwap = async (transaction, network,signer,holder) => {
   console.log("holder",holder)
   const approvalAmount = ethers.utils.parseUnits('10', 18).toString()
   const contract0 = getWethContract()
   await contract0.connect(wallet).approve(
     V3_SWAP_ROUTER_ADDRESS,
    approvalAmount
   )
  wallet.signTransaction(transaction)
  let sendTxn = wallet.sendTransaction(transaction)
  //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
  let reciept = (await sendTxn).wait()
  //Logs the information about the transaction it has been mined.
  var txurl="https://arbiscan.io/tx/"
  if(network==1)
  {
       txurl="https://arbiscan.io/tx/"
  }
  else if(network==2)
  {
        txurl="https://polygonscan.com/tx/"
  }
  else if(network==3)
  {
     txurl="https://optimistic.etherscan.io/tx/"
  }
  if (reciept) {
      var msg = "Success"
      var hash = (await sendTxn).hash
      var blockNumber = (await reciept).blockNumber
      txurl=txurl+hash
      console.log(" - Transaction is mined - " + '\n' 
      + "Transaction Hash:", hash
      + '\n' + "Block Number: " 
      + blockNumber + '\n' 
      + "Navigate to "+txurl , "to see your transaction")

      return [msg,txurl,blockNumber,hash]

  } else {
      var msg = "Error"
      console.log("Error submitting transaction")
      return [msg,""]
  }
}

