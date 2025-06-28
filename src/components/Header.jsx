import React from "react";
import { FaBell, FaUserCircle, FaClinicMedical } from "react-icons/fa";

const Header = () => (
  <header className="w-full bg-blue-800 text-white shadow-md sticky top-0 z-40">
    <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <FaClinicMedical className="text-3xl text-blue-200" />
        <span className="text-2xl font-bold tracking-tight">Rehab Connect</span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold hidden md:inline">by Robo Bionics</span>
      </div>
      <ul className="hidden md:flex gap-6 text-base font-medium">
        <li><a href="#" className="hover:text-blue-200 transition">Home</a></li>
        <li><a href="#clinics" className="hover:text-blue-200 transition">Browse Clinics</a></li>
        <li><a href="#about" className="hover:text-blue-200 transition">About</a></li>
        <li><a href="#contact" className="hover:text-blue-200 transition">Contact</a></li>
      </ul>
      <div className="flex items-center gap-4">
        <button className="relative hover:text-blue-200 transition">
          <FaBell className="text-2xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">1</span>
        </button>
        <button className="hover:text-blue-200 transition">
          <FaUserCircle className="text-3xl" />
        </button>
      </div>
    </nav>
  </header>
);

export default Header; 