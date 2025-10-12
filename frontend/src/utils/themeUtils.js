// Utility functions for theme management

// Inject critical theme styles directly into the document head
export const injectThemeStyles = (primaryColor, secondaryColor, primaryRgb, secondaryRgb) => {
  // Remove existing dynamic styles
  const existingStyle = document.getElementById('dynamic-theme-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style element with highest priority
  const styleElement = document.createElement('style');
  styleElement.id = 'dynamic-theme-styles';
  styleElement.textContent = `
    /* Dynamic Theme Variables - Highest Priority */
    :root {
      --brand-primary: ${primaryColor} !important;
      --brand-secondary: ${secondaryColor} !important;
      --brand-primary-rgb: ${primaryRgb} !important;
      --brand-secondary-rgb: ${secondaryRgb} !important;
    }
    
    /* Force override all brand utilities */
    .bg-brand-primary, 
    .btn-brand-primary {
      background-color: ${primaryColor} !important;
    }
    
    .text-brand-primary {
      color: ${primaryColor} !important;
    }
    
    .border-brand-primary {
      border-color: ${primaryColor} !important;
    }
    
    .bg-brand-secondary,
    .btn-brand-primary:hover {
      background-color: ${secondaryColor} !important;
    }
    
    .text-brand-secondary,
    .btn-brand-primary:hover {
      color: ${primaryColor} !important;
    }
    
    .border-brand-secondary {
      border-color: ${secondaryColor} !important;
    }
    
    /* Override scrollbar colors */
    ::-webkit-scrollbar-thumb {
      background: ${primaryColor} !important;
    }
    
    /* Override focus ring colors */
    .focus-ring:focus {
      box-shadow: 0 0 0 3px rgba(${primaryRgb}, 0.3) !important;
    }
    
    /* Override any hardcoded blue colors in components */
    .bg-blue-600, .from-blue-600 {
      background-color: ${primaryColor} !important;
    }
    
    .bg-blue-700, .to-blue-700 {
      background-color: ${primaryColor} !important;
    }
    
    .text-blue-800 {
      color: ${primaryColor} !important;
    }
    
    .bg-blue-100 {
      background-color: rgba(${primaryRgb}, 0.1) !important;
    }
    
    .bg-blue-200 {
      background-color: rgba(${primaryRgb}, 0.2) !important;
    }
  `;

  // Insert at the end of head to ensure it has highest priority
  document.head.appendChild(styleElement);
};

// Force update all elements using brand colors
export const forceThemeUpdate = () => {
  // Trigger a reflow and repaint
  document.body.style.display = 'none';
  document.body.offsetHeight; // trigger reflow
  document.body.style.display = '';
  
};