import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaInstagram,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaHeart,
  FaShieldAlt
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/robobionicslogo.png" 
                alt="RehabConnect" 
                className="h-8 w-8"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h3 className="text-xl font-bold text-blue-400">RehabConnect</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted platform for finding quality rehabilitation centers and healthcare providers across India.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <FaShieldAlt className="text-green-400" />
              <span>Verified Healthcare Network</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/clinics" className="block text-gray-300 hover:text-blue-400 text-sm transition-colors">
                Find Clinics
              </Link>
              <Link to="/dashboard" className="block text-gray-300 hover:text-blue-400 text-sm transition-colors">
                User Dashboard
              </Link>
              <Link to="/pricing" className="block text-gray-300 hover:text-blue-400 text-sm transition-colors">
                Premium Plans
              </Link>
              <Link to="/contact" className="block text-gray-300 hover:text-blue-400 text-sm transition-colors">
                Contact Support
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <FaPhone className="text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <FaEnvelope className="text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">support@rehabconnect.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <FaMapMarkerAlt className="text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* Social & Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Connect</h4>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <FaFacebookF className="text-white" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <FaTwitter className="text-white" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <FaLinkedinIn className="text-white" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <FaInstagram className="text-white" />
              </a>
            </div>

            {/* Legal Links */}
            <div className="space-y-2">
              <Link to="/privacy" className="block text-gray-400 hover:text-white text-xs transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-gray-400 hover:text-white text-xs transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>© {currentYear} RehabConnect. Made with</span>
              <FaHeart className="text-red-500 text-xs" />
              <span>for better healthcare</span>
            </div>
            <div className="text-xs text-gray-500">
              All rights reserved • Healthcare Technology Platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 