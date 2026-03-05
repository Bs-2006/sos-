// Simple in-memory storage for user data
// In production, use AsyncStorage or SecureStore

let currentUser = {
  role: null,
  email: null,
  name: null,
};

export const setUserRole = (role) => {
  currentUser.role = role;
};

export const getUserRole = () => {
  return currentUser.role;
};

export const setUserData = (data) => {
  currentUser = { ...currentUser, ...data };
};

export const getUserData = () => {
  return currentUser;
};

export const clearUserData = () => {
  currentUser = {
    role: null,
    email: null,
    name: null,
  };
};

// Role-based dashboard mapping
export const getDashboardForRole = (role) => {
  if (role === 'superadmin') {
    return 'SuperAdminDashboard';
  }
  return 'HomeScreen';
};

// Role-based user info
export const getRoleInfo = (role) => {
  const roleInfo = {
    patient: {
      icon: 'account',
      color: '#1963eb',
      label: 'Patient',
    },
    superadmin: {
      icon: 'shield-crown',
      color: '#fbbf24',
      label: 'Super Admin',
    },
  };
  return roleInfo[role] || roleInfo.patient;
};
