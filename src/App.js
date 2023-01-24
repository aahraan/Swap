import './App.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { GearFill } from 'react-bootstrap-icons';

import PageButton from './components/PageButton';
import ConnectButton from './components/ConnectButton';
import ConfigModal from './components/ConfigModal';
import CurrencyField from './components/CurrencyField';
import Select from 'react-select'
import BeatLoader from "react-spinners/BeatLoader";
import { getWethContract, getUniContract, getPrice, runSwap } from './AlphaRouterService'
import { Erc20Bridger,EthBridger, getL2Network, L2ToL1Message } from '@arbitrum/sdk'

// Matic libraries

import { POSClient,use } from "@maticnetwork/maticjs"
import { Web3ClientPlugin } from '@maticnetwork/maticjs-ethers'
import { providers, Wallet } from "ethers";

// Optimism libraries
import { Alchemy, Network } from "alchemy-sdk";
import { addLiquidity } from './addLiquidity';

const config = {
  apiKey: "sRRi2Suu79SBZ3zLlTGUnkTaxgu6s9pT",
  network: Network.OPT_MAINNET,
};
const alchemy = new Alchemy(config);


function App() {
  const networklist = [
    {
      label: "Arbitrum",
      value: "1",
    },
    {
      label: "Polygon",
      value: "2",
    },
    {
      label: "Optimism",
      value: "3",
    },
  ];

  const [provider, setProvider] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [holder, setHolder] = useState(undefined)
  //const [signerAddress, setSignerAddress] = useState(undefined)
  const [erc20Bridge, setErc20Bridge] = useState(undefined)
  const [slippageAmount, setSlippageAmount] = useState(2)
  const [deadlineMinutes, setDeadlineMinutes] = useState(10)
  const [showModal, setShowModal] = useState(undefined)
  const [showMatic, setShowMatic] = useState(undefined)
  const [inputAmount, setInputAmount] = useState(undefined)
  const [outputAmount, setOutputAmount] = useState(undefined)
  const [transaction, setTransaction] = useState(undefined)
  const [loading, setLoading] = useState(undefined)
  const [ratio, setRatio] = useState(undefined)
  const [ethbalance, setEthBalance] = useState(undefined)
  const [maticbalance, setMaticBalance] = useState(undefined)
  const [wethContract, setWethContract] = useState(undefined)
  const [uniContract, setUniContract] = useState(undefined)
  const [wethAmount, setWethAmount] = useState(undefined)
  const [uniAmount, setUniAmount] = useState(undefined)
  const [network, setNetwork] = useState(networklist.value)
  const [message, setMessage] = useState(undefined)
  const [txurl,setTxurl] = useState(undefined)
  const signerAddress = process.env.REACT_APP_WALLET_ADDRESS
  const arbitrumurl= process.env.REACT_APP_INFURA_URL
  const polygonurl = process.env.REACT_APP_POLYGON_URL
  const optimismurl= process.env.REACT_APP_OPTIMISM_URL
  const privateKey = process.env.REACT_APP_WALLET_PRIVKEY
  const ARBITRUM_WETH = process.env.REACT_APP_ARBITRUM_WETH
  const ARBITRUM_DAI = process.env.REACT_APP_ARBITRUM_DAI
  const POLYGON_WETH = process.env.REACT_APP_POLYGON_WETH
  const POLYGON_DAI = process.env.REACT_APP_POLYGON_DAI
  const OPTIMISM_WETH = process.env.REACT_APP_OPTIMISM_WETH
  const OPTIMISM_DAI = process.env.REACT_APP_OPTIMISM_DAI
  var selectednetwork=1;

  useEffect(() => {
    const onLoad = async () => {
      console.log("THE WALLET Address : "+signerAddress)
      //const holder =  await ethers.getSigners(signerAddress);
      
      const provider = await new ethers.providers.JsonRpcProvider(arbitrumurl)
      const l2Network = await getL2Network(provider)
      const erc20Bridge = new Erc20Bridger(l2Network)
      const holder = provider.getSigner(signerAddress)
      setHolder(holder)
      setProvider(provider)
      setErc20Bridge(erc20Bridge)
      const wethContract = getWethContract()
      setWethContract(wethContract)

      const uniContract = getUniContract()
      setUniContract(uniContract)
    }
    onLoad()
  }, [])

  const getWalletAddress = () => {
          provider.getBalance(signerAddress).then((balance) => {
            // convert a currency unit from wei to ether
            const balanceInEth = ethers.utils.formatEther(balance)
            console.log(`balance: ${balanceInEth} ETH`)
            setEthBalance(Number(balanceInEth))
           })
           
           const l2Token0 = erc20Bridge.getL2TokenContract(provider, ARBITRUM_WETH) // WETH token address
           l2Token0.functions.balanceOf(signerAddress).then(res=>{
            console.log(Number(ethers.utils.formatEther(res[0])))
            setWethAmount( Number(ethers.utils.formatEther(res[0])) )
            
            const l2Token = erc20Bridge.getL2TokenContract(provider, ARBITRUM_DAI) // DAI token address
           l2Token.functions.balanceOf(signerAddress).then(res1=>{
            console.log(Number(ethers.utils.formatEther(res1[0])))
            setUniAmount( Number(ethers.utils.formatEther(res1[0])) )
           })
          
          })
      
  }

  if (signer !== undefined) {
    getWalletAddress()
  }

  const getSwapPrice = (inputAmount) => {
    setLoading(true)
    setInputAmount(inputAmount)
    console.log("Selected Network",network)
    const swap = getPrice(
      inputAmount,
      slippageAmount,
      Math.floor(Date.now()/1000 + (deadlineMinutes * 60)),
      signerAddress,
      network
    ).then(data => {
      setTransaction(data[0])
      setOutputAmount(data[1])
      setRatio(data[2])
      setLoading(false)
    })
  }

  const submitSwap = (transaction, network) => {
   
    runSwap(transaction, network, signerAddress,holder).then(data => {
      setMessage(data[0])
      setTxurl(data[1])
      loadbalances(network)
    })
  }

  const loadbalances = async(network) =>{
    if(network==1) 
    {
      const provider = await new ethers.providers.JsonRpcProvider(arbitrumurl)
      const l2Network = await getL2Network(provider)
      const erc20Bridge = new Erc20Bridger(l2Network)
      console.log("The Address:"+signerAddress)
      const from = signerAddress
      const holder = provider.getSigner(signerAddress)
      setHolder(holder)
      setProvider(provider)
      setErc20Bridge(erc20Bridge)
      const wethContract = getWethContract()
      setWethContract(wethContract)
      const uniContract = getUniContract()
      setUniContract(uniContract)
      setShowMatic(false)
      provider.getBalance(from).then((balance) => {
        // convert a currency unit from wei to ether
        const balanceInEth = ethers.utils.formatEther(balance)
        console.log(`balance: ${balanceInEth} ETH`)
        setEthBalance(Number(balanceInEth))
       })
       
       const l2Token0 = erc20Bridge.getL2TokenContract(provider, ARBITRUM_WETH) // WETH token address
       l2Token0.functions.balanceOf(from).then(res=>{
        console.log(Number(ethers.utils.formatEther(res[0])))
        setWethAmount( Number(ethers.utils.formatEther(res[0])) )
        
        const l2Token = erc20Bridge.getL2TokenContract(provider, ARBITRUM_DAI) // DAI token address
       l2Token.functions.balanceOf(from).then(res1=>{
        console.log(Number(ethers.utils.formatEther(res1[0])))
        setUniAmount( Number(ethers.utils.formatEther(res1[0])) )
       })
      
      })
      
    }
    else if(network==2)
    {

      use(Web3ClientPlugin);
      const parentProvider = new providers.JsonRpcProvider("https://mainnet.infura.io/v3/7ec34056139648318f79b2ac79a07e13");
      const childProvider = new providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/7ec34056139648318f79b2ac79a07e13");    
      const posClient = new POSClient();
      await posClient.init({
          network: 'mainnet',
          version: 'v1',
          parent: {
            provider: new Wallet(privateKey, parentProvider),
            defaultConfig: {
              from : signerAddress
            }
          },
          child: {
            provider: new Wallet(privateKey, childProvider),
            defaultConfig: {
              from : signerAddress
            }
          }
      });
        const maticToken = posClient.erc20('0x0000000000000000000000000000000000001010')
        const erc20Token1 = posClient.erc20(POLYGON_WETH)
        const erc20Token2 = posClient.erc20(POLYGON_DAI)
        console.log("*************************************************************")
        const balance1 = await erc20Token1.getBalance(signerAddress);
        console.log("balance",balance1);   
        const balance2 = await erc20Token2.getBalance(signerAddress);
        const maticbalance = await maticToken.getBalance(signerAddress)
        setWethAmount( Number(ethers.utils.formatEther(balance1)) )
        setUniAmount( Number(ethers.utils.formatEther(balance2)) )
        setMaticBalance(Number(ethers.utils.formatEther(maticbalance)))
        setShowMatic(true)
        
    }
    else if(network==3)
    {
      setShowMatic(false)
        const provider = await new ethers.providers.JsonRpcProvider(optimismurl)
        const balance = ethers.utils.formatEther(await provider.getBalance(signerAddress));
      console.log("ETH Balance on Optimism",balance)
      setEthBalance(Number(balance))
      const holder = provider.getSigner(signerAddress)
      setHolder(holder)
      //The below token contract address corresponds to USDT
      const tokenContractAddresses = [OPTIMISM_WETH,OPTIMISM_DAI];
      const data = await alchemy.core.getTokenBalances(signerAddress,tokenContractAddresses);
      console.log("Token balance for Address",data);
      setWethAmount( Number(ethers.utils.formatEther(data.tokenBalances[0].tokenBalance)) )
      setUniAmount( Number(ethers.utils.formatEther(data.tokenBalances[1].tokenBalance)) )
    }
  }

  const handlechange = async(e) => {
    console.log("The Network:"+e.value)
    setNetwork(e.value)
    setMessage("")
    setTxurl("")
    loadbalances(e.value)
  }
     
  

  return (
    <div className="App">
      <div className="appNav">
        <div className="my-2 buttonContainer buttonContainerTop">
          <PageButton name={"Swap"} isBold={true} />
          <PageButton name={"Pool"} />
          <PageButton name={"Vote"} />
          <PageButton name={"Charts"} />
        </div>

        <div className="rightNav">
          {/* <div className="connectButtonContainer">
            <ConnectButton
              provider={provider}
              isConnected={isConnected}
              signerAddress={signerAddress}
              getSigner={getSigner}
            />
          </div> */}
          <div className="my-2 selectWrapper">
          <Select options={networklist}  onChange={handlechange}/>
          </div>
        </div>
      </div>

      <div className="appBody">
        <div className="swapContainer">
          <div className="swapHeader">
            <span className="swapText">Swap</span>
            <span className="gearContainer" onClick={() => setShowModal(true)}>
              <GearFill />
            </span>
            {showModal && (
              <ConfigModal
                onClose={() => setShowModal(false)}
                setDeadlineMinutes={setDeadlineMinutes}
                deadlineMinutes={deadlineMinutes}
                setSlippageAmount={setSlippageAmount}
                slippageAmount={slippageAmount} />
            )}
          </div>

          <div className="swapBody">
            <CurrencyField
              field="input"
              tokenName="WETH"
              getSwapPrice={getSwapPrice}
              signer={signer}
              balance={wethAmount} />
            <CurrencyField
              field="output"
              tokenName="DAI"
              value={outputAmount}
              signer={signer}
              balance={uniAmount}
              spinner={BeatLoader}
              loading={loading} />
          </div>

          <div className="ratioContainer">
            {ratio && (
              <>
                {`1 DAI = ${ratio} WETH`}
              </>
            )}
          </div>

          <div className="ratioContainer">
            {ethbalance && (
              <>
                {`Balance = ${ethbalance} ETH`}
              </>
            )}
          </div>

          {showMatic &&(<div className="ratioContainer">
            {maticbalance && (
              <>
                {`Balance = ${maticbalance} MATIC`}
              </>
            )}
          </div>)}



          <div className="swapButtonContainer">
           
              <div
                onClick={() => submitSwap(transaction, network)}
                className="swapButton"
              >
                Swap
              </div>
          
          </div>


          <div className="swapButtonContainer">
           
              <div
                onClick={() => addLiquidity()}
                className="swapButton"
              >
                Add Liquidity
              </div>
          
          </div>

          <div className="swapBody">
               {message}
          </div>

          <div className="swapBody">
               {txurl}
          </div>

        </div>
      </div>

    </div>
  );
}

export default App;

