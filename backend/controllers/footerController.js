import Footer from '../models/Footer.js';
import Navigation from '../models/Navigation.js';

// Get footer data
export const getFooter = async (req, res) => {
  try {
    let footer = await Footer.findOne();
    
    if (!footer) {
      // Create default footer if none exists
      footer = new Footer();
      await footer.save();
    }

    res.json({
      success: true,
      footer
    });
  } catch (error) {
    console.error('Error fetching footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footer data'
    });
  }
};

// Update footer data
export const updateFooter = async (req, res) => {
  try {
    const {
      companyInfo,
      quickLinks,
      terms,
      legal,
      socialMedia,
      copyright
    } = req.body;

    let footer = await Footer.findOne();
    
    if (!footer) {
      footer = new Footer();
    }

    // Update company info
    if (companyInfo) {
      footer.companyInfo = { ...footer.companyInfo, ...companyInfo };
    }

    // Update quick links
    if (quickLinks) {
      footer.quickLinks = { ...footer.quickLinks, ...quickLinks };
    }

    // Update terms
    if (terms) {
      footer.terms = { ...footer.terms, ...terms };
    }

    // Update legal (preserve required links)
    if (legal) {
      footer.legal = { ...footer.legal, ...legal };
      
      // Ensure required legal links are always present
      const requiredLinks = [
        { text: "Privacy Policy", url: "/privacy", enabled: true, required: true },
        { text: "Terms & Conditions", url: "/terms", enabled: true, required: true }
      ];
      
      // Merge with existing links, ensuring required ones are always there
      const existingLinks = footer.legal.links || [];
      const requiredLinkTexts = requiredLinks.map(link => link.text);
      
      // Keep existing non-required links
      const nonRequiredLinks = existingLinks.filter(link => !requiredLinkTexts.includes(link.text));
      
      // Combine required and non-required links
      footer.legal.links = [...requiredLinks, ...nonRequiredLinks];
    }

    // Update social media
    if (socialMedia) {
      if (socialMedia.links) {
        Object.keys(socialMedia.links).forEach(platform => {
          if (footer.socialMedia.links[platform]) {
            footer.socialMedia.links[platform] = {
              ...footer.socialMedia.links[platform],
              ...socialMedia.links[platform]
            };
          }
        });
      }
      if (socialMedia.enabled !== undefined) {
        footer.socialMedia.enabled = socialMedia.enabled;
      }
      if (socialMedia.title) {
        footer.socialMedia.title = socialMedia.title;
      }
    }

    // Update copyright
    if (copyright) {
      footer.copyright = { ...footer.copyright, ...copyright };
    }

    footer.updatedAt = new Date();
    await footer.save();

    res.json({
      success: true,
      message: 'Footer updated successfully',
      footer
    });
  } catch (error) {
    console.error('Error updating footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating footer data'
    });
  }
};

// Add link to a section
export const addLink = async (req, res) => {
  try {
    const { section, link } = req.body;
    
    if (!section || !link) {
      return res.status(400).json({
        success: false,
        message: 'Section and link are required'
      });
    }

    let footer = await Footer.findOne();
    
    if (!footer) {
      footer = new Footer();
    }

    if (footer[section] && footer[section].links) {
      footer[section].links.push(link);
      footer.updatedAt = new Date();
      await footer.save();

      res.json({
        success: true,
        message: 'Link added successfully',
        footer
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid section'
      });
    }
  } catch (error) {
    console.error('Error adding link:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding link'
    });
  }
};

// Remove link from a section
export const removeLink = async (req, res) => {
  try {
    const { section, linkIndex } = req.body;
    
    if (!section || linkIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Section and link index are required'
      });
    }

    let footer = await Footer.findOne();
    
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found'
      });
    }

    if (footer[section] && footer[section].links) {
      // Check if trying to remove a required legal link
      if (section === 'legal' && footer[section].links[linkIndex] && footer[section].links[linkIndex].required) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove required legal links (Privacy Policy and Terms & Conditions)'
        });
      }
      
      footer[section].links.splice(linkIndex, 1);
      footer.updatedAt = new Date();
      await footer.save();

      res.json({
        success: true,
        message: 'Link removed successfully',
        footer
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid section'
      });
    }
  } catch (error) {
    console.error('Error removing link:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing link'
    });
  }
}; 

// Get navigation data for dynamic quick links
export const getNavigationForQuickLinks = async (req, res) => {
  try {
    const navigation = await Navigation.findOne();
    
    if (!navigation) {
      return res.json({
        success: true,
        navigationItems: []
      });
    }

    // Filter only visible navigation items
    const visibleItems = navigation.items
      .filter(item => item.visible)
      .map(item => ({
        text: item.name,
        url: item.href,
        enabled: true
      }));

    res.json({
      success: true,
      navigationItems: visibleItems
    });
  } catch (error) {
    console.error('Error fetching navigation for quick links:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching navigation data'
    });
  }
}; 