import React, { useState } from 'react';
import Header from '../components/Header';

const COMPANY = {
  name: 'RoboBionics Pvt. Ltd.',
  address: '123 Innovation Park, Sector 21, Gurugram, Haryana, India',
  phone: '+91-9876543210',
  email: 'support@robobionics.com',
  partnership: 'partners@robobionics.com',
  logo: '/robobionicslogo.png',
  mapLink: 'https://goo.gl/maps/robobionics-office',
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
    <div className="min-h-screen bg-gray-50 py-10">
      <Header />
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
        <div className="flex flex-col items-center mb-8">
          <img src={COMPANY.logo} alt="RoboBionics Logo" className="h-24 w-24 object-contain mb-2" />
          <h1 className="text-3xl font-bold text-blue-800 mb-1">Contact Us</h1>
          <p className="text-gray-600 text-center">We'd love to hear from you! Fill out the form below or reach us directly.</p>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="border rounded px-3 py-2" required />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="border rounded px-3 py-2" required />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Subject</label>
            <input type="text" name="subject" value={form.subject} onChange={handleChange} className="border rounded px-3 py-2" required />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Message</label>
            <textarea name="message" value={form.message} onChange={handleChange} className="border rounded px-3 py-2 min-h-[100px]" required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold mt-2">Send Message</button>
          {status && <div className="text-green-600 font-medium mt-2">{status}</div>}
        </form>
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-bold mb-2 text-blue-800">Company Information</h2>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Office:</span>
            <span>{COMPANY.address}</span>
            <a href={COMPANY.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">View on Map</a>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Customer Help:</span>
            <a href={`tel:${COMPANY.phone}`} className="text-blue-600 hover:underline">{COMPANY.phone}</a>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Email:</span>
            <a href={`mailto:${COMPANY.email}`} className="text-blue-600 hover:underline">{COMPANY.email}</a>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">Partnerships:</span>
            <a href={`mailto:${COMPANY.partnership}`} className="text-blue-600 hover:underline">{COMPANY.partnership}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 