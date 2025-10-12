import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Enhanced smooth scroll to top when pathname changes (navigation)
    const scrollToTop = () => {
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      });
    };

    // Add a small delay to ensure the new page content is rendered
    const timeoutId = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    // Handle page reload - scroll to top smoothly
    const handleBeforeUnload = () => {
      // Store scroll position before reload
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const handleLoad = () => {
      // Check if we're coming from a reload
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        // Clear the stored position
        sessionStorage.removeItem('scrollPosition');
        
        // Smooth scroll to top after a brief delay
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }, 150);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Additional effect to handle hash changes and ensure smooth scrolling
  useEffect(() => {
    const handleHashChange = () => {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }, 100);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};

export default ScrollToTop; 