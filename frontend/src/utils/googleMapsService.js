// Google Maps Distance Matrix API integration for accurate road distances
class GoogleMapsDistanceService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.service = null;
    this.isLoaded = false;
  }

  // Initialize Google Maps service
  async initialize() {
    if (this.isLoaded) return true;

    try {
      // Load Google Maps API if not already loaded
      if (!window.google) {
        await this.loadGoogleMapsAPI();
      }

      this.service = new window.google.maps.DistanceMatrixService();
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Maps service:', error);
      return false;
    }
  }

  // Load Google Maps API script
  loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=geometry`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Get accurate road distances for multiple destinations
  async getDistances(origin, destinations, mode = 'DRIVING') {
    try {
      await this.initialize();

      if (!this.service) {
        throw new Error('Google Maps service not available');
      }

      return new Promise((resolve, reject) => {
        this.service.getDistanceMatrix({
          origins: [origin],
          destinations: destinations,
          travelMode: window.google.maps.TravelMode[mode],
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK') {
            const results = response.rows[0].elements.map((element, index) => ({
              destination: destinations[index],
              distance: element.status === 'OK' ? {
                text: element.distance.text,
                value: element.distance.value / 1000 // Convert to km
              } : null,
              duration: element.status === 'OK' ? {
                text: element.duration.text,
                value: element.duration.value / 60 // Convert to minutes
              } : null,
              status: element.status
            }));
            resolve(results);
          } else {
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error getting distances:', error);
      throw error;
    }
  }

  // Get single distance between two points
  async getSingleDistance(origin, destination, mode = 'DRIVING') {
    try {
      const results = await this.getDistances(origin, [destination], mode);
      return results[0];
    } catch (error) {
      console.error('Error getting single distance:', error);
      return null;
    }
  }

  // Batch process clinics with distances
  async enrichClinicsWithDistances(userLocation, clinics, mode = 'DRIVING') {
    try {
      const origin = `${userLocation.lat},${userLocation.lng}`;
      const destinations = clinics.map(clinic => 
        `${clinic.lat},${clinic.lng || clinic.long}`
      );

      // Process in batches to avoid API limits (max 25 destinations per request)
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < destinations.length; i += batchSize) {
        batches.push({
          destinations: destinations.slice(i, i + batchSize),
          clinics: clinics.slice(i, i + batchSize)
        });
      }

      const enrichedClinics = [];
      
      for (const batch of batches) {
        try {
          const distances = await this.getDistances(origin, batch.destinations, mode);
          
          batch.clinics.forEach((clinic, index) => {
            const distanceData = distances[index];
            enrichedClinics.push({
              ...clinic,
              roadDistance: distanceData?.distance?.value || null,
              roadDistanceText: distanceData?.distance?.text || null,
              travelTime: distanceData?.duration?.value || null,
              travelTimeText: distanceData?.duration?.text || null,
              distanceStatus: distanceData?.status || 'UNKNOWN'
            });
          });

          // Add delay between batches to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn('Batch distance calculation failed:', error);
          // Fall back to original clinics for this batch
          enrichedClinics.push(...batch.clinics);
        }
      }

      return enrichedClinics;
    } catch (error) {
      console.error('Error enriching clinics with distances:', error);
      return clinics; // Return original clinics if enrichment fails
    }
  }
}

// Geocoding service for pincode to coordinates conversion
class GeocodingService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.cache = new Map(); // Cache results to reduce API calls
  }

  // Convert pincode to coordinates
  async pincodeToCoordinates(pincode) {
    // Check cache first
    const cacheKey = `pincode_${pincode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode},India&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address,
          place_id: data.results[0].place_id
        };
        
        // Cache the result
        this.cache.set(cacheKey, result);
        return result;
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Error geocoding pincode:', error);
      return null;
    }
  }

  // Get address from coordinates (reverse geocoding)
  async coordinatesToAddress(lat, lng) {
    const cacheKey = `coords_${lat}_${lng}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = {
          formatted_address: data.results[0].formatted_address,
          address_components: data.results[0].address_components,
          place_id: data.results[0].place_id
        };
        
        this.cache.set(cacheKey, result);
        return result;
      } else {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Extract pincode from address components
  extractPincode(addressComponents) {
    const pincodeComponent = addressComponents.find(
      component => component.types.includes('postal_code')
    );
    return pincodeComponent ? pincodeComponent.long_name : null;
  }
}

// Export singleton instances
export const googleMapsDistance = new GoogleMapsDistanceService();
export const geocodingService = new GeocodingService();

// Utility functions
export const formatTravelTime = (minutes) => {
  if (!minutes) return '';
  if (minutes < 1) return '< 1min';
  if (minutes < 60) return `${Math.round(minutes)}min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export const formatRoadDistance = (km) => {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

// Export class for direct import
export { GoogleMapsDistanceService };

const googleMapsExport = {
  GoogleMapsDistanceService,
  googleMapsDistance,
  geocodingService,
  formatTravelTime,
  formatRoadDistance
};

export default googleMapsExport;
