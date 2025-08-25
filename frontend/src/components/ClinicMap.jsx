import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCheckCircle, FaPhone, FaMapMarkerAlt, FaGlobe, FaCrosshairs, FaRoute } from "react-icons/fa";

// Fix default icon issue in Leaflet
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Enhanced icon system for different marker types
const createCustomIcon = (color, icon = 'clinic') => {
  const iconHtml = icon === 'user' 
    ? `<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`
    : `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`;
  
  return new L.DivIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

// Professional marker icons for different clinic types
const clinicIcons = {
  verified: createCustomIcon('#10B981'), // Green for verified
  operational: createCustomIcon('#F59E0B'), // Amber for operational
  premium: createCustomIcon('#8B5CF6'), // Purple for premium
  closed: createCustomIcon('#EF4444'), // Red for closed
  default: createCustomIcon('#6B7280') // Gray for default
};

// User location icon (distinctive blue)
const userLocationIcon = createCustomIcon('#3B82F6', 'user');

// Get appropriate icon for clinic
const getClinicIcon = (clinic) => {
  if (clinic.verified) return clinicIcons.verified;
  if (clinic.status?.toLowerCase() === 'operational') return clinicIcons.operational;
  if (clinic.status?.toLowerCase() === 'closed') return clinicIcons.closed;
  return clinicIcons.default;
};

function MapSync({ clinics, selectedClinicId }) {
  const map = useMap();
  useEffect(() => {
    const selected = clinics.find((c) => c.id === selectedClinicId);
    if (selected && typeof selected.lat === 'number' && typeof selected.long === 'number') {
      map.setView([selected.lat, selected.long], 13, { animate: true });
    }
  }, [selectedClinicId, clinics, map]);
  return null;
}

const ClinicMap = ({ clinics, selectedClinicId, onMarkerClick, blurredClinicIds = [], center }) => {
  // Only use clinics with valid lat/long numbers for markers
  const validClinics = clinics.filter(
    clinic => typeof clinic.lat === 'number' && !isNaN(clinic.lat) && typeof clinic.long === 'number' && !isNaN(clinic.long)
  );
  
  // Determine initial map center
  const getInitialCenter = () => {
    if (center && center.lat && center.lng) {
      return { lat: center.lat, lng: center.lng };
    }
    if (validClinics.length > 0) {
      return { lat: validClinics[0].lat, lng: validClinics[0].long };
    }
    return { lat: 20.5937, lng: 78.9629 }; // Default to India center
  };

  const [userLocation, setUserLocation] = useState(center || null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef();

  // Auto-detect user location on component mount
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocating(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [userLocation]);

  // Update user location when center prop changes
  useEffect(() => {
    if (center && center.lat && center.lng) {
      setUserLocation({ lat: center.lat, lng: center.lng });
    }
  }, [center]);

  // Locate user and center map
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        if (mapRef.current) {
          mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        }
        setLocating(false);
      },
      (error) => {
        console.error('Location error:', error);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get map instance
  function SetMapRef() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  }

  return (
    <div className="w-full h-[250px] md:h-full rounded-lg overflow-hidden border shadow-md relative">
      <MapContainer
        center={[getInitialCenter().lat, getInitialCenter().lng]}
        zoom={12}
        style={{ 
          height: "100%", 
          width: "100%",
          zIndex: 1,
          position: "relative"
        }}
        className="rounded-lg overflow-hidden"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <SetMapRef />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <FaCrosshairs className="text-blue-600" />
                  <span className="font-semibold text-blue-900">Your Location</span>
                </div>
                <p className="text-sm text-gray-600">
                  You are here
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Clinic Markers */}
        {validClinics.map((clinic) => {
          const isBlurred = blurredClinicIds.includes(clinic.id);
          
          // Don't show blurred clinics on map for free users
          if (isBlurred) return null;
          
          return (
            <Marker
              key={clinic.id}
              position={[clinic.lat, clinic.long]}
              icon={getClinicIcon(clinic)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(clinic.id),
              }}
            >
              <Popup minWidth={280} maxWidth={320}>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-lg text-gray-900">{clinic.name}</span>
                    {clinic.verified && (
                      <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                        <FaCheckCircle className="text-green-600 text-xs" />
                        <span className="text-green-700 text-xs font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {clinic.address && (
                      <div className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{clinic.address}</span>
                      </div>
                    )}
                    
                    {clinic.phone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-green-500 flex-shrink-0" />
                        <a href={`tel:${clinic.phone}`} className="text-blue-600 hover:underline">
                          {clinic.phone}
                        </a>
                      </div>
                    )}
                    
                    {clinic.website && (
                      <div className="flex items-center gap-2">
                        <FaGlobe className="text-blue-500 flex-shrink-0" />
                        <a 
                          href={clinic.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    {clinic.rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{clinic.rating}</span>
                        {clinic.noOfReviews && (
                          <span className="text-gray-500">({clinic.noOfReviews} reviews)</span>
                        )}
                      </div>
                    )}
                    
                    {clinic.status && (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          clinic.status.toLowerCase() === 'operational' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`font-medium text-xs ${
                          clinic.status.toLowerCase() === 'operational' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {clinic.status}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => onMarkerClick && onMarkerClick(clinic.id)}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    
                    {/* Google Maps Directions Button */}
                    {userLocation && (
                      <button
                        onClick={() => {
                          const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${clinic.lat},${clinic.long}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        title="Get directions on Google Maps"
                      >
                        <FaRoute className="text-xs" />
                        Directions
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapSync clinics={validClinics} selectedClinicId={selectedClinicId} />
      </MapContainer>
      
      {/* Professional Locate Button */}
      <button
        onClick={handleLocate}
        disabled={locating}
        className="absolute top-4 right-4 z-[1000] bg-white border border-gray-200 shadow-lg px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
        title="Find My Location"
      >
        <FaCrosshairs className={`text-blue-600 ${locating ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium text-gray-700">
          {locating ? 'Locating...' : 'My Location'}
        </span>
      </button>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white border border-gray-200 shadow-lg rounded-lg p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
            <span className="text-gray-600">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
            <span className="text-gray-600">Verified Clinics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 border border-white"></div>
            <span className="text-gray-600">Operational Clinics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
            <span className="text-gray-600">Closed/Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicMap;