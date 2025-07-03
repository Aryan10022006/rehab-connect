import React, { useState, useMemo, useEffect } from "react";
import { getDistance } from "geolib";
import Fuse from "fuse.js";
import ClinicCard from "../components/ClinicCard";
import ClinicMap from "../components/ClinicMap";
import Filters from "../components/Filters";
import { useMediaQuery } from 'react-responsive';
import { API_BASE_URL } from '../utils/api';

function getUnique(arr, key) {
  return [...new Set(arr.map((item) => item[key]).filter(Boolean))];
}

const fuseOptions = {
  keys: ["name", "address", "location", "pincode"],
  threshold: 0.3,
  includeScore: true,
};

function getUserEmail() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.credential) {
    try {
      const base64Url = user.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.email;
    } catch (e) { return null; }
  }
  return null;
}

const HomePage = () => {
  const [clinicsData, setClinicsData] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [search, setSearch] = useState("");
  const [distance, setDistance] = useState("");
  const [surgeon, setSurgeon] = useState("");
  const [service, setService] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get user email for browsing history
  const userEmail = getUserEmail();

  // Fetch clinics from backend
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/clinics`)
      .then(res => res.json())
      .then(data => {
        setClinicsData(data);
        setSelectedClinicId(data[0]?.id || null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load clinics from backend.");
        setLoading(false);
      });
  }, []);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError("Location access denied. Distance will not be personalized."),
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation not supported.");
    }
  }, []);

  // Fuzzy search
  const fuse = useMemo(() => new Fuse(clinicsData, fuseOptions), [clinicsData]);
  let filteredClinics = clinicsData;
  if (search.trim()) {
    const fuseResults = fuse.search(search.trim());
    filteredClinics = fuseResults.map(r => r.item);
  }

  // Calculate distance for each clinic
  const clinicsWithDistance = filteredClinics.map((clinic) => {
    let dist = null;
    if (userLocation) {
      dist = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: clinic.lat, longitude: clinic.lng }
      ) / 1000;
    }
    return { ...clinic, calculatedDistance: dist };
  });

  // Filter by pincode if entered in search
  let clinicsToShow = clinicsWithDistance;
  const pincodeMatch = search.trim().match(/\b\d{6}\b/);
  if (pincodeMatch) {
    clinicsToShow = clinicsToShow.filter(c => c.pincode === pincodeMatch[0]);
  } else if (userLocation) {
    // If no pincode, filter by distance <= 20km
    clinicsToShow = clinicsToShow.filter(
      (c) => c.calculatedDistance !== null && c.calculatedDistance <= 20
    );
  }

  // Dynamic filter options based on filtered clinics
  const surgeons = useMemo(() => getUnique(clinicsToShow, "surgeon"), [clinicsToShow]);
  const services = useMemo(() => Array.from(new Set(clinicsToShow.flatMap(c => c.services || []))), [clinicsToShow]);
  // Distance filter options (in km, max 20)
  const distanceOptions = ["1", "2", "5", "10", "20"];

  // Filter by surgeon and service
  clinicsToShow = clinicsToShow.filter((clinic) => {
    const matchesSurgeon = !surgeon || clinic.surgeon === surgeon;
    const matchesService = !service || (clinic.services && clinic.services.includes(service));
    return matchesSurgeon && matchesService;
  });

  // Sort by calculated distance (ascending)
  clinicsToShow = clinicsToShow.sort((a, b) => {
    if (a.calculatedDistance == null) return 1;
    if (b.calculatedDistance == null) return -1;
    return a.calculatedDistance - b.calculatedDistance;
  });

  // Blur the first 3 results for premium
  const blurredClinics = clinicsToShow.slice(0, 3);
  const visibleClinics = clinicsToShow.slice(3);
  const blurredClinicIds = blurredClinics.map(c => c.id);

  // Track browsing history
  useEffect(() => {
    if (userEmail && selectedClinicId) {
      const historyKey = `history_${userEmail}`;
      const prev = JSON.parse(localStorage.getItem(historyKey) || "[]");
      if (!prev.includes(selectedClinicId)) {
        localStorage.setItem(historyKey, JSON.stringify([selectedClinicId, ...prev].slice(0, 10)));
      }
    }
  }, [selectedClinicId, userEmail]);

  const handleClearFilters = () => {
    setSearch("");
    setDistance("");
    setSurgeon("");
    setService("");
  };

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [showDropdownMap, setShowDropdownMap] = useState(false);

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
              distances={distanceOptions}
              onClear={handleClearFilters}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
            {locationError && (
              <div className="text-xs text-red-500 mb-2">{locationError}</div>
            )}
            <div className="text-xs text-slate-500 mb-2 font-medium">
              {clinicsToShow.length} Results
            </div>
            {clinicsToShow.length === 0 && (
              <div className="text-center text-slate-400 py-8">No clinics found matching your criteria.</div>
            )}
            {blurredClinics.map((clinic) => (
              <div key={clinic.id} style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
                <ClinicCard
                  clinic={{ ...clinic, distance: clinic.calculatedDistance != null ? `${clinic.calculatedDistance.toFixed(2)} KM` : "-" }}
                  selected={false}
                  onClick={() => {}}
                  locked={true}
                />
              </div>
            ))}
            {visibleClinics.map((clinic) => (
              <div key={clinic.id}>
                <ClinicCard
                  clinic={{ ...clinic, distance: clinic.calculatedDistance != null ? `${clinic.calculatedDistance.toFixed(2)} KM` : "-" }}
                  selected={clinic.id === selectedClinicId}
                  onClick={() => {
                    setSelectedClinicId(clinic.id);
                    if (isMobile) setShowDropdownMap(true);
                  }}
                  locked={false}
                />
                {/* Dropdown map for mobile */}
                {isMobile && showDropdownMap && clinic.id === selectedClinicId && (
                  <div className="transition-all duration-300 overflow-hidden rounded-lg border shadow mt-2" style={{ maxHeight: '400px' }}>
                    <ClinicMap
                      clinics={[clinic]}
                      selectedClinicId={clinic.id}
                      onMarkerClick={() => {}}
                      blurredClinicIds={[]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Right: Map */}
        {!isMobile && (
          <div className="flex-1 w-full h-[300px] md:h-auto md:min-h-[600px] md:max-h-[calc(100vh-120px)] z-0 min-h-0">
            <ClinicMap
              clinics={clinicsToShow}
              selectedClinicId={selectedClinicId}
              onMarkerClick={setSelectedClinicId}
              blurredClinicIds={blurredClinicIds}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default HomePage; 