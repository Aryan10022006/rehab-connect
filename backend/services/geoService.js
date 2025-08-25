// Professional Geolocation Service
const geolib = require('geolib');

// Use native fetch if available (Node 18+), otherwise use node-fetch
const fetch = globalThis.fetch || require('node-fetch');

class GeoService {
  constructor() {
    this.cache = new Map();
    this.EARTH_RADIUS_KM = 6371;
  }

  // Haversine formula for precise distance calculation
  calculateDistance(point1, point2) {
    if (!this.isValidCoordinate(point1) || !this.isValidCoordinate(point2)) {
      return null;
    }

    try {
      // Use geolib for accuracy, fallback to haversine
      const distance = geolib.getDistance(
        { latitude: point1.lat, longitude: point1.lng },
        { latitude: point2.lat, longitude: point2.lng }
      );
      
      return distance / 1000; // Convert to kilometers
    } catch (error) {
      console.warn('Geolib failed, using haversine fallback:', error);
      return this.haversineDistance(point1, point2);
    }
  }

  // Manual haversine implementation as fallback
  haversineDistance(point1, point2) {
    const lat1Rad = this.toRadians(point1.lat);
    const lat2Rad = this.toRadians(point2.lat);
    const deltaLatRad = this.toRadians(point2.lat - point1.lat);
    const deltaLngRad = this.toRadians(point2.lng - point1.lng);

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  isValidCoordinate(point) {
    return point &&
           typeof point.lat === 'number' &&
           typeof point.lng === 'number' &&
           !isNaN(point.lat) &&
           !isNaN(point.lng) &&
           point.lat >= -90 &&
           point.lat <= 90 &&
           point.lng >= -180 &&
           point.lng <= 180;
  }

  // Filter clinics by distance with professional algorithms
  filterClinicsByRadius(clinics, userLocation, maxRadius = 20) {
    if (!this.isValidCoordinate(userLocation) || !Array.isArray(clinics)) {
      return [];
    }

    const results = [];
    
    for (const clinic of clinics) {
      const clinicLocation = {
        lat: parseFloat(clinic.lat || clinic.latitude),
        lng: parseFloat(clinic.long || clinic.longitude || clinic.lng)
      };

      if (!this.isValidCoordinate(clinicLocation)) {
        continue; // Skip clinics without valid coordinates
      }

      const distance = this.calculateDistance(userLocation, clinicLocation);
      
      if (distance !== null && distance <= maxRadius) {
        results.push({
          ...clinic,
          calculatedDistance: distance,
          distanceText: this.formatDistance(distance)
        });
      }
    }

    // Sort by distance (closest first)
    return results.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }

  // Professional distance formatting
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  // Get default visible clinics for free users (professional algorithm)
  getDefaultVisibleClinics(clinics, userLocation, isPremium = false) {
    if (!this.isValidCoordinate(userLocation) || !Array.isArray(clinics)) {
      return { visible: clinics.slice(0, 2), premium: clinics.slice(2), all: clinics };
    }

    // Get all clinics within 20km, sorted by distance
    const radiusClinics = this.filterClinicsByRadius(clinics, userLocation, 20);
    
    if (isPremium) {
      return {
        visible: radiusClinics,
        premium: [],
        all: radiusClinics
      };
    }

    // For free users: show 2 clinics - one nearby (if available) and one distant
    const visible = [];
    const nearby = radiusClinics.filter(c => c.calculatedDistance <= 1);
    const distant = radiusClinics.filter(c => c.calculatedDistance > 5);
    
    // Add one nearby clinic
    if (nearby.length > 0) {
      visible.push(nearby[0]);
    }

    // Add one distant clinic (to encourage premium upgrade)
    if (distant.length > 0) {
      visible.push(distant[distant.length - 1]); // Take the farthest
    }

    // If we don't have 2 yet, add from remaining
    const remaining = radiusClinics.filter(c => 
      !visible.some(v => v.id === c.id)
    );
    
    while (visible.length < 2 && remaining.length > 0) {
      visible.push(remaining.shift());
    }

    return {
      visible: visible,
      premium: remaining,
      all: radiusClinics
    };
  }

  // Geocoding helpers
  async geocodeAddress(address) {
    const cacheKey = `geocode:${address}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Using OpenStreetMap Nominatim (free)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RehabConnect/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
        
        this.cache.set(cacheKey, result);
        
        // Auto-cleanup cache after 1 hour
        setTimeout(() => this.cache.delete(cacheKey), 3600000);
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new GeoService();
