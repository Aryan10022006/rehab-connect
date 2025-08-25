import React from 'react';
import { FaSpinner, FaHeart, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-500',
    green: 'text-green-500',
    purple: 'text-purple-600',
    gray: 'text-gray-500'
  };

  return (
    <FaSpinner className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
    </div>
    
    <div className="space-y-3 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

const LoadingState = ({ 
  type = 'default', 
  message = 'Loading...', 
  size = 'md',
  showIcon = true,
  fullHeight = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'clinics':
        return <FaSearch className="text-blue-500 text-2xl mb-2" />;
      case 'favorites':
        return <FaHeart className="text-red-500 text-2xl mb-2" />;
      case 'location':
        return <FaMapMarkerAlt className="text-green-500 text-2xl mb-2" />;
      default:
        return <LoadingSpinner size="lg" />;
    }
  };

  const getLoadingMessage = () => {
    switch (type) {
      case 'clinics':
        return 'Finding nearby clinics...';
      case 'favorites':
        return 'Loading your favorites...';
      case 'location':
        return 'Detecting your location...';
      case 'reviews':
        return 'Loading reviews...';
      default:
        return message;
    }
  };

  if (type === 'skeleton') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${
      fullHeight ? 'min-h-screen' : 'py-12'
    } text-center`}>
      {showIcon && (
        <div className="mb-4">
          {getIcon()}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {getLoadingMessage()}
      </h3>
      
      <p className="text-gray-600 text-sm max-w-md">
        {type === 'clinics' && 'Please wait while we search for the best clinics in your area.'}
        {type === 'favorites' && 'Retrieving your saved clinics and preferences.'}
        {type === 'location' && 'This may take a few moments depending on your device settings.'}
        {type === 'reviews' && 'Loading user reviews and ratings.'}
        {type === 'default' && 'This should only take a moment.'}
      </p>
      
      {type === 'location' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <p className="text-blue-800 text-xs">
            💡 Tip: Enable location services for the best experience
          </p>
        </div>
      )}
    </div>
  );
};

const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'Please try again later.',
  onRetry,
  showRetry = true,
  icon 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon || (
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-red-500 text-2xl">⚠️</span>
      </div>
    )}
    
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-6 max-w-md">{message}</p>
    
    {showRetry && onRetry && (
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Try Again
      </button>
    )}
  </div>
);

const EmptyState = ({ 
  title = 'No results found',
  message = 'Try adjusting your search criteria.',
  actionText,
  onAction,
  icon 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon || (
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-gray-400 text-2xl">📭</span>
      </div>
    )}
    
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-6 max-w-md">{message}</p>
    
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {actionText}
      </button>
    )}
  </div>
);

export { LoadingSpinner, SkeletonCard, LoadingState, ErrorState, EmptyState };
export default LoadingState;
