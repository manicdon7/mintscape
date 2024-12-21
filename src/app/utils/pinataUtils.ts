"use server"
import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export async function uploadToPinata(base64Image: string, metadata: any) {
  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, 'image.png');

    // Upload image to Pinata
    const imageResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
        },
      }
    );

    const imageHash = imageResponse.data.IpfsHash;

    // Create metadata JSON
    const metadataJSON = {
      name: metadata.name,
      description: metadata.description,
      image: `ipfs://${imageHash}`,
      attributes: [
        {
          trait_type: "Generated From",
          value: "Stability AI"
        },
        {
          trait_type: "Prompt",
          value: metadata.prompt
        }
      ]
    };

    // Upload metadata to Pinata
    const metadataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadataJSON,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
        },
      }
    );

    return {
      imageHash,
      metadataHash: metadataResponse.data.IpfsHash,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
}