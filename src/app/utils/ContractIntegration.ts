import { ethers, Contract } from 'ethers';
import ABI from '../abi/abi.json';

// Types
interface ContractInitialization {
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
  address: string;
  contract: ethers.Contract;
}

interface Collection {
  name: string;
  symbol: string;
  mintPrice: string;
  createdAt: Date;
  isActive: boolean;
}

interface NFTMetadata {
  name: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  collectionName: string;
}

interface NFT extends NFTMetadata {
  tokenId: number;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

if (!CONTRACT_ADDRESS) {
  throw new Error("Contract address not configured");
}

export async function initializeContract(): Promise<ContractInitialization> {
  try {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Log network information
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name, `(chainId: ${network.chainId})`);
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Signer address:', address);
      
      // Verify contract exists
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        console.error('No code found at address:', CONTRACT_ADDRESS);
        throw new Error(`No contract deployed at address ${CONTRACT_ADDRESS}`);
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      return { provider, signer, address, contract };
    } else {
      throw new Error("MetaMask not found");
    }
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
}
export async function createCollection(
  contract: Contract,
  name: string,
  symbol: string,
  mintPrice: string
): Promise<ethers.ContractTransaction> {
  try {
    console.log("Creating collection with params:", { name, symbol, mintPrice });
    
    const priceInWei = ethers.utils.parseEther(mintPrice);
    console.log("Price in Wei:", priceInWei.toString());

    // Check if collection exists first
    try {
      const exists = await contract.collectionExists(name);
      if (exists) {
        console.log("Collection already exists");
        return null as any; // Return null to indicate no transaction needed
      }
    } catch (error) {
      console.log("Error checking existence, attempting creation anyway");
    }
    
    // Set a manual gas limit instead of estimation
    const tx = await contract.createCollection(
      name,
      symbol,
      priceInWei,
      { 
        gasLimit: 300000 // Set a reasonable fixed gas limit
      }
    );
    
    console.log("Transaction sent:", tx.hash);
    return tx;
  } catch (error: any) {
    console.error('Error creating collection:', error);
    
    // Handle specific error cases
    if (error?.data?.message?.includes("Collection already exists")) {
      console.log("Collection already exists (caught during transaction)");
      return null as any; // Return null to indicate no transaction needed
    }
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Collection might already exist or transaction parameters are invalid');
    }
    
    throw error;
  }
}
export async function mintNFT(
  contract: Contract,
  collectionName: string,
  nftName: string,
  description: string,
  imageUrl: string
): Promise<ethers.ContractTransaction> {
  try {
    if (!contract) {
      throw new Error("Contract instance is null");
    }
    if (!collectionName) {
      throw new Error("collectionName is null or undefined");
    }

    // Add debugging for contract address and collection
    console.log("Contract address:", contract.address);
    console.log("Collection name:", collectionName);
    
    // Check if collection exists
    try {
      const exists = await contract.collectionExists(collectionName);
      if (!exists) {
        throw new Error(`Collection "${collectionName}" does not exist`);
      }
    } catch (error) {
      console.error("Error checking collection:", error);
      throw new Error(`Collection "${collectionName}" does not exist or cannot be accessed`);
    }

    console.log("Getting mint price...");
    const mintPrice = await contract.getMintPrice(collectionName);
    console.log("Mint price retrieved:", mintPrice.toString());
    
    const tx = await contract.mintNFT(
      collectionName,
      nftName,
      description,
      imageUrl,
      { 
        value: mintPrice,
        gasLimit: 500000 
      }
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    return tx;
  } catch (error) {
    console.error("Error minting NFT:", error);
    if ((error as any).code === 'CALL_EXCEPTION') {
      throw new Error(`Contract call failed: ${(error as any).method}. Please verify the collection exists and you have the right permissions.`);
    }
    throw error;
  }
}

export async function getCollection(contract: Contract, name: string): Promise<Collection> {
  try {
    const collection = await contract.getCollection(name);
    return {
      name: collection[0],
      symbol: collection[1],
      mintPrice: ethers.utils.formatEther(collection[2]),
      createdAt: new Date(collection[3].toNumber() * 1000),
      isActive: collection[4]
    };
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
}

export async function getNFTMetadata(contract: Contract, tokenId: number): Promise<NFTMetadata> {
  try {
    const metadata = await contract.getNFTMetadata(tokenId);
    return {
      name: metadata[0],
      description: metadata[1],
      imageUrl: metadata[2],
      createdAt: new Date(metadata[3].toNumber() * 1000),
      collectionName: metadata[4]
    };
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    throw error;
  }
}

export async function getUserNFTs(contract: Contract, address: string): Promise<NFT[]> {
  try {
    const tokenIds: number[] = await contract.getNFTsByOwner(address);
    const nfts = await Promise.all(
      tokenIds.map(async (tokenId: number) => {
        const metadata = await getNFTMetadata(contract, tokenId);
        return {
          tokenId,
          ...metadata
        };
      })
    );
    return nfts;
  } catch (error) {
    console.error('Error getting user NFTs:', error);
    throw error;
  }
}

export async function canAffordMint(contract: Contract, collectionName: string): Promise<boolean> {
  try {
    return await contract.canAffordMint(collectionName);
  } catch (error) {
    console.error('Error checking mint affordability:', error);
    throw error;
  }
}

export async function getMintPrice(contract: Contract, collectionName: string): Promise<string> {
  try {
    const mintPrice = await contract.getMintPrice(collectionName);
    console.log("Mint price retrieved:", mintPrice.toString());
    return ethers.utils.formatEther(mintPrice);
  } catch (error) {
    console.error("Failed to fetch mint price:", error);
    throw error;
  }
  
}

export async function updateMintPrice(
  contract: Contract,
  collectionName: string,
  newPrice: string
): Promise<ethers.ContractTransaction> {
  try {
    const priceInWei = ethers.utils.parseEther(newPrice);
    const tx = await contract.updateMintPrice(collectionName, priceInWei, { gasLimit: 300000 });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error updating mint price:', error);
    throw error;
  }
}

export async function toggleCollection(
  contract: Contract,
  collectionName: string
): Promise<ethers.ContractTransaction> {
  try {
    const tx = await contract.toggleCollection(collectionName, { gasLimit: 300000 });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error toggling collection:', error);
    throw error;
  }
}

export async function withdraw(contract: Contract): Promise<ethers.ContractTransaction> {
  try {
    const tx = await contract.withdraw({ gasLimit: 300000 });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export type {
  ContractInitialization,
  Collection,
  NFTMetadata,
  NFT
};