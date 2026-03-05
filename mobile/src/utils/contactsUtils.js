import * as Contacts from 'expo-contacts';

/**
 * Request permission to access device contacts
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};

/**
 * Get all contacts from device
 * @returns {Promise<Array>} Array of contacts with name and phone
 */
export const getDeviceContacts = async () => {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.FirstName, Contacts.Fields.LastName],
    });

    if (data.length > 0) {
      // Filter contacts that have phone numbers
      return data
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.id,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
          phone: contact.phoneNumbers[0].number,
          firstName: contact.firstName,
          lastName: contact.lastName,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return [];
  } catch (error) {
    console.error('Error fetching device contacts:', error);
    return [];
  }
};

/**
 * Get top N contacts from device (most recently used or alphabetically first)
 * @param {number} count - Number of contacts to return
 * @returns {Promise<Array>} Array of top contacts
 */
export const getTopDeviceContacts = async (count = 3) => {
  try {
    const allContacts = await getDeviceContacts();
    return allContacts.slice(0, count);
  } catch (error) {
    console.error('Error getting top contacts:', error);
    return [];
  }
};

/**
 * Format phone number to standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's an Indian number, ensure it starts with +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  return phone;
};
