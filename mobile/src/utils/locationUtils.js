import * as Location from 'expo-location';

/**
 * Convert latitude and longitude to a readable address
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Human-readable address
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      
      // Build a readable address string
      const parts = [];
      
      if (address.name) parts.push(address.name);
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);
      if (address.postalCode) parts.push(address.postalCode);
      
      return parts.filter(p => p).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Fallback to coordinates if geocoding fails
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Get current location with address
 * @returns {Promise<{latitude, longitude, address}>}
 */
export const getCurrentLocationWithAddress = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const address = await getAddressFromCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      address,
    };
  } catch (error) {
    console.error('Error getting location with address:', error);
    throw error;
  }
};
