import { useState, useEffect } from 'react';

/**
 * A hook that returns whether the screen is a mobile screen size
 * based on responsive breakpoints
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // Function to update state based on window size
    const checkSize = () => {
      // Mobile breakpoint (up to 640px)
      setIsMobile(window.innerWidth < 640);
      
      // Tablet breakpoint (between 640px and 1024px)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
      
      // Set orientation
      setOrientation(
        window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
      );
    };

    // Check on mount
    checkSize();
    
    // Add event listener
    window.addEventListener('resize', checkSize);
    window.addEventListener('orientationchange', checkSize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('orientationchange', checkSize);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet, 
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}

/**
 * A mixin for conditional rendering based on device size
 */
export function ShowOn({ 
  mobile, 
  tablet, 
  desktop, 
  children 
}: { 
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  children: React.ReactNode;
}) {
  const { isMobile, isTablet, isDesktop } = useMobile();
  
  // If no specific flags are set, show on all devices
  if (mobile === undefined && tablet === undefined && desktop === undefined) {
    return <>{children}</>;
  }
  
  // Show based on the current device size and specified flags
  if (
    (mobile && isMobile) || 
    (tablet && isTablet) || 
    (desktop && isDesktop)
  ) {
    return <>{children}</>;
  }
  
  // Otherwise don't render
  return null;
}

export default useMobile;