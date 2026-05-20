const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');
cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
cloudinary: cloudinary,
params: {
folder: 'tiemgram_profiles',
allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
transformation: [{ width: 500, height: 500, crop: 'limit' }],
},
});
const postStorage = new CloudinaryStorage({
cloudinary: cloudinary,
params: async (req, file) => {
return {
folder: 'tiemgram_posts',
resource_type: 'auto',
allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi'],
};
},
});
const upload = multer({ 
storage: storage,
limits: { fileSize: 20 * 1024 * 1024 }
});
const uploadPostMedia = multer({
storage: postStorage,
limits: { fileSize: 100 * 1024 * 1024 }
});
module.exports = { cloudinary, upload, uploadPostMedia };
