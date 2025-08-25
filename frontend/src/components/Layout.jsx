import React from 'react';
import Header from './Header';
import Footer from './Footer';

// Main Layout with Header and Footer
export const MainLayout = ({ children, showHeader = true, showFooter = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

// Auth Layout (no header, simple footer)
export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Landing Layout (custom structure)
export const LandingLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Footer />
    </div>
  );
};

export default MainLayout;
