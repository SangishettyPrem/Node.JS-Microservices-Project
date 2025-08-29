const Media = require('../models/media.model');
const logger = require('../utils/logger')
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const handleUploadMedia = async (event) => {
    try {
        const { postId, files } = event;
        const uploadResults = [];
        for (const file of files) {
            const fileBuffer = Buffer.from(file.buffer, "base64");
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `posts/${postId}`,
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(fileBuffer);
            });
            uploadResults.push({
                publicId: result.public_id,
                url: result.secure_url,
            });
        }
        const media = await Media.create({
            postId,
            media: uploadResults
        })
        return media;
    } catch (error) {
        logger.error("Error while Uploading Media: ", error);
        throw error;
    }
}


module.exports = { handleUploadMedia }