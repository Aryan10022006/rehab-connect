// Professional distance calculation and management service
class DistanceCalculationService {
  constructor() {
    this.cache = new Map();
    this.earthRadius = 6371; // Earth's radius in kilometers
  }

  // Generate cache key for distance calculations
  generateCacheKey(lat1, lng1, lat2, lng2) {
    const key = `${lat1.toFixed(6)}-${lng1.toFixed(6)}-${lat2.toFixed(6)}-${lng2.toFixed(6)}`;
    return key;
  }

  // Haversine formula for accurate distance calculation
  calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    // Validate inputs
    if (!this.isValidCoordinate(lat1) || !this.isValidCoordinate(lng1) ||
        !this.isValidCoordinate(lat2) || !this.isValidCoordinate(lng2)) {
      return null;
    }

    const cacheKey = this.generateCacheKey(lat1, lng1, lat2, lng2);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.earthRadius * c;
    
    // Round to 2 decimal places and cache
    const roundedDistance = Math.round(distance * 100) / 100;
    this.cache.set(cacheKey, roundedDistance);
    
    return roundedDistance;
  }

  // Vincenty formula for higher precision (optional)
  calculateVincentyDistance(lat1, lng1, lat2, lng2) {
    if (!this.isValidCoordinate(lat1) || !this.isValidCoordinate(lng1) ||
        !this.isValidCoordinate(lat2) || !this.isValidCoordinate(lng2)) {
      return null;
    }

    const a = 6378137; // WGS-84 semi-major axis
    const b = 6356752.314245; // WGS-84 semi-minor axis
    const f = 1 / 298.257223563; // WGS-84 flattening

    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    const deltaLngRad = this.toRadians(lng2 - lng1);

    const U1 = Math.atan((1 - f) * Math.tan(lat1Rad));
    const U2 = Math.atan((1 - f) * Math.tan(lat2Rad));
    const sinU1 = Math.sin(U1);
    const cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2);
    const cosU2 = Math.cos(U2);

    let lambda = deltaLngRad;
    let lambdaP;
    let iterLimit = 100;
    let cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;

    do {
      const sinLambda = Math.sin(lambda);
      const cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      
      if (sinSigma === 0) return 0;
      
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      
      if (isNaN(cos2SigmaM)) cos2SigmaM = 0;
      
      const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = deltaLngRad + (1 - C) * f * sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (iterLimit === 0) {
      // Fallback to Haversine
      return this.calculateHaversineDistance(lat1, lng1, lat2, lng2);
    }

    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));

    const s = b * A * (sigma - deltaSigma);
    return Math.round(s / 1000 * 100) / 100; // Convert to km and round
  }

  // Main distance calculation method (uses Haversine by default)
  calculateDistance(lat1, lng1, lat2, lng2, method = 'haversine') {
    if (method === 'vincenty') {
      return this.calculateVincentyDistance(lat1, lng1, lat2, lng2);
    }
    return this.calculateHaversineDistance(lat1, lng1, lat2, lng2);
  }

  // Calculate distances from one point to multiple destinations
  calculateDistancesToMultiple(originLat, originLng, destinations) {
    return destinations.map(destination => {
      const destLat = destination.lat;
      const destLng = destination.lng || destination.long;
      
      const distance = this.calculateDistance(originLat, originLng, destLat, destLng);
      
      return {
        ...destination,
        distance,
        distanceText: this.formatDistance(distance)
      };
    }).filter(dest => dest.distance !== null);
  }

  // Format distance for display
  formatDistance(km) {
    if (km === null || isNaN(km)) return 'N/A';
    
    if (km < 1) {
      const meters = Math.round(km * 1000);
      return `${meters}m`;
    }
    
    if (km < 10) {
      return `${km.toFixed(1)}km`;
    }
    
    return `${Math.round(km)}km`;
  }

  // Validate coordinate values
  isValidCoordinate(coord) {
    return typeof coord === 'number' && 
           !isNaN(coord) && 
           isFinite(coord) &&
           coord >= -180 && 
           coord <= 180;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Estimate travel time based on distance (rough approximation)
  estimateTravelTime(distanceKm, mode = 'driving') {
    if (!distanceKm || isNaN(distanceKm)) return null;

    const speeds = {
      walking: 5, // km/h
      cycling: 15, // km/h
      driving: 40, // km/h (urban average)
      transit: 25 // km/h (public transport)
    };

    const speed = speeds[mode] || speeds.driving;
    const timeHours = distanceKm / speed;
    const timeMinutes = timeHours * 60;

    return Math.round(timeMinutes);
  }

  // Format travel time for display
  formatTravelTime(minutes) {
    if (!minutes || isNaN(minutes)) return 'N/A';
    
    if (minutes < 1) return '< 1min';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }

  // Get bounding box for geographic area
  getBoundingBox(centerLat, centerLng, radiusKm) {
    const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111km
    const lngDelta = radiusKm / (111 * Math.cos(this.toRadians(centerLat)));

    return {
      minLat: centerLat - latDelta,
      maxLat: centerLat + latDelta,
      minLng: centerLng - lngDelta,
      maxLng: centerLng + lngDelta
    };
  }

  // Clear cache (for memory management)
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000 // You can implement LRU cache if needed
    };
  }
}

// Export singleton instance
export const distanceService = new DistanceCalculationService();

// Export the class for direct instantiation if needed
export { DistanceCalculationService };

// Export convenience functions
export const calculateAccurateDistance = (lat1, lng1, lat2, lng2) => {
  return distanceService.calculateDistance(lat1, lng1, lat2, lng2);
};

export const formatDistance = (km) => {
  return distanceService.formatDistance(km);
};

export const estimateTravelTime = (distanceKm, mode = 'driving') => {
  return distanceService.estimateTravelTime(distanceKm, mode);
};

export const formatTravelTime = (minutes) => {
  return distanceService.formatTravelTime(minutes);
};

export default distanceService;
