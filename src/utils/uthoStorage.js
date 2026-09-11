const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { s3, BUCKET_NAME } = require("../config/storage");

const PUBLIC_BASE_URL = process.env.UTHO_PUBLIC_BASE_URL || `https://innoida.utho.io/${BUCKET_NAME}`;

/**
 * Uploads a single image buffer to Utho object storage.
 * @param {Buffer} fileBuffer - raw file buffer (e.g. from multer memoryStorage)
 * @param {string} originalName - original filename, used only for extension
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} folder - logical folder/prefix inside the bucket, e.g. 'questions', 'avatars'
 * @returns {Promise<{ key: string, url: string }>}
 */
async function uploadImage(fileBuffer, originalName, mimeType, folder = "misc") {
  const ext = path.extname(originalName) || "";
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read", // remove if your bucket handles public access differently
    })
  );

  return {
    key,
    url: `${PUBLIC_BASE_URL}/${key}`,
  };
}

/**
 * Uploads multiple images in parallel.
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} files - multer file objects
 * @param {string} folder
 * @returns {Promise<Array<{ key: string, url: string }>>}
 */
async function uploadImages(files, folder = "misc") {
  return Promise.all(
    files.map((file) => uploadImage(file.buffer, file.originalname, file.mimetype, folder))
  );
}

/**
 * Deletes an object from the bucket by its key.
 * @param {string} key
 */
async function deleteImage(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

module.exports = { uploadImage, uploadImages, deleteImage };