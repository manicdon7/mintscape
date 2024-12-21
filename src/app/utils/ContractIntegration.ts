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

export async function initializeContract(): Promise<ContractInitialization> {
  try {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
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
    const priceInWei = ethers.utils.parseEther(mintPrice);
    const tx = await contract.createCollection(name, symbol, priceInWei, { gasLimit: 500000 });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error creating collection:', error);
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
    const mintPrice = await contract.getMintPrice(collectionName);
    
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
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error minting NFT:', error);
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
    const price = await contract.getMintPrice(collectionName);
    return ethers.utils.formatEther(price);
  } catch (error) {
    console.error('Error getting mint price:', error);
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