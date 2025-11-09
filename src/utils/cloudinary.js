import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

//Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: 'E_Rental',
        })
        console.log("File has been uploaded to cloudinary ",uploadResult.url);
        
        fs.unlinkSync(localFilePath);
        console.log("Local file deleted:", localFilePath);
        

        return uploadResult;
    }
    catch(error) {
        console.error(error);
        // DO NOT delete the file immediately, let the caller decide
        return { success: false, error: error.message, localFilePath };
    }
}

// Function to retry upload manually
const retryUpload = async (localFilePath, attempts = 3) => {
    let attempt = 0;
    while (attempt < attempts) {
        console.log(`Retry attempt ${attempt + 1} for file: ${localFilePath}`);
        const result = await uploadToCloudinary(localFilePath);
        if (result && result.success !== false) {
            return result; // Success
        }
        attempt++;
    }

    // If all retries fail, delete the file
    console.log(`All ${attempts} attempts failed. Deleting file.`);
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
    return null;
};


export { uploadToCloudinary , retryUpload};





// (async function() {

//     // Configuration
//     cloudinary.config({ 
//         cloud_name: 'datikkjui', 
//         api_key: '597789234574937', 
//         api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
//     });
    
//     // Upload an image
//      const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();