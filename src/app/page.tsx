"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { initializeContract, mintNFT } from './utils/ContractIntegration';
import { uploadToPinata } from './utils/pinataUtils';
import Connect from './connect';


export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState<any>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [mintDetails, setMintDetails] = useState({
    name: '',
    description: '',
    collectionName: 'Default'
  });
  const [mintLoading, setMintLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const { contract, address } = await initializeContract();
        setContract(contract);
        setWallet(address);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error: any) {
      setError('Failed to connect wallet');
    }
  };

  // Generate image function
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios({
        method: 'post',
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STABILITY_API_KEY}`,
          'Accept': 'application/json'
        },
        data: {
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }
      });

      if (response.data?.artifacts?.[0]) {
        const base64Image = response.data.artifacts[0].base64;
        setImage(`data:image/png;base64,${base64Image}`);
        setShowMintDialog(true);
      }
    } catch (error: any) {
      console.error('Detailed error:', error);
      setError(error.response?.data?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  // Handle NFT minting
  const handleMint = async () => {
    if (!image || !contract || !wallet) return;

    try {
      setMintLoading(true);
      setError('');

      // Upload to Pinata
      const pinataResponse = await uploadToPinata(image, {
        name: mintDetails.name,
        description: mintDetails.description,
        prompt
      });

      // Mint NFT
      await mintNFT(
        contract,
        mintDetails.collectionName,
        mintDetails.name,
        mintDetails.description,
        pinataResponse.imageUrl
      );

      setShowMintDialog(false);
      alert('NFT minted successfully!');
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      setError(error.message || 'Failed to mint NFT');
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black py-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] 
                         bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full 
                         mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full 
                         mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full 
                         mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Wallet Connect Button */}
      <div className="absolute top-4 right-4 z-20">
        {/* <button
          onClick={connectWallet}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg 
                   text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          {wallet ? `Connected: ${wallet.slice(0,6)}...${wallet.slice(-4)}` : 'Connect Wallet'}
        </button> */}
        <Connect/>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-mono md:text-5xl font-bold text-white mb-4 tracking-tight">
            Mint Scape
          </h1>
          <p className="text-lg text-blue-100/80">
            Mint your NFT's with AI
          </p>
        </div>

        {/* Main Content */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="space-y-6">
            {/* Prompt Input */}
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white 
                          placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                          focus:border-transparent backdrop-blur-sm min-h-[120px] transition-all 
                          duration-300 hover:bg-white/10"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 
                            to-purple-500/20 opacity-0 group-hover:opacity-100 
                            transition-opacity duration-300 pointer-events-none"></div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="relative w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 
                       rounded-xl text-white font-semibold text-lg shadow-lg overflow-hidden
                       hover:from-blue-500 hover:to-purple-500 transition-all duration-300
                       disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed group"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span>Generating</span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" 
                          style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" 
                          style={{ animationDelay: '0.4s' }}></span>
                  </span>
                ) : (
                  'Generate Image'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 
                           to-transparent translate-x-[-200%] group-hover:translate-x-[200%] 
                           transition-transform duration-1000"></div>
            </button>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mt-6 backdrop-blur-md bg-red-500/10 border border-red-500/20 
                         rounded-xl p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Generated Image */}
          {image && (
            <div className="mt-8">
              <div className="relative group rounded-2xl overflow-hidden backdrop-blur-sm 
                           bg-white/5 border border-white/20 p-4">
                <img 
                  src={image} 
                  alt="Generated" 
                  className="w-full rounded-xl shadow-2xl transform transition-transform 
                           duration-300 group-hover:scale-[1.02]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent 
                             to-transparent opacity-0 group-hover:opacity-100 
                             transition-opacity duration-300"></div>
              </div>

              {/* Mint Dialog */}
              {showMintDialog && (
                <div className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 
                             border border-white/20">
                  <h3 className="text-xl text-white font-semibold mb-4">Create Your NFT</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="NFT Name"
                      value={mintDetails.name}
                      onChange={(e) => setMintDetails(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-xl 
                               text-white focus:ring-2 focus:ring-blue-500/50"
                    />
                    <textarea
                      placeholder="NFT Description"
                      value={mintDetails.description}
                      onChange={(e) => setMintDetails(prev => ({...prev, description: e.target.value}))}
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-xl 
                               text-white min-h-[100px] focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={handleMint}
                      disabled={mintLoading || !wallet || !mintDetails.name}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 
                               rounded-xl text-white font-semibold hover:from-green-600 
                               hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-300"
                    >
                      {mintLoading ? 'Minting...' : 'Mint NFT'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}