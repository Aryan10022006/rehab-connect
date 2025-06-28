import React, { useState, useMemo } from "react";
import clinicsData from "../data/clinics.json";
import ClinicCard from "../components/ClinicCard";
import ClinicMap from "../components/ClinicMap";
import Filters from "../components/Filters";

function getUnique(arr, key) {
  return [...new Set(arr.map((item) => item[key]).filter(Boolean))];
}

const getDistanceNumber = (distance) => {
  if (!distance) return Infinity;
  const num = parseFloat(distance);
  return isNaN(num) ? Infinity : num;
};

const HomePage = () => {
  const [selectedClinicId, setSelectedClinicId] = useState(clinicsData[0]?.id || null);
  const [search, setSearch] = useState("");
  const [distance, setDistance] = useState("");
  const [surgeon, setSurgeon] = useState("");
  const [service, setService] = useState("");

  // Prepare filter options
  const surgeons = useMemo(() => getUnique(clinicsData, "surgeon"), []);
  const services = useMemo(() => Array.from(new Set(clinicsData.flatMap(c => c.services || []))), []);
  const distances = useMemo(() => getUnique(clinicsData, "distance"), []);

  // Filtering logic
  let filteredClinics = clinicsData.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(search.toLowerCase()) ||
      clinic.location.toLowerCase().includes(search.toLowerCase()) ||
      clinic.address.toLowerCase().includes(search.toLowerCase());
    const matchesDistance = !distance || clinic.distance === distance;
    const matchesSurgeon = !surgeon || clinic.surgeon === surgeon;
    const matchesService = !service || (clinic.services && clinic.services.includes(service));
    return matchesSearch && matchesDistance && matchesSurgeon && matchesService;
  });

  // Sort by distance (default)
  filteredClinics = filteredClinics.sort((a, b) => getDistanceNumber(a.distance) - getDistanceNumber(b.distance));

  const handleClearFilters = () => {
    setSearch("");
    setDistance("");
    setSurgeon("");
    setService("");
  };

  return (
    <main className="flex flex-col h-screen min-h-0 bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row gap-4 h-full max-w-7xl mx-auto w-full p-2 md:p-6 overflow-hidden min-h-0">
        {/* Left: List & Filters */}
        <div className="bg-white rounded-lg shadow-md w-full md:w-1/3 max-w-md flex flex-col z-20 min-h-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Filters
              search={search}
              setSearch={setSearch}
              distance={distance}
              setDistance={setDistance}
              surgeon={surgeon}
              setSurgeon={setSurgeon}
              service={service}
              setService={setService}
              surgeons={surgeons}
              services={services}
              distances={distances}
              onClear={handleClearFilters}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
            <div className="text-xs text-slate-500 mb-2 font-medium">
              {filteredClinics.length} Results
            </div>
            {filteredClinics.length === 0 && (
              <div className="text-center text-slate-400 py-8">No clinics found matching your criteria.</div>
            )}
            {filteredClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                selected={clinic.id === selectedClinicId}
                onClick={() => setSelectedClinicId(clinic.id)}
                locked={false}
              />
            ))}
          </div>
        </div>
        {/* Right: Map */}
        <div className="flex-1 w-full h-[300px] md:h-auto md:min-h-[600px] md:max-h-[calc(100vh-120px)] z-0 min-h-0">
          <ClinicMap
            clinics={filteredClinics}
            selectedClinicId={selectedClinicId}
            onMarkerClick={setSelectedClinicId}
          />
        </div>
      </div>
    </main>
  );
};

export default HomePage; 