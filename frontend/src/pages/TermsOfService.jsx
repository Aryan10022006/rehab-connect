import React from 'react';
import { FaGavel, FaUserCheck, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FaGavel className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-blue-100">
              Please read these terms carefully before using our platform
            </p>
            <p className="text-sm text-blue-200 mt-4">
              Last updated: August 25, 2025
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Agreement */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            By accessing and using Rehab Connect, a service provided by RoboBionics Pvt. Ltd., 
            you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-800 text-sm">
              <strong>Important:</strong> If you do not agree with any of these terms, 
              you are prohibited from using or accessing our platform.
            </p>
          </div>
        </div>

        {/* Platform Description */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Description</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Rehab Connect is a healthcare clinic discovery platform that helps users find 
            rehabilitation and healthcare facilities based on their location and preferences.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Free Services</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Basic clinic search functionality</li>
                <li>View up to 2 clinics per search</li>
                <li>Basic clinic information</li>
                <li>Standard customer support</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Premium Services</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Unlimited clinic access</li>
                <li>Advanced search filters</li>
                <li>Detailed clinic analytics</li>
                <li>Priority customer support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Accounts */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaUserCheck className="text-green-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Registration</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>One account per user is permitted</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>You are solely responsible for:</strong>
                </p>
                <ul className="list-disc list-inside text-yellow-700 text-sm mt-2 space-y-1">
                  <li>All activities that occur under your account</li>
                  <li>Maintaining the confidentiality of your login credentials</li>
                  <li>Ensuring your contact information is current</li>
                  <li>Complying with all applicable laws and regulations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Subscriptions */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaCreditCard className="text-blue-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Premium Subscriptions</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing and Payment</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Premium subscriptions are billed monthly or annually</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>Prices may change with 30 days advance notice</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                  <li>You may cancel your subscription at any time</li>
                  <li>Cancellation takes effect at the end of the current billing period</li>
                  <li>No refunds for partial billing periods</li>
                  <li>You retain access to premium features until period ends</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Prohibited Uses */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Prohibited Uses</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-semibold mb-4">You may NOT use our platform to:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside text-red-700 text-sm space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit harmful or malicious content</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Interfere with platform functionality</li>
              </ul>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-2">
                <li>Scrape or extract data without permission</li>
                <li>Impersonate others or provide false information</li>
                <li>Share account credentials with others</li>
                <li>Use automated tools against our servers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical Disclaimers</h2>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <h3 className="font-semibold text-orange-900 mb-2">No Medical Advice</h3>
              <p className="text-orange-800 text-sm">
                Rehab Connect provides information only. We do not provide medical advice, 
                diagnosis, or treatment recommendations.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Clinic Information</h3>
              <p className="text-blue-800 text-sm">
                We strive for accuracy but cannot guarantee that all clinic information 
                is current, complete, or error-free.
              </p>
            </div>
            
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Professional Consultation</h3>
              <p className="text-purple-800 text-sm">
                Always consult with qualified healthcare professionals for medical decisions 
                and treatment options.
              </p>
            </div>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Limitation of Liability</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              RoboBionics Pvt. Ltd. shall not be liable for any direct, indirect, incidental, 
              special, consequential, or punitive damages arising from your use of the platform. 
              Our total liability shall not exceed the amount paid by you for premium services 
              in the 12 months preceding the claim.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Terms?</h2>
          <p className="mb-6">
            If you have questions about these Terms of Service, please contact our legal team.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Email:</strong> legal@robobionics.com
            </div>
            <div>
              <strong>Phone:</strong> +91 98765 43210
            </div>
            <div>
              <strong>Address:</strong> 123 Innovation Park, Sector 21, Gurugram, Haryana 122001
            </div>
            <div>
              <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM IST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
