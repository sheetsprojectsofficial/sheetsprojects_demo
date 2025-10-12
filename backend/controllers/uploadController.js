import cloudinary from '../config/cloudinary.js';

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    console.log('Upload request received:', req.body);
    console.log('Files:', req.files);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'sheetsprojects',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto'
    });

    console.log('Cloudinary upload result:', result);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image: ' + error.message 
    });
  }
};

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Public ID is required' 
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete image' 
    });
  }
}; 