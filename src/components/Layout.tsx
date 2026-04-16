import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-brand-200">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to content
      </a>
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
};
