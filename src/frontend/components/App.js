import './App.css';
import { useState } from 'react';
import { ethers } from 'ethers';
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAddress from '../contractsData/NFT-address.json'
import NFTAbi from '../contractsData/NFT.json'
import MarketplaceAbi from '../contractsData/Marketplace.json'
import Navigation from './NavBar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Create from './Create';
import MyListedItem from './MyListedItem';
import MyPurchases from './MyPurchases';
import { Spinner } from 'react-bootstrap';

function App() {

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState();

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);

    const provider = new ethers.providers.Web3Provider(window.ethereum)

    const signer = provider.getSigner()
    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
    })

    window.ethereum.on('accountsChanged', async function (accounts) {
      setAccount(accounts[0])
      await web3Handler()
    })

    loadContracts(signer);


  }

  const loadContracts = async (signer) => {

    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    setMarketplace(marketplace);
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft);
    setLoading(false);
  }

  return (
    <Router>
      <div className="App">
        <>
          <Navigation web3Handler={web3Handler} account={account} />
        </>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spinner animation="border" style={{ display: 'flex' }} />
            <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
          </div>
        ) : (
          <Routes>

            <Route path="/" element={<Home marketplace={marketplace} nft={nft} />} />

            <Route path="/create" element={
              <Create marketplace={marketplace} nft={nft} />

            } />
            <Route path="/my-listed-items" element={
              <MyListedItem marketplace={marketplace} nft={nft} account={account} />

            } />
            <Route path="/my-purchases" element={
              <MyPurchases marketplace={marketplace} nft={nft} account={account} />
            } />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
