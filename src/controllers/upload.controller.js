import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME, PUBLIC_BASE_URL } from "../utils/utho.js";

const FOLDER = "akalpit";

// Single image upload
export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(file.originalname) || "";
    const key = `${FOLDER}/${uuidv4()}${ext}`;
    const fileBuffer = fs.readFileSync(file.path);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      })
    );

    fs.unlinkSync(file.path);

    res.json({ url: `${PUBLIC_BASE_URL}/${key}`, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Multiple image upload
export const uploadImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname) || "";
        const key = `${FOLDER}/${uuidv4()}${ext}`;
        const fileBuffer = fs.readFileSync(file.path);

        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: file.mimetype,
            ACL: "public-read",
          })
        );

        fs.unlinkSync(file.path);

        return { url: `${PUBLIC_BASE_URL}/${key}`, key };
      })
    );

    res.json({ files: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Delete an image by its storage key
export const deleteImage = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    res.json({ deleted: key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
};

// Replace an existing image: uploads the new one, then deletes the old key
export const replaceImage = async (req, res) => {
  try {
    const file = req.file;
    const { oldKey } = req.body;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(file.originalname) || "";
    const key = `${FOLDER}/${uuidv4()}${ext}`;
    const fileBuffer = fs.readFileSync(file.path);

    // 1. Upload new image first
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      })
    );

    fs.unlinkSync(file.path);

    const newUrl = `${PUBLIC_BASE_URL}/${key}`;

    // 2. Try deleting the old one — don't fail the request if this errors
    if (oldKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: oldKey,
          })
        );
      } catch (delErr) {
        console.error("Failed to delete old image:", oldKey, delErr);
        // swallow — new image is already live, old one can be cleaned up later
      }
    }

    res.json({ url: newUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Replace failed" });
  }
};