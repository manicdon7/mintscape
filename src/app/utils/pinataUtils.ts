"use server";
import axios from "axios";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export async function uploadToPinata(base64Image: string, metadata: any, fileName: string) {
  try {
    // Extract the file type from the base64 string or fallback to "image/png"
    const fileTypeMatch = base64Image.match(/data:(image\/[a-z]+);base64,/);
    const fileType = fileTypeMatch ? fileTypeMatch[1] : "image/png";

    const buffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Use the provided file name or generate one dynamically
    const finalFileName = fileName || metadata.name?.replace(/\s+/g, "_").toLowerCase() + ".png";

    const formData = new FormData();
    const blob = new Blob([buffer], { type: fileType });
    formData.append("file", blob, finalFileName);

    const imageResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
        },
      }
    );

    const imageHash = imageResponse.data.IpfsHash;

    const metadataJSON = {
      name: metadata.name,
      description: metadata.description,
      image: `ipfs://${imageHash}`,
      attributes: [
        {
          trait_type: "Generated From",
          value: metadata.mode === "ai" ? "Stability AI" : "Upload",
        },
        { trait_type: "Prompt", value: metadata.prompt || "N/A" },
      ],
    };

    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadataJSON,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
        },
      }
    );

    return {
      imageHash,
      metadataHash: metadataResponse.data.IpfsHash,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`,
    };
  } catch (error) {
    throw new Error(`Error uploading to Pinata: ${error}`);
  }
}
