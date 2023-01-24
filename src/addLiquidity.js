const { ethers } = require('ethers')
const { Token } = require('@uniswap/sdk-core')
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')
const { abi: IUniswapV3PoolABI }  = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json")
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json')
const ERC20ABI = require('./abi.json')
const INFURA_URL_MAINNET = process.env.REACT_APP_MAINNET_URL
const WALLET_ADDRESS = process.env.REACT_APP_WALLET_ADDRESS
const WALLET_SECRET = process.env.REACT_APP_WALLET_PRIVKEY

const poolAddress = "0xA961F0473dA4864C5eD28e00FcC53a3AAb056c1b" 
const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" 

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_MAINNET)

const name0 = 'Wrapped Ether'
const symbol0 = 'WETH'
const decimals0 = 18
const address0 = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'

const name1 = 'DAI Token'
const symbol1 = 'DAI'
const decimals1 = 18
const address1 = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'

const chainId = 42161
const WethToken = new Token(chainId, address0, decimals0, symbol0, name0)
const UniToken = new Token(chainId, address1, decimals1, symbol1, name1)

export const nonfungiblePositionManagerContract = new ethers.Contract(
  positionManagerAddress,
  INonfungiblePositionManagerABI,
  provider
)
export const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI,
  provider
)

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  }
}


export const addLiquidity = async () => {
  console.log("Inside Function add Liquidity")
  console.log(poolContract)
  const poolData = await getPoolData(poolContract)
  console.log("Fetched pool data:",poolData)

  const WETH_UNI_POOL = new Pool(
    WethToken,
    UniToken,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  )

  const position = new Position({
    pool: WETH_UNI_POOL,
    liquidity: ethers.utils.parseUnits('0.0001', 18),
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
  })

  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const approvalAmount = ethers.utils.parseUnits('10', 18).toString()
  const tokenContract0 = new ethers.Contract(address0, ERC20ABI, provider)
  await tokenContract0.connect(connectedWallet).approve(
    positionManagerAddress,
    approvalAmount
  )
  const tokenContract1 = new ethers.Contract(address1, ERC20ABI, provider)
  await tokenContract1.connect(connectedWallet).approve(
    positionManagerAddress,
    approvalAmount
  )

  const { amount0: amount0Desired, amount1: amount1Desired} = position.mintAmounts
  // mintAmountsWithSlippage

  var params = {
    token0: address0,
    token1: address1,
    fee: poolData.fee,
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: amount0Desired.toString(),
    amount1Min: amount1Desired.toString(),
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10)
  }

  console.log("PARAMS :",params)

  nonfungiblePositionManagerContract.connect(connectedWallet).mint(
    params,
    { gasLimit: ethers.utils.hexlify(1000000) }
  ).then((res) => {
    console.log(res)
  })
}
