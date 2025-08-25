import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaMapMarkerAlt, FaShieldAlt, FaStar, FaArrowRight, FaCheck, FaBars, FaTimes, FaCrown, FaUser, FaPhone, FaFilter } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSignIn = () => {
    if (isUserLoggedIn()) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExploreClinics = () => {
    navigate('/clinics');
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-blue-600 backdrop-blur-sm shadow-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-24 w-24 md:h-32 md:w-32 object-contain mr-2 transition-all duration-200" />
              <span className="text-2xl font-bold text-white">Rehab Connect</span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="text-white hover:text-grey-600 font-medium transition"
              >
                Sign In
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-white text-blue px-4 py-2 rounded-lg hover:bg-grey font-medium transition"
              >
                Get Started
              </button>
            </div>
            {/* Mobile Hamburger */}
            <button className="md:hidden ml-2 p-2 rounded focus:outline-none hover:bg-blue-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>
          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-blue-600 shadow-lg z-50 flex flex-col md:hidden animate-fade-in">
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                className="w-full text-left px-6 py-4 border-b border-blue-700 text-lg font-semibold transition bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                className="w-full text-left px-6 py-4 text-lg font-semibold transition bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </button>
            </div>
          )}
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
                onClick={handleExploreClinics}
                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105"
              >
                Explore Clinics <FaMapMarkerAlt />
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

      {/* Premium Features Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <FaCrown className="inline-block text-yellow-500 mr-3" />
              Premium Access
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock unlimited clinic access and premium features with our professional plans
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Free vs Premium */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-lg border">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FaUser className="text-gray-500 mr-3" />
                  Free Access
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-3" />
                    <span>View up to 2 clinics per search</span>
                  </li>
                  <li className="flex items-center">
                    <FaTimes className="text-red-500 mr-3" />
                    <span className="text-gray-500">Additional results blurred</span>
                  </li>
                  <li className="flex items-center">
                    <FaTimes className="text-red-500 mr-3" />
                    <span className="text-gray-500">Limited contact information</span>
                  </li>
                  <li className="flex items-center">
                    <FaTimes className="text-red-500 mr-3" />
                    <span className="text-gray-500">Basic search filters</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-xl shadow-lg text-white">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <FaCrown className="text-yellow-400 mr-3" />
                  Premium Access
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <FaCheck className="text-green-400 mr-3" />
                    <span>Unlimited clinic access</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-400 mr-3" />
                    <span>Complete contact details</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-400 mr-3" />
                    <span>Advanced search filters</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-400 mr-3" />
                    <span>Priority customer support</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-400 mr-3" />
                    <span>Save favorite clinics</span>
                  </li>
                </ul>
                <button className="mt-6 bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition transform hover:scale-105">
                  Upgrade to Premium
                </button>
              </div>
            </div>
            
            {/* Premium Benefits */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Unlock Full Potential
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Get unlimited access to our complete database of rehabilitation clinics and premium features designed for healthcare professionals and frequent users.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <FaMapMarkerAlt className="text-blue-500 text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">Unlimited Search</h4>
                  <p className="text-gray-600 text-sm">Access all clinics in your area without restrictions</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <FaPhone className="text-green-500 text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">Direct Contact</h4>
                  <p className="text-gray-600 text-sm">Get complete contact information instantly</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <FaFilter className="text-purple-500 text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">Advanced Filters</h4>
                  <p className="text-gray-600 text-sm">Filter by specialties, ratings, and availability</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <FaCrown className="text-yellow-500 text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">VIP Support</h4>
                  <p className="text-gray-600 text-sm">Priority customer service and assistance</p>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default LandingPage;
