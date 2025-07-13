import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCheckCircle, FaPhone, FaMapMarkerAlt, FaGlobe, FaEnvelope, FaUserMd, FaCrosshairs } from "react-icons/fa";

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

const verifiedIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.Icon({

  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",

  iconSize: [32, 32],

  iconAnchor: [16, 32],

  popupAnchor: [0, -32],

});



// Google Maps-style marker icons

const redIcon = new L.Icon({

  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",

  iconSize: [32, 32],

  iconAnchor: [16, 32],

  popupAnchor: [0, -32],

});

const greenIcon = new L.Icon({

  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",

  iconSize: [32, 32],

  iconAnchor: [16, 32],

  popupAnchor: [0, -32],

});

const blueIcon = new L.Icon({

  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",

  iconSize: [32, 32],

  iconAnchor: [16, 32],

  popupAnchor: [0, -32],

});

function MapSync({ clinics, selectedClinicId }) {
  const map = useMap();
  useEffect(() => {
    const selected = clinics.find((c) => c.id === selectedClinicId);
    if (selected) {
      map.setView([selected.lat, selected.lng], 13, { animate: true });
    }
  }, [selectedClinicId, clinics, map]);
  return null;
}

const ClinicMap = ({ clinics, selectedClinicId, onMarkerClick, center, blurredClinicIds = [] }) => {
  const initial = clinics[0] || { lat: 20.5937, lng: 78.9629 };
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef();

  // center map
  useEffect(() => {
    if (center && mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], 13, { animate: true });
    }

        if (!mapRef.current) return;

    mapRef.current.eachLayer((layer) => {

      if (layer instanceof L.Marker) {

        mapRef.current.removeLayer(layer);

      }

    });

    clinics.forEach((clinic) => {

      if (clinic.lat && clinic.lng) {

        const isBlurred = blurredClinicIds.includes(clinic.id);

        const markerIcon = clinic.verified ? greenIcon : redIcon;

        const marker = L.marker([clinic.lat, clinic.lng], { icon: markerIcon })

          .addTo(mapRef.current)

          .on("click", () => {

            if (isBlurred) {

              marker.bindPopup(`<div style='filter: blur(3px); pointer-events: none; user-select: none;'>${clinic.name}<br/>${clinic.address || ''}</div><div style='filter:none; color:#888; font-size:13px; margin-top:8px;'>Unlock premium to view details</div>`).openPopup();

            } else {

              onMarkerClick(clinic.id);

            }

          });

        if (clinic.id === selectedClinicId) {

          marker.openPopup();

        }

      }

    });

    // Add user location marker if set

    if (userLocation) {

      L.marker([userLocation.lat, userLocation.lng], { icon: blueIcon })

        .addTo(mapRef.current)

        .bindPopup("You are here");
    }

  }, [center, clinics, selectedClinicId, onMarkerClick, blurredClinicIds, userLocation]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border shadow-md relative">
      <MapContainer
        center={[initial.lat, initial.lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[300px] md:min-h-[400px]"
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[clinic.lat, clinic.lng]}
            icon={clinic.verified ? verifiedIcon : defaultIcon}
            eventHandlers={{
              click: () => onMarkerClick(clinic.id),
            }}
          >
            <Popup minWidth={240} maxWidth={320}>
              <div className="flex flex-col items-center gap-2 p-1">
                <img
                  src={clinic.image || "/placeholder.jpg"}
                  alt={clinic.name}
                  className="w-32 h-20 object-cover rounded-md border mb-1"
                />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base text-slate-800 text-center">{clinic.name}</span>
                  {clinic.verified && <FaCheckCircle className="text-green-500" title="Verified" />}
                </div>
                <div className="flex flex-col gap-1 w-full text-xs text-slate-600">
                  <span className="flex items-center gap-1"><FaMapMarkerAlt /> {clinic.address}</span>
                  <span className="flex items-center gap-1"><FaPhone /> {clinic.phone}</span>
                  <span className="flex items-center gap-1"><FaEnvelope /> <a href={`mailto:${clinic.email}`} className="hover:underline">{clinic.email}</a></span>
                  <span className="flex items-center gap-1"><FaGlobe /> <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</a></span>
                  <span className="flex items-center gap-1"><FaUserMd /> {clinic.surgeon}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 w-full">
                  {clinic.services && clinic.services.map((service, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{service}</span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapSync clinics={clinics} selectedClinicId={selectedClinicId} />
      </MapContainer>
    </div>
  );
};

export default ClinicMap;