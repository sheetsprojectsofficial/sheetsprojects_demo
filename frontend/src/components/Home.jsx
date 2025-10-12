import React from 'react';
import Products from './Products';
import ContactUs from './ContactUs';
import SalesPortfolio from './SalesPortfolio';
import HeroSection from './HeroSection';
import { useSettings } from '../context/SettingsContext';

const Home = () => {
  const { settings } = useSettings();

  // Function to check if a menu item is visible
  const isMenuItemVisible = (menuItemName) => {
    if (!settings || Object.keys(settings).length === 0) return false;

    const keys = Object.keys(settings);
    const menuOptionsIndex = keys.findIndex(key => key === 'Menu options');
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');

    if (menuOptionsIndex === -1 || ourWorkSectionIndex === -1) {
      return false;
    }

    const navigationKeys = keys.slice(menuOptionsIndex + 1, ourWorkSectionIndex);

    for (const key of navigationKeys) {
      if (key.toLowerCase() === menuItemName.toLowerCase()) {
        const setting = settings[key];

        if (typeof setting === 'object' && setting.hasOwnProperty('value')) {
          if (typeof setting.value === 'boolean') {
            return setting.value;
          } else if (typeof setting.value === 'string') {
            const value = setting.value.toLowerCase().trim();
            return value === 'show' || value === 'true' || value === '1' || value === 'yes' || value === 'on';
          } else if (setting.value === true || setting.value === 1) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const showProducts = isMenuItemVisible('Products');
  const showBooks = isMenuItemVisible('Books');
  const showBookings = isMenuItemVisible('Bookings');
  const showContactUs = isMenuItemVisible('Contact us');

  return (
    <div className="min-h-screen">
      {/* Hero Section - Always show */}
      <HeroSection />

      {/* Portfolio Section (Our Work) - Always show */}
      <SalesPortfolio />

      {/* Products Section - Only show if Products menu is enabled */}
      {showProducts && (
        <section className="bg-white">
          <Products />
        </section>
      )}

      {/* Contact Us Section - Only show if Contact Us menu is enabled */}
      {showContactUs && (
        <ContactUs />
      )}
    </div>
  );
};

export default Home; 