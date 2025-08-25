import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaLinkedin, FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const COMPANY = {
  name: 'RoboBionics Pvt. Ltd.',
  address: '123 Innovation Park, Sector 21, Gurugram, Haryana 122001, India',
  phone: '+91-9876543210',
  email: 'support@robobionics.com',
  partnership: 'partners@robobionics.com',
  sales: 'sales@robobionics.com',
  logo: '/robobionicslogo.png',
  mapLink: 'https://goo.gl/maps/robobionics-office',
  hours: {
    weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
    weekends: 'Saturday - Sunday: 10:00 AM - 4:00 PM'
  },
  social: {
    linkedin: 'https://linkedin.com/company/robobionics',
    twitter: 'https://twitter.com/robobionics',
    facebook: 'https://facebook.com/robobionics',
    instagram: 'https://instagram.com/robobionics'
  }
};

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would send the form data to your backend or email service
    setStatus('Thank you for contacting us! We will get back to you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Have questions about Rehab Connect? We're here to help you find the perfect healthcare solution.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-blue-500 text-xl mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Office Address</h3>
                    <p className="text-gray-600 mt-1">{COMPANY.address}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaPhone className="text-blue-500 text-xl mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <a href={`tel:${COMPANY.phone}`} className="text-blue-600 hover:underline">
                      {COMPANY.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaEnvelope className="text-blue-500 text-xl mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <div className="space-y-1">
                      <p>
                        <span className="text-sm text-gray-500">General: </span>
                        <a href={`mailto:${COMPANY.email}`} className="text-blue-600 hover:underline">
                          {COMPANY.email}
                        </a>
                      </p>
                      <p>
                        <span className="text-sm text-gray-500">Sales: </span>
                        <a href={`mailto:${COMPANY.sales}`} className="text-blue-600 hover:underline">
                          {COMPANY.sales}
                        </a>
                      </p>
                      <p>
                        <span className="text-sm text-gray-500">Partnerships: </span>
                        <a href={`mailto:${COMPANY.partnership}`} className="text-blue-600 hover:underline">
                          {COMPANY.partnership}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaClock className="text-blue-500 text-xl mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Hours</h3>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>{COMPANY.hours.weekdays}</p>
                      <p>{COMPANY.hours.weekends}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href={COMPANY.social.linkedin} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 text-2xl">
                  <FaLinkedin />
                </a>
                <a href={COMPANY.social.twitter} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-400 hover:text-blue-600 text-2xl">
                  <FaTwitter />
                </a>
                <a href={COMPANY.social.facebook} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-800 hover:text-blue-900 text-2xl">
                  <FaFacebook />
                </a>
                <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer" 
                   className="text-pink-600 hover:text-pink-800 text-2xl">
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              {status && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{status}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="premium">Premium Subscription</option>
                    <option value="technical">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe your inquiry in detail..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-900 font-semibold transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Visit Our Office</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <FaMapMarkerAlt className="text-blue-500 text-4xl mx-auto mb-4" />
                <p className="text-gray-600">Interactive map coming soon</p>
                <a 
                  href={COMPANY.mapLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-blue-600 hover:underline"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 