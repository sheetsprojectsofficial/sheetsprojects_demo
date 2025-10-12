import SubNavbar from '../models/SubNavbar.js';

// Get subnavbar data
export const getSubNavbar = async (req, res) => {
  try {
    let subNavbar = await SubNavbar.findOne();
    
    if (!subNavbar) {
      // Create default subnavbar if none exists
      subNavbar = new SubNavbar();
      await subNavbar.save();
    }

    res.json({
      success: true,
      subNavbar
    });
  } catch (error) {
    console.error('Error fetching subnavbar:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subnavbar data'
    });
  }
};

// Update subnavbar data
export const updateSubNavbar = async (req, res) => {
  try {
    const { bannerText, socialLinks } = req.body;

    let subNavbar = await SubNavbar.findOne();
    
    if (!subNavbar) {
      subNavbar = new SubNavbar();
    }

    if (bannerText !== undefined) {
      subNavbar.bannerText = bannerText;
    }

    if (socialLinks) {
      if (socialLinks.telegram) {
        subNavbar.socialLinks.telegram = {
          ...subNavbar.socialLinks.telegram,
          ...socialLinks.telegram
        };
      }
      if (socialLinks.whatsapp) {
        subNavbar.socialLinks.whatsapp = {
          ...subNavbar.socialLinks.whatsapp,
          ...socialLinks.whatsapp
        };
      }
    }

    subNavbar.updatedAt = new Date();
    await subNavbar.save();

    res.json({
      success: true,
      message: 'Subnavbar updated successfully',
      subNavbar
    });
  } catch (error) {
    console.error('Error updating subnavbar:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subnavbar data'
    });
  }
}; 