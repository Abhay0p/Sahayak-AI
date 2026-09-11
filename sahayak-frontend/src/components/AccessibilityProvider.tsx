'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type TextSize = 'normal' | 'large' | 'extra-large';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Load from local storage
    const savedTextSize = localStorage.getItem('accessibility_textSize') as TextSize;
    const savedHighContrast = localStorage.getItem('accessibility_highContrast') === 'true';
    
    if (savedTextSize) setTextSize(savedTextSize);
    if (savedHighContrast) setHighContrast(savedHighContrast);
  }, []);

  useEffect(() => {
    // Apply classes to body
    document.body.classList.remove('large-text', 'extra-large-text');
    if (textSize === 'large') document.body.classList.add('large-text');
    if (textSize === 'extra-large') document.body.classList.add('extra-large-text');

    if (highContrast) {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Save to local storage
    localStorage.setItem('accessibility_textSize', textSize);
    localStorage.setItem('accessibility_highContrast', highContrast.toString());
  }, [textSize, highContrast]);

  return (
    <AccessibilityContext.Provider value={{ textSize, setTextSize, highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
