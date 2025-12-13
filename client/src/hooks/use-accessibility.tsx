import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface AccessibilityContextType {
  /**
   * Whether the user prefers reduced motion animations
   */
  prefersReducedMotion: boolean;
  
  /**
   * Whether the user is navigating with keyboard
   */
  isKeyboardUser: boolean;
  
  /**
   * Set the currently focused element and manage focus ring visibility
   */
  setFocusedElement: (element: HTMLElement | null) => void;
  
  /**
   * Skip to the main content of the page
   */
  skipToContent: () => void;
  
  /**
   * Skip to a specific element by ID
   */
  skipToElement: (id: string) => void;
  
  /**
   * Whether high contrast mode is enabled
   */
  highContrastMode: boolean;
  
  /**
   * Toggle high contrast mode
   */
  toggleHighContrastMode: () => void;
  
  /**
   * Current font size adjustment
   */
  fontSizeAdjustment: number;
  
  /**
   * Increase the font size
   */
  increaseFontSize: () => void;
  
  /**
   * Decrease the font size
   */
  decreaseFontSize: () => void;
  
  /**
   * Reset the font size to the default
   */
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefersReducedMotion: false,
  isKeyboardUser: false,
  setFocusedElement: () => {},
  skipToContent: () => {},
  skipToElement: () => {},
  highContrastMode: false,
  toggleHighContrastMode: () => {},
  fontSizeAdjustment: 0,
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  resetFontSize: () => {},
});

export const useAccessibilityPreferences = () => useContext(AccessibilityContext);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for accessibility features including keyboard navigation, focus management,
 * reduced motion preferences, and font size adjustments
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState<boolean>(false);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [fontSizeAdjustment, setFontSizeAdjustment] = useState<number>(0);
  
  // Store the previous active element to restore focus if needed
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Check for reduced motion preferences using CSS media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Add listener for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Detect keyboard navigation 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on Tab key
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        
        // Store the current active element
        if (document.activeElement instanceof HTMLElement) {
          previousActiveElement.current = document.activeElement;
        }
      }
    };

    // Reset to mouse user on mouse movement
    const handleMouseMove = () => {
      setIsKeyboardUser(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  }, [highContrastMode]);

  // Apply font size adjustment
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (fontSizeAdjustment !== 0) {
      // Base size is 16px, we'll adjust by 2px increments
      const newSize = 16 + (fontSizeAdjustment * 2);
      htmlElement.style.fontSize = `${newSize}px`;
    } else {
      htmlElement.style.fontSize = '';
    }
  }, [fontSizeAdjustment]);

  // Skip to main content functionality
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  }, []);

  // Skip to specific element by ID
  const skipToElement = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView();
    }
  }, []);

  // Toggle high contrast mode
  const toggleHighContrastMode = useCallback(() => {
    setHighContrastMode(prev => !prev);
  }, []);

  // Font size adjustment functions
  const increaseFontSize = useCallback(() => {
    setFontSizeAdjustment(prev => Math.min(prev + 1, 4)); // Max limit of +8px
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeAdjustment(prev => Math.max(prev - 1, -2)); // Min limit of -4px
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSizeAdjustment(0);
  }, []);

  return (
    <AccessibilityContext.Provider 
      value={{
        prefersReducedMotion,
        isKeyboardUser,
        setFocusedElement,
        skipToContent,
        skipToElement,
        highContrastMode,
        toggleHighContrastMode,
        fontSizeAdjustment,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * A component that provides a skip link for keyboard users to jump directly to the main content
 */
export const SkipToContentLink: React.FC = () => {
  const { skipToContent } = useAccessibilityPreferences();
  
  return (
    <a 
      href="#main-content"
      onClick={(e) => {
        e.preventDefault();
        skipToContent();
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>
  );
};

export default AccessibilityProvider;