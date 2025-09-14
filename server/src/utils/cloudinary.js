import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility function to delete a file from Cloudinary
export const deleteCloudinaryFile = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    
    console.log('Cloudinary deletion result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Utility function to extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{public_id}.{format}
  const match = url.match(/\/upload\/v\d+\/(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
};

export default cloudinary;
