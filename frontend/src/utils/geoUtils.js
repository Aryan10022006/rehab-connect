// Advanced geospatial utility functions using accurate algorithms
// Uses the Haversine formula for accurate distance calculation

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement ('km', 'mi', 'm')
 * @returns {number} Distance in specified unit
 */
export const calculateAccurateDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
  // Validate inputs
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  const R = unit === 'mi' ? 3959 : 6371; // Earth's radius in miles or kilometers
  
  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
            Math.cos(lat1Rad) * Math.cos(lat2Rad);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  let distance = R * c;
  
  // Convert to meters if requested
  if (unit === 'm') {
    distance = distance * 1000;
  }
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  
  // Normalize to 0-360 degrees
  return (bearing + 360) % 360;
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, etc.)
 */
export const getCompassDirection = (bearing) => {
  if (bearing === null || bearing === undefined) return '';
  
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
};

/**
 * Find nearby points within a radius
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {Array} points - Array of points with lat/lng properties
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered points with distance and bearing
 */
export const findNearbyPoints = (centerLat, centerLon, points, radiusKm = 10) => {
  if (!isValidCoordinate(centerLat, centerLon) || !Array.isArray(points)) {
    return [];
  }

  return points
    .map(point => {
      const distance = calculateAccurateDistance(
        centerLat, centerLon, 
        point.lat || point.latitude, 
        point.lng || point.longitude || point.long
      );
      
      const bearing = calculateBearing(
        centerLat, centerLon,
        point.lat || point.latitude,
        point.lng || point.longitude || point.long
      );

      return {
        ...point,
        distance,
        bearing,
        compassDirection: getCompassDirection(bearing)
      };
    })
    .filter(point => point.distance !== null && point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @param {string} unit - Preferred unit ('km', 'mi', 'm')
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'km') => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'Distance unavailable';
  }

  if (unit === 'mi') {
    distance = distance * 0.621371; // Convert km to miles
  } else if (unit === 'm' && distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }

  if (distance < 0.1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 1) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${distance.toFixed(1)}${unit === 'mi' ? 'mi' : 'km'}`;
  }
};

/**
 * Estimate travel time (walking/driving)
 * @param {number} distance - Distance in kilometers
 * @param {string} mode - Travel mode ('walking', 'driving', 'cycling')
 * @returns {string} Estimated time string
 */
export const estimateTravelTime = (distance, mode = 'driving') => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '';
  }

  const speeds = {
    walking: 5,    // 5 km/h
    cycling: 15,   // 15 km/h
    driving: 40    // 40 km/h (city average)
  };

  const speed = speeds[mode] || speeds.driving;
  const timeHours = distance / speed;
  const timeMinutes = Math.round(timeHours * 60);

  if (timeMinutes < 1) {
    return '< 1min';
  } else if (timeMinutes < 60) {
    return `${timeMinutes}min`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

/**
 * Get location bounds for a given center and radius
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounds object with north, south, east, west
 */
export const getBounds = (centerLat, centerLon, radiusKm) => {
  if (!isValidCoordinate(centerLat, centerLon)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const latRad = toRadians(centerLat);
  
  // Calculate offset in degrees
  const latOffset = (radiusKm / R) * (180 / Math.PI);
  const lonOffset = (radiusKm / R) * (180 / Math.PI) / Math.cos(latRad);

  return {
    north: centerLat + latOffset,
    south: centerLat - latOffset,
    east: centerLon + lonOffset,
    west: centerLon - lonOffset
  };
};

// Helper functions
const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);

const isValidCoordinate = (lat, lon) => {
  return typeof lat === 'number' && typeof lon === 'number' &&
         !isNaN(lat) && !isNaN(lon) &&
         lat >= -90 && lat <= 90 &&
         lon >= -180 && lon <= 180;
};

/**
 * Advanced distance calculation with multiple algorithms
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} algorithm - Algorithm to use ('haversine', 'vincenty')
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceAdvanced = (lat1, lon1, lat2, lon2, algorithm = 'haversine') => {
  if (algorithm === 'vincenty') {
    return calculateVincentyDistance(lat1, lon1, lat2, lon2);
  }
  return calculateAccurateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Vincenty's formula for more accurate distance calculation
 * More accurate than Haversine for longer distances
 */
const calculateVincentyDistance = (lat1, lon1, lat2, lon2) => {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  const a = 6378137; // WGS84 major axis
  const b = 6356752.314245; // WGS84 minor axis
  const f = 1 / 298.257223563; // WGS84 flattening

  const L = toRadians(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(toRadians(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(toRadians(lat2)));
  
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP;
  let iterLimit = 100;
  let cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    
    sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
                         (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * 
                         (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    
    if (sinSigma === 0) return 0; // Co-incident points
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    
    const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // Equatorial line
    
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha *
             (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * 
             (-1 + 2 * cos2SigmaM * cos2SigmaM)));
             
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) {
    return calculateAccurateDistance(lat1, lon1, lat2, lon2); // Fallback to Haversine
  }

  const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  
  const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * 
                     (-1 + 2 * cos2SigmaM * cos2SigmaM) -
                     B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * 
                     (-3 + 4 * cos2SigmaM * cos2SigmaM)));

  const distance = b * A * (sigma - deltaSigma);
  
  return Math.round(distance / 1000 * 100) / 100; // Convert to km and round
};

const geoUtilsExport = {
  calculateAccurateDistance,
  calculateBearing,
  getCompassDirection,
  findNearbyPoints,
  formatDistance,
  estimateTravelTime,
  getBounds,
  calculateDistanceAdvanced
};

export default geoUtilsExport;
