import React, { createContext, useContext, useState, useEffect } from 'react';
import { injectThemeStyles, forceThemeUpdate } from '../utils/themeUtils';

const BrandContext = createContext();

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

// Default theme colors
const DEFAULT_COLORS = {
  primary: '#3b82f6',
  secondary: '#ffffff',
  primaryRgb: '59, 130, 246',
  secondaryRgb: '255, 255, 255'
};

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
};

// Convert color name to hex (basic implementation)
const colorNameToHex = (colorName) => {
  if (!colorName) return '#000000';
  
  // If it's already a hex color, return it
  if (colorName.startsWith('#')) {
    return colorName;
  }
  
  // Handle common color names
  const colors = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'orange': '#ffa500',
    'purple': '#800080',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'gray': '#808080',
    'grey': '#808080'
  };
  
  const lowerColor = colorName.toLowerCase().trim();
  return colors[lowerColor] || (colorName.startsWith('#') ? colorName : '#' + colorName.replace('#', ''));
};

// Apply theme colors to CSS custom properties
const applyThemeColors = (primaryColor, secondaryColor) => {
  const root = document.documentElement;
  
  // Convert color names to hex if needed
  let primary = colorNameToHex(primaryColor);
  let secondary = colorNameToHex(secondaryColor);
  

  // Convert to RGB
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);
  
  if (primaryRgb && secondaryRgb) {
    // Method 1: Set CSS custom properties
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    root.style.setProperty('--brand-secondary', secondary);
    root.style.setProperty('--brand-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    
    
    // Method 2: Inject theme styles directly into head for better reliability
    injectThemeStyles(
      primary, 
      secondary, 
      `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`
    );
    
    // Method 3: Force a visual update
    setTimeout(() => {
      forceThemeUpdate();
    }, 50);
    
    // Verify the properties were set
    setTimeout(() => {
      const appliedPrimary = getComputedStyle(root).getPropertyValue('--brand-primary').trim();
      const appliedSecondary = getComputedStyle(root).getPropertyValue('--brand-secondary').trim();
    }, 200);
  }
};

export const BrandProvider = ({ children }) => {
  const [brandName, setBrandName] = useState('SHEETSPROJECTS.COM');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColors, setBrandColors] = useState(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);

  // Fetch brand data from Google Sheets via settings
  const fetchBrandData = async () => {
    try {
      setLoading(true);
      
      // Fetch from both hero and settings
      const [heroResponse, settingsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/hero`),
        fetch(`${import.meta.env.VITE_API_URL}/settings`)
      ]);
      
      const heroData = await heroResponse.json();
      const settingsData = await settingsResponse.json();

      // Update colors and brand details from settings (Brand details section)
      if (settingsData.success && settingsData.data) {
        const settings = settingsData.data;
        let primaryColor = DEFAULT_COLORS.primary;
        let secondaryColor = DEFAULT_COLORS.secondary;

        // Get Brand name from Brand details section (NOT Hero Section)
        if (settings['Brand name']?.value) {
          setBrandName(settings['Brand name'].value);
        } else if (settings['Brand Name']?.value) {
          setBrandName(settings['Brand Name'].value);
        }

        // Get Logo URL from Brand details section
        if (settings['Logo URL']?.value) {
          setLogoUrl(settings['Logo URL'].value);
        } else if (settings['Logo url']?.value) {
          setLogoUrl(settings['Logo url'].value);
        } else if (settings['logo url']?.value) {
          setLogoUrl(settings['logo url'].value);
        }

        // Look for brand color fields - try different variations
        if (settings['Brand primary colour']?.value) {
          primaryColor = settings['Brand primary colour'].value;
        } else if (settings['Brand primary color']?.value) {
          primaryColor = settings['Brand primary color'].value;
        }

        if (settings['Brand secondary colour']?.value) {
          secondaryColor = settings['Brand secondary colour'].value;
        } else if (settings['Brand secondary color']?.value) {
          secondaryColor = settings['Brand secondary color'].value;
        }
        
        // Convert colors and create RGB values
        const primary = colorNameToHex(primaryColor);
        const secondary = colorNameToHex(secondaryColor);
        
        const primaryRgb = hexToRgb(primary);
        const secondaryRgb = hexToRgb(secondary);
        
        const newColors = {
          primary,
          secondary,
          primaryRgb: primaryRgb ? `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}` : DEFAULT_COLORS.primaryRgb,
          secondaryRgb: secondaryRgb ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}` : DEFAULT_COLORS.secondaryRgb
        };
        
        setBrandColors(newColors);
        
        // Apply colors to CSS custom properties
        applyThemeColors(primary, secondary);
      } else {

        applyThemeColors(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary);
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
      // Apply default colors on error
      applyThemeColors(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary);
    } finally {
      setLoading(false);
    }
  };

  // Update brand name
  const updateBrandName = (newBrandName) => {
    setBrandName(newBrandName);
  };

  // Update brand colors
  const updateBrandColors = (primaryColor, secondaryColor) => {
    const primary = colorNameToHex(primaryColor);
    const secondary = colorNameToHex(secondaryColor);
    
    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    
    const newColors = {
      primary,
      secondary,
      primaryRgb: primaryRgb ? `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}` : DEFAULT_COLORS.primaryRgb,
      secondaryRgb: secondaryRgb ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}` : DEFAULT_COLORS.secondaryRgb
    };
    
    setBrandColors(newColors);
    applyThemeColors(primary, secondary);
  };

  // Refresh all brand data
  const refreshBrandData = () => {
    fetchBrandData();
  };

  useEffect(() => {
    // Apply default colors immediately on mount

    applyThemeColors(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary);
    
    // Then fetch data from Google Sheets
    fetchBrandData();
    
    // Also apply colors after a small delay to ensure DOM is ready
    setTimeout(() => {

      applyThemeColors(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary);
    }, 100);
  }, []);

  // Apply theme colors whenever brandColors change
  useEffect(() => {
    if (brandColors.primary && brandColors.secondary) {
      applyThemeColors(brandColors.primary, brandColors.secondary);
      
      // Also apply with a delay to ensure styles take effect
      setTimeout(() => {
        applyThemeColors(brandColors.primary, brandColors.secondary);
      }, 100);
    }
  }, [brandColors]);

  const value = {
    brandName,
    logoUrl,
    brandColors,
    updateBrandName,
    updateBrandColors,
    refreshBrandData,
    loading
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}; 