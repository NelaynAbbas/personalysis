
import { useEffect } from 'react';

export const CustomFavicon = () => {
  useEffect(() => {
    // Remove any existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Add new favicons
    const icons = [
      { href: '/favicon.svg', type: 'image/svg+xml' },
      { href: '/favicon.ico', type: 'image/x-icon' }
    ];

    icons.forEach(icon => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = icon.href;
      link.type = icon.type;
      document.head.appendChild(link);
    });

    return () => {
      const favicons = document.querySelectorAll('link[rel*="icon"]');
      favicons.forEach(favicon => favicon.remove());
    };
  }, []);

  return null;
};

export default CustomFavicon;
