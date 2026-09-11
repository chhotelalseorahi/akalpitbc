import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
 

 console.log('Utho creds check:', {
  hasKey: !!process.env.UTHO_ACCESS_KEY,
  hasSecret: !!process.env.UTHO_SECRET_KEY,
 
});
export const s3 = new S3Client({
  endpoint: process.env.UTHO_ENDPOINT || "https://innoida.utho.io",
  region: process.env.UTHO_REGION || "ap-south-in-noida-1",
  credentials: {
    accessKeyId: process.env.UTHO_ACCESS_KEY,
    secretAccessKey: process.env.UTHO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = process.env.UTHO_BUCKET || "bucket-hwmlluqd";
export const PUBLIC_BASE_URL =
  process.env.UTHO_PUBLIC_BASE_URL || `https://innoida.utho.io/${BUCKET_NAME}`;