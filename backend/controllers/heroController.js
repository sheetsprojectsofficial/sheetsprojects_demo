import HeroSection from '../models/HeroSection.js';

// Get hero section content
export const getHeroSection = async (req, res) => {
  try {
    let heroSection = await HeroSection.findOne();
    
    if (!heroSection) {
      // Return default data if no hero section exists
      return res.json({
        success: true,
        heroSection: {
          brandName: 'SHEETSPROJECTS.COM',
          heroText: 'SheetsProject Welcomes You',
          heroDescription: 'Your one-stop solution for Google Sheets projects and automation.',
          buttonName: 'Get Started',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop',
          imagePublicId: '',
          googleAnalyticsScript: ''
        }
      });
    }

    res.json({
      success: true,
      heroSection: {
        brandName: heroSection.brandName,
        heroText: heroSection.heroText,
        heroDescription: heroSection.heroDescription,
        buttonName: heroSection.buttonName,
        imageUrl: heroSection.imageUrl,
        imagePublicId: heroSection.imagePublicId,
        googleAnalyticsScript: heroSection.googleAnalyticsScript
      }
    });
  } catch (error) {
    console.error('Get hero section error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update hero section content
export const updateHeroSection = async (req, res) => {
  try {
    const { 
      brandName, 
      heroText, 
      heroDescription, 
      buttonName, 
      imageUrl, 
      imagePublicId,
      googleAnalyticsScript 
    } = req.body;

    let heroSection = await HeroSection.findOne();
    
    if (!heroSection) {
      // Create new hero section if none exists
      heroSection = new HeroSection({
        brandName: brandName || 'SHEETSPROJECTS.COM',
        heroText: heroText || 'SheetsProject Welcomes You',
        heroDescription: heroDescription || 'Your one-stop solution for Google Sheets projects and automation.',
        buttonName: buttonName || 'Get Started',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop',
        imagePublicId: imagePublicId || '',
        googleAnalyticsScript: googleAnalyticsScript || ''
      });
    } else {
      // Update existing hero section
      if (brandName !== undefined) heroSection.brandName = brandName;
      if (heroText !== undefined) heroSection.heroText = heroText;
      if (heroDescription !== undefined) heroSection.heroDescription = heroDescription;
      if (buttonName !== undefined) heroSection.buttonName = buttonName;
      if (imageUrl !== undefined) heroSection.imageUrl = imageUrl;
      if (imagePublicId !== undefined) heroSection.imagePublicId = imagePublicId;
      if (googleAnalyticsScript !== undefined) heroSection.googleAnalyticsScript = googleAnalyticsScript;
    }

    heroSection.updatedAt = new Date();
    await heroSection.save();

    res.json({
      success: true,
      message: 'Hero section updated successfully',
      heroSection: {
        brandName: heroSection.brandName,
        heroText: heroSection.heroText,
        heroDescription: heroSection.heroDescription,
        buttonName: heroSection.buttonName,
        imageUrl: heroSection.imageUrl,
        imagePublicId: heroSection.imagePublicId,
        googleAnalyticsScript: heroSection.googleAnalyticsScript
      }
    });
  } catch (error) {
    console.error('Update hero section error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 