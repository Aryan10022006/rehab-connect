import React, { useState, useEffect, useMemo } from "react";
import { getDistance } from "geolib";
import Fuse from "fuse.js";
import ClinicCard from "../components/ClinicCard";
import ClinicMap from "../components/ClinicMap";
import Filters from "../components/Filters";
import { useMediaQuery } from 'react-responsive';
import { API_BASE_URL, fetchClinics, getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from "../components/Header";

function getUnique(arr, key) {
  return [...new Set(arr.map((item) => item[key]).filter(Boolean))];
}


const fuseOptions = {
  keys: ["name", "address", "pincode", "phone", "city", "status", "timings", "gmapLink", "website"],
  threshold: 0.3,
  includeScore: true,
};

const HomePage = () => {
  const { user } = useAuth();
  const [clinicsData, setClinicsData] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [search, setSearch] = useState("");
  const [distance, setDistance] = useState("");
  const [surgeon, setSurgeon] = useState("");
  const [service, setService] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch clinics from backend
  useEffect(() => {
    setLoading(true);
    fetchClinics()
      .then(data => {
        setClinicsData(data);
        setSelectedClinicId(null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load clinics from backend.");
        setLoading(false);
      });
  }, []);

  // centering on user's location
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

  // centering map on searched city
  useEffect(() => {
    if (search) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            setLocationError("");
          } else {
            setLocationError("Location not found. Please try another city or area.");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch location from Nominatim:", err);
          setLocationError("Location service is currently unavailable. Please try again later.");
        });
    }
  }, [search]);

  
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
    if (userLocation && clinic.lat && clinic.long) {
      dist = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: clinic.lat, longitude: clinic.long }
      ) / 1000;
    }
    return { ...clinic, calculatedDistance: dist };
  });

  // Filter by pincode if entered in search
  let clinicsToShow = clinicsWithDistance;
  const pincodeMatch = search.trim().match(/\b\d{6}\b/);
  if (pincodeMatch) {
    clinicsToShow = clinicsToShow.filter(c => c.pincode === pincodeMatch[0]);
  } else if (userLocation && distance) {
    clinicsToShow = clinicsToShow.filter(
      (c) => c.calculatedDistance !== null && c.calculatedDistance <= parseFloat(distance)
    );
  } else if (userLocation) {
    clinicsToShow = clinicsToShow.filter(
      (c) => c.calculatedDistance !== null && c.calculatedDistance <= 20
    );
  }
  clinicsToShow = clinicsToShow.filter(c => c.lat && c.long);

  // Filters for rating, verified, operational
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [operationalOnly, setOperationalOnly] = useState(false);
  clinicsToShow = clinicsToShow.filter(clinic => {
    const matchesRating = !minRating || (clinic.rating && clinic.rating >= minRating);
    const matchesVerified = !verifiedOnly || clinic.verified;
    const matchesOperational = !operationalOnly || (clinic.status && clinic.status.toLowerCase() === 'operational');
    return matchesRating && matchesVerified && matchesOperational;
  });

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

  // Show the 5 farthest clinics (by distance), blur the rest
  let visibleClinics = [];
  let blurredClinics = [];
  if (clinicsToShow.length <= 5) {
    visibleClinics = clinicsToShow;
    blurredClinics = [];
  } else {
    // Sort by distance descending (farthest first)
    const sortedByFarthest = [...clinicsToShow].sort((a, b) => {
      if (a.calculatedDistance == null) return 1;
      if (b.calculatedDistance == null) return -1;
      return b.calculatedDistance - a.calculatedDistance;
    });
    visibleClinics = sortedByFarthest.slice(0, 5).sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    blurredClinics = sortedByFarthest.slice(5).sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }
  const blurredClinicIds = blurredClinics.map(c => c.id);
  // Only show non-blurred clinics on the map
  const clinicsForMap = visibleClinics;

  // Dynamic filter options based on filtered clinics
  const surgeons = useMemo(() => getUnique(clinicsToShow, "surgeon"), [clinicsToShow]);
  const services = useMemo(() => Array.from(new Set(clinicsToShow.flatMap(c => c.services || []))), [clinicsToShow]);
  // Distance filter options (in km, max 20)
  const distanceOptions = ["1", "2", "5", "10", "20"];

  // Sort by calculated distance (ascending)
  clinicsToShow = clinicsToShow.sort((a, b) => {
    if (a.calculatedDistance == null) return 1;
    if (b.calculatedDistance == null) return -1;
    return a.calculatedDistance - b.calculatedDistance;
  });

  // Track browsing history
  useEffect(() => {
    if (user && selectedClinicId) {
      // Save to backend
      fetch(`${getApiUrl()}/user/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clinicId: selectedClinicId })
      }).catch(console.error);
    }
  }, [selectedClinicId, user]);

  const handleClearFilters = () => {
    setSearch("");
    setDistance("");
    setSurgeon("");
    setService("");
  };

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [showDropdownMap, setShowDropdownMap] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  return (
    <>
      <Header />
      <main className="flex flex-col h-screen min-h-0 bg-slate-50 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto w-full p-2 md:p-6 overflow-hidden min-h-0">
          {/* Left: List & Filters */}
          <div className="bg-white rounded-lg shadow-md w-full md:w-2/5 max-w-lg flex flex-col z-20 min-h-0 overflow-hidden md:h-[600px]" style={{height: 'auto'}}>
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
                minRating={minRating}
                setMinRating={setMinRating}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
                operationalOnly={operationalOnly}
                setOperationalOnly={setOperationalOnly}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
              {locationError && (
                <div className="text-center text-red-500 py-2 font-medium">
                  {locationError}
                </div>
              )}
              <div className="text-xs text-slate-500 mb-2 font-medium">
                {visibleClinics.length} Results
              </div>
              {clinicsToShow.length === 0 && (
                <div className="text-center text-slate-400 py-8">No clinics found. Try increasing your search area or removing some filters.</div>
              )}
              {/* Blurred clinics first */}
              {blurredClinics.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-500">Premium Clinics (Unlock to view details)</span>
                    <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:from-yellow-500 hover:to-yellow-700 transition">Upgrade to Premium</button>
                  </div>
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
                </>
              )}
              {/* Then non-blurred clinics */}
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
                    <div className="transition-all duration-300 overflow-hidden rounded-lg border shadow mt-2" style={{ maxHeight: '350px' }}>
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
            {/* Mobile: Toggle Map Button */}
            {isMobile && (
              <button
                className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg md:hidden"
                onClick={() => setShowMobileMap((v) => !v)}
              >
                {showMobileMap ? 'Hide Map' : 'Show Map'}
              </button>
            )}
          </div>
          {/* Right: Map */}
          {(!isMobile || showMobileMap) && (
            <div className="flex-1 w-full h-[350px] md:h-[600px] z-0 min-h-0 mt-4 md:mt-0 md:ml-4">
              <ClinicMap
                clinics={clinicsForMap}
                selectedClinicId={selectedClinicId}
                onMarkerClick={setSelectedClinicId}
                blurredClinicIds={[]}
                center={mapCenter}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default HomePage;