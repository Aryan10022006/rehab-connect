import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClinicMedical, FaUserMd, FaMapMarkerAlt, FaShieldAlt, FaStar, FaArrowRight, FaCheck } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();

  // Helper: Check if user is logged in and session is valid
  const isUserLoggedIn = () => {
    const sessionStart = localStorage.getItem('user_session_start');
    if (!sessionStart) return false;
    const now = Date.now();
    // 1 hour session
    return now - Number(sessionStart) <= 60 * 60 * 1000;
  };

  const handleGetStarted = () => {
    if (isUserLoggedIn()) {
      navigate('/user');
    } else {
      navigate('/register');
    }
  };

  const handleSignIn = () => {
    if (isUserLoggedIn()) {
      navigate('/user');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <FaMapMarkerAlt className="text-3xl text-blue-600" />,
      title: "Location-Based Search",
      description: "Find verified clinics within 20km radius with precise geolocation"
    },
    {
      icon: <FaUserMd className="text-3xl text-blue-600" />,
      title: "Expert Professionals",
      description: "Connect with certified physiotherapists and P&O specialists"
    },
    {
      icon: <FaShieldAlt className="text-3xl text-blue-600" />,
      title: "Verified Clinics",
      description: "All clinics are thoroughly verified for quality and authenticity"
    },
    {
      icon: <FaStar className="text-3xl text-blue-600" />,
      title: "Ratings & Reviews",
      description: "Make informed decisions with genuine patient reviews"
    }
  ];

  const stats = [
    { number: "500+", label: "Verified Clinics" },
    { number: "50+", label: "Cities Covered" },
    { number: "10K+", label: "Happy Patients" },
    { number: "98%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-16 w-16 object-contain mr-2" />
              <span className="text-2xl font-bold text-gray-900">Rehab Connect</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Sign In
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Find the Best
              <span className="text-blue-600 block">Rehab Clinics</span>
              Near You
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with verified physiotherapy and prosthetic & orthotic clinics across India. 
              Your journey to recovery starts with finding the right care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={handleGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105"
              >
                Get Started <FaArrowRight />
              </button>
              <button 
                onClick={handleSignIn}
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 font-semibold text-lg transition"
              >
                Sign In
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Rehab Connect?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've built the most comprehensive platform to help you find quality rehabilitation care
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Find Your Perfect Clinic?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients who have found their ideal rehabilitation care through our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg transition transform hover:scale-105"
            >
              Create Free Account
            </button>
            <button 
              onClick={handleSignIn}
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 font-semibold text-lg transition"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <FaClinicMedical className="text-2xl text-blue-400" />
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
    </div>
  );
};

export default LandingPage;
