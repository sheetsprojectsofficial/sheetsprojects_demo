import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Save the current scroll behavior
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;

    // Temporarily disable smooth scrolling to force instant scroll
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    // Force scroll to top immediately using multiple methods
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also use scrollIntoView on the root element as a fallback
    const root = document.getElementById('root');
    if (root) {
      root.scrollIntoView({ block: 'start', behavior: 'auto' });
    }

    // Restore the original scroll behavior after a brief moment
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      document.body.style.scrollBehavior = originalScrollBehavior;
    }, 100);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
