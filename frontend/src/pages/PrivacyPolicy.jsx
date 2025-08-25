import React from 'react';
import { FaShieldAlt, FaLock, FaUserShield, FaDatabase } from 'react-icons/fa';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FaShieldAlt className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-blue-100">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-sm text-blue-200 mt-4">
              Last updated: August 25, 2025
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            RoboBionics Pvt. Ltd. ("we," "our," or "us") operates the Rehab Connect platform. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our healthcare clinic discovery service.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaDatabase className="text-blue-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Account credentials and authentication data</li>
                <li>Profile information and preferences</li>
                <li>Communication history and support interactions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Data</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>GPS coordinates for clinic recommendations</li>
                <li>City, state, and postal code information</li>
                <li>Search radius and location preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Clinic searches and view history</li>
                <li>Platform interactions and feature usage</li>
                <li>Device information and browser type</li>
                <li>Session duration and frequency of use</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaUserShield className="text-green-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Provision</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide personalized clinic recommendations</li>
                <li>Process account registration and authentication</li>
                <li>Enable premium features and subscriptions</li>
                <li>Deliver customer support services</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Improvement</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Analyze usage patterns and preferences</li>
                <li>Enhance search algorithms and accuracy</li>
                <li>Develop new features and improvements</li>
                <li>Ensure platform security and performance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaLock className="text-red-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your personal information:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Encryption</h4>
                <p className="text-sm text-blue-800">
                  All data transmission is secured using SSL/TLS encryption protocols
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Access Control</h4>
                <p className="text-sm text-green-800">
                  Strict access controls and authentication for all team members
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Data Backup</h4>
                <p className="text-sm text-purple-800">
                  Regular backups and disaster recovery procedures in place
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Monitoring</h4>
                <p className="text-sm text-orange-800">
                  24/7 security monitoring and threat detection systems
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">Right to Access</h3>
              <p className="text-gray-600 text-sm">Request a copy of your personal data we hold</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900">Right to Rectification</h3>
              <p className="text-gray-600 text-sm">Request correction of inaccurate personal data</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900">Right to Erasure</h3>
              <p className="text-gray-600 text-sm">Request deletion of your personal data</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900">Right to Portability</h3>
              <p className="text-gray-600 text-sm">Request transfer of your data to another service</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
          <p className="mb-6">
            If you have any questions about this Privacy Policy or our data practices, 
            please contact our Data Protection Officer.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Email:</strong> privacy@robobionics.com
            </div>
            <div>
              <strong>Phone:</strong> +91 98765 43210
            </div>
            <div>
              <strong>Address:</strong> 123 Innovation Park, Sector 21, Gurugram, Haryana 122001
            </div>
            <div>
              <strong>Response Time:</strong> Within 72 hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
