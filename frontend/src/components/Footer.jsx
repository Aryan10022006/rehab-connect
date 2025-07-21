import React from 'react';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12 mt-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-16 w-16 md:h-24 md:w-24 object-contain" />
            <span className="text-xl font-bold">Rehab Connect</span>
          </div>
          <p className="text-gray-400 mb-4">
            Connecting patients with the best rehabilitation clinics across India. 
            Your health, our priority.
          </p>
          <div className="text-sm text-gray-500">
            © 2025 Rehab Connect. All rights reserved.
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Platform</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Find Clinics</li>
            <li>Book Appointments</li>
            <li>Track History</li>
            <li>Reviews</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Support</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Help Center</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer; 