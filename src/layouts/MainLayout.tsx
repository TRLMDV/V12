"use client";

import React, { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useData } from '@/context/DataContext';
import { Settings } from '@/types'; // Import types from types file

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { settings } = useData();

  useEffect(() => {
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Removed display scaling from document.documentElement as it can cause layout issues.
    // If scaling is desired, it should be applied to a specific content wrapper div.
    document.documentElement.style.transform = '';
    document.documentElement.style.transformOrigin = '';
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';

    return () => {
      // Clean up theme class on unmount or setting change
      document.documentElement.classList.remove('dark');
    };
  }, [settings.theme]); // Only depend on theme now

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900">
      <Sidebar />
      <div id="main-content" className="ml-64 p-8 flex-grow overflow-y-auto h-screen">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;