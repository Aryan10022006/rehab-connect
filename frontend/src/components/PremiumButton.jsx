import React from 'react';

const PremiumButton = ({ onClick, variant = 'primary', size = 'medium', className = '' }) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center';
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50',
    outline: 'bg-transparent text-emerald-600 border border-emerald-600 hover:bg-emerald-50',
    compact: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
      Upgrade to Premium
    </button>
  );
};

// Premium banner component for search results
export const PremiumBanner = ({ onUpgrade, hiddenCount = 0 }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-emerald-500 rounded-full p-2 mr-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-800">
              {hiddenCount > 0 ? `${hiddenCount} More Results Available` : 'Get Unlimited Access'}
            </h3>
            <p className="text-emerald-700 mt-1">
              {hiddenCount > 0 
                ? `Upgrade to premium to see all ${hiddenCount} additional clinic results`
                : 'Unlock unlimited search results, advanced filters, and premium features'
              }
            </p>
          </div>
        </div>
        <PremiumButton 
          onClick={onUpgrade} 
          variant="primary" 
          size="medium"
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

// Premium feature badge
export const PremiumBadge = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 ${className}`}>
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
      PREMIUM
    </span>
  );
};

export default PremiumButton;
