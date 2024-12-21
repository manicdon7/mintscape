"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Upload, Image as ImageIcon, Wand2 } from "lucide-react";
import Connect from "./connect";
import { uploadToPinata } from "@/app/utils/pinataUtils";
import { initializeContract, mintNFT } from "@/app/utils/ContractIntegration";
import axios from "axios";

export default function EnhancedNFTMinter() {
  const [mode, setMode] = useState("upload");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [mintDetails, setMintDetails] = useState({
    name: "",
    description: "",
    collectionName: "Default",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        const { contract: newContract, address } = await initializeContract();
        setContract(newContract);
        setWallet(address);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        toast.error("Failed to connect to wallet. Please ensure MetaMask is installed and connected.");
      }
    };
  
    initContract();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setShowMintDialog(true);
      };
      reader.readAsDataURL(file);

      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };


  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.warning("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);

      const response = await axios({
        method: "post",
        url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STABILITY_API_KEY}`,
        },
        data: {
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 30,
        },
      });

      if (response.data?.artifacts?.[0]) {
        const base64Image = response.data.artifacts[0].base64;
        setImage(`data:image/png;base64,${base64Image}`);
        setShowMintDialog(true);
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!image || !mintDetails.name) {
      toast.warning("Please fill in all required fields");
      return;
    }
  
    try {
      setLoading(true);
  
      // Upload to Pinata first
      const pinataResponse = await uploadToPinata(image, {
        name: mintDetails.name,
        description: mintDetails.description,
        prompt: mode === "ai" ? prompt : undefined,
      });
  
      // Check if we need to initialize contract
      let contractInstance = contract;
      if (!contractInstance) {
        const { contract: newContract, address } = await initializeContract();
        setContract(newContract);
        setWallet(address);
        contractInstance = newContract;
      }
  
      if (!contractInstance) {
        throw new Error("Failed to initialize contract");
      }
  
      // Now use the contract instance
      await mintNFT(
        contractInstance,
        mintDetails.collectionName,
        mintDetails.name,
        mintDetails.description,
        pinataResponse.imageUrl
      );
  
      setShowMintDialog(false);
      toast.success("NFT minted successfully! 🎉");
    } catch (error) {
      console.error("Mint error:", error);
      toast.error(error.message || "Failed to mint NFT");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black py-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Animated background elements */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
                     bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl" />
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="absolute top-4 right-4">
          <Connect />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-400 to-blue-400">
            NFT Creator Studio
          </h1>
          <p className="text-lg text-blue-100/80">
            Create and mint unique NFTs with AI-powered generation or custom uploads
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Mode Selection */}
          <div className="flex justify-center space-x-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('upload')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors
                       ${mode === 'upload' 
                         ? 'bg-purple-500 text-white' 
                         : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              <Upload size={20} />
              <span>Upload Image</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('ai')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors
                       ${mode === 'ai' 
                         ? 'bg-blue-500 text-white' 
                         : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              <Wand2 size={20} />
              <span>AI Generation</span>
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'upload' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-white/20 rounded-xl
                           hover:border-purple-400/50 transition-colors flex flex-col items-center
                           justify-center space-y-4"
                >
                  <ImageIcon size={48} className="text-white/50" />
                  <p className="text-white/70">Click or drag to upload your image</p>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-blue-200/50 focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm
                             min-h-[120px] transition-all duration-300 hover:bg-white/10"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateImage}
                  disabled={loading || !prompt.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600
                           rounded-xl text-white font-semibold text-lg shadow-lg
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview and Mint Dialog */}
          <AnimatePresence>
            {image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 space-y-6"
              >
                <div className="relative group rounded-2xl overflow-hidden">
                  <motion.img
                    src={image}
                    alt="Preview"
                    className="w-full rounded-xl shadow-2xl"
                    layoutId="preview"
                  />
                </div>

                {showMintDialog && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="NFT Name"
                      value={mintDetails.name}
                      onChange={(e) => setMintDetails(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl
                               text-white focus:ring-2 focus:ring-purple-500/50"
                    />
                    <textarea
                      placeholder="NFT Description"
                      value={mintDetails.description}
                      onChange={(e) => setMintDetails(prev => ({...prev, description: e.target.value}))}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl
                               text-white min-h-[100px] focus:ring-2 focus:ring-purple-500/50"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMint}
                      disabled={loading || !mintDetails.name}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500
                               rounded-xl text-white font-semibold hover:from-green-600
                               hover:to-emerald-600 disabled:opacity-50 
                               disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {loading ? 'Minting...' : 'Mint NFT'}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}