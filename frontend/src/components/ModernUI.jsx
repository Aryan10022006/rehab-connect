import React, { useState, useEffect } from 'react';

const BlurredBackground = ({ 
  children, 
  imageUrl, 
  blurIntensity = 'blur-sm',
  overlayOpacity = 'bg-opacity-50',
  overlayColor = 'bg-blue-900',
  className = ''
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      {imageUrl && (
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${blurIntensity}`}
          style={{
            backgroundImage: `url(${imageUrl})`,
            filter: 'blur(4px)',
            transform: 'scale(1.1)' // Slightly scale to hide blur edges
          }}
        />
      )}
      
      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayColor} ${overlayOpacity}`} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const GlassCard = ({ 
  children, 
  className = '', 
  blur = 'backdrop-blur-md',
  background = 'bg-white/10',
  border = 'border border-white/20',
  shadow = 'shadow-xl',
  hover = true
}) => {
  const hoverClasses = hover ? 'hover:bg-white/20 hover:border-white/30 transition-all duration-300' : '';
  
  return (
    <div className={`
      ${blur} ${background} ${border} ${shadow} 
      rounded-xl p-6 ${hoverClasses} ${className}
    `}>
      {children}
    </div>
  );
};

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 
      hover:from-blue-700 hover:to-blue-800 
      text-white shadow-lg hover:shadow-xl
      border border-blue-500/50
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 
      hover:from-gray-200 hover:to-gray-300 
      text-gray-800 shadow-md hover:shadow-lg
      border border-gray-300
    `,
    outline: `
      bg-transparent border-2 border-blue-600 
      text-blue-600 hover:bg-blue-600 hover:text-white
      shadow-md hover:shadow-lg
    `,
    glass: `
      backdrop-blur-md bg-white/10 border border-white/20
      text-white hover:bg-white/20 shadow-lg hover:shadow-xl
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 
      hover:from-red-700 hover:to-red-800 
      text-white shadow-lg hover:shadow-xl
      border border-red-500/50
    `,
    success: `
      bg-gradient-to-r from-green-600 to-green-700 
      hover:from-green-700 hover:to-green-800 
      text-white shadow-lg hover:shadow-xl
      border border-green-500/50
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        transform hover:scale-105 active:scale-95
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        )}
        {Icon && !loading && <Icon className="w-4 h-4" />}
        <span>{children}</span>
      </div>
    </button>
  );
};

const ModernInput = ({ 
  label, 
  error, 
  icon: Icon,
  className = '',
  containerClassName = '',
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: `
      bg-white border border-gray-300 
      focus:border-blue-500 focus:ring-blue-500/20
    `,
    glass: `
      backdrop-blur-md bg-white/10 border border-white/20
      text-white placeholder-white/70
      focus:border-white/40 focus:ring-white/20
    `,
    minimal: `
      bg-transparent border-0 border-b-2 border-gray-300
      focus:border-blue-500 rounded-none
    `
  };

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
        <input
          className={`
            ${variants[variant]}
            w-full rounded-xl px-4 py-3 transition-all duration-200
            focus:outline-none focus:ring-4
            ${Icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-500 ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colors = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500',
    red: 'border-red-500',
    green: 'border-green-500'
  };

  return (
    <div className={`
      animate-spin rounded-full ${sizes[size]} 
      border-2 ${colors[color]} border-t-transparent
    `} />
  );
};

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  blur = true 
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/50 
          ${blur ? 'backdrop-blur-sm' : ''}
        `}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl 
        ${sizes[size]} w-full max-h-[90vh] overflow-hidden
        transform transition-all duration-300
      `}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose,
  duration = 5000 
}) => {
  const types = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      text: 'text-white'
    },
    error: {
      bg: 'bg-red-500',
      icon: '✗',
      text: 'text-white'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      text: 'text-black'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      text: 'text-white'
    }
  };

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const config = types[type];

  return (
    <div className={`
      fixed top-4 right-4 z-50
      ${config.bg} ${config.text}
      backdrop-blur-md rounded-xl px-6 py-4 shadow-2xl
      transform transition-all duration-300
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold">{config.icon}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const ProgressBar = ({ 
  progress, 
  color = 'blue', 
  height = 'h-2',
  animated = true,
  showLabel = false 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`
            ${height} ${colors[color]} rounded-full transition-all duration-300
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export {
  BlurredBackground,
  GlassCard,
  ModernButton,
  ModernInput,
  LoadingSpinner,
  Modal,
  Toast,
  ProgressBar
};
