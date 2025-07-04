import React from "react";
import { FaSearch } from "react-icons/fa";

const Filters = ({ search, setSearch, distance, setDistance, surgeon, setSurgeon, service, setService, surgeons, services, distances, onClear }) => {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 p-4 bg-white rounded-xl shadow-lg mb-4 border border-slate-100">
      {/* Top Row: Search Bar and Button */}
      <form
        className="flex flex-col md:flex-row gap-2 w-full"
        onSubmit={e => e.preventDefault()}
      >
        <div className="flex items-center flex-1 bg-slate-100 rounded-lg px-3 py-2 shadow-sm w-full md:w-auto">
          <FaSearch className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by clinic name, city, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-slate-700 text-sm md:text-base"
          />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Search
        </button>
      </form>
      {/* Second Row: Dropdown Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
        <select
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="col-span-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm w-full"
        >
          <option value="">All Distances</option>
          {distances.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={surgeon}
          onChange={(e) => setSurgeon(e.target.value)}
          className="col-span-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm w-full"
        >
          <option value="">All Surgeons</option>
          {surgeons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="col-span-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm w-full"
        >
          <option value="">All Services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={onClear}
          className="col-span-1 text-blue-700 hover:underline text-sm font-medium px-3 py-2 rounded-lg transition hover:bg-blue-50 w-full border border-blue-100 bg-slate-50 shadow-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default Filters; 