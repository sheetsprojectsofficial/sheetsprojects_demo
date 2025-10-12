import { useBrand } from '../context/BrandContext';

export const useTheme = () => {
  const { brandColors, loading } = useBrand();

  // Generate theme-aware styles
  const getThemeStyles = () => ({
    primary: {
      backgroundColor: brandColors.primary,
      color: brandColors.secondary
    },
    secondary: {
      backgroundColor: brandColors.secondary,
      color: brandColors.primary
    },
    primaryBorder: {
      borderColor: brandColors.primary
    },
    secondaryBorder: {
      borderColor: brandColors.secondary
    },
    primaryText: {
      color: brandColors.primary
    },
    secondaryText: {
      color: brandColors.secondary
    },
    gradient: {
      background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`
    },
    shadow: {
      boxShadow: `0 10px 25px rgba(${brandColors.primaryRgb}, 0.15)`
    }
  });

  // Generate CSS custom properties object
  const getCSSVariables = () => ({
    '--brand-primary': brandColors.primary,
    '--brand-secondary': brandColors.secondary,
    '--brand-primary-rgb': brandColors.primaryRgb,
    '--brand-secondary-rgb': brandColors.secondaryRgb
  });

  // Get theme-aware className combinations
  const getThemeClasses = () => ({
    primaryButton: 'btn-brand-primary px-6 py-3 rounded-lg font-semibold hover-lift-brand',
    secondaryButton: 'btn-brand-outline px-6 py-3 rounded-lg font-semibold hover-lift-brand',
    primaryBackground: 'bg-brand-primary',
    secondaryBackground: 'bg-brand-secondary',
    primaryText: 'text-brand-primary',
    secondaryText: 'text-brand-secondary',
    primaryBorder: 'border-brand-primary',
    secondaryBorder: 'border-brand-secondary',
    gradientBackground: 'bg-gradient-brand',
    brandShadow: 'shadow-brand'
  });

  return {
    brandColors,
    loading,
    getThemeStyles,
    getCSSVariables,
    getThemeClasses
  };
};