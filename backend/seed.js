const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const Medicine = require('./models/Medicine');
const Ambulance = require('./models/Ambulance');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});
    await Medicine.deleteMany({});
    await Ambulance.deleteMany({});

    // Create sample users with test credentials from environment
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    const users = await User.create([
      { 
        email: 'patient@life.app', 
        password: testPassword,
        name: 'Sagar', 
        role: 'patient', 
        bloodType: 'O+', 
        age: 28,
        phone: '+1234567890',
        isVerified: true,
        verificationStatus: 'verified'
      },
      { 
        email: 'doctor@life.app', 
        password: testPassword,
        name: 'Dr. Bendapparao', 
        role: 'doctor',
        phone: '+1234567891',
        qualification: 'MBBS, MD',
        nmcCode: 'NMC12345',
        stateMedicalCouncil: 'Andhra Pradesh Medical Council',
        isVerified: true,
        verificationStatus: 'verified',
        verifiedAt: new Date()
      },
      { 
        email: 'hospital@life.app', 
        password: testPassword,
        name: 'Bhimavaram Hospitals', 
        role: 'hospital',
        phone: '+1234567892',
        isVerified: true,
        verificationStatus: 'verified'
      },
      { 
        email: 'superadmin@life.app', 
        password: testPassword,
        name: 'Team X', 
        role: 'superadmin',
        phone: '+1234567893',
        isVerified: true,
        verificationStatus: 'verified'
      }
    ]);

    // Create sample doctors
    await Doctor.create([
      {
        userId: users[1]._id,
        name: 'Dr. Sarah James',
        specialty: 'Cardiologist',
        category: 'cardio',
        rating: 4.9,
        available: true,
        consultationFee: 50,
        location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
        experience: 15,
        qualifications: ['MD', 'FACC']
      },
      {
        userId: users[1]._id,
        name: 'Dr. Michael Chen',
        specialty: 'Dermatologist',
        category: 'skin',
        rating: 4.8,
        available: true,
        consultationFee: 45,
        location: { type: 'Point', coordinates: [-73.945242, 40.735610] },
        experience: 10
      },
      {
        userId: users[1]._id,
        name: 'Dr. Emily Williams',
        specialty: 'Neurologist',
        category: 'neurology',
        rating: 4.9,
        available: false,
        consultationFee: 60,
        location: { type: 'Point', coordinates: [-73.925242, 40.725610] },
        experience: 20
      }
    ]);

    // Create sample hospitals with comprehensive data
    const hospitals = await Hospital.create([
      {
        name: 'City General Hospital',
        location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
        phone: '044-12345678',
        email: 'info@cityhospital.com',
        address: '123 Main Street, Downtown',
        rating: 4.5,
        beds: 250,
        availableBeds: 45,
        emergency: true,
        icu: true,
        icuBeds: 30,
        availableICUBeds: 8,
        bloodBank: [
          { type: 'O+', units: 24 },
          { type: 'A-', units: 3 },
          { type: 'B+', units: 15 },
          { type: 'AB+', units: 5 }
        ],
        facilities: ['ICU', 'Emergency', 'Surgery', 'Lab', 'Trauma Center', 'Imaging'],
        specializations: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency', 'Trauma'],
        ambulances: 5,
        averageResponseTime: 8,
        acceptingEmergencies: true
      },
      {
        name: 'St. Mary Medical Center',
        location: { type: 'Point', coordinates: [-73.945242, 40.735610] },
        phone: '044-98765432',
        email: 'info@stmary.com',
        address: '456 Oak Avenue, Midtown',
        rating: 4.7,
        beds: 180,
        availableBeds: 32,
        emergency: true,
        icu: true,
        icuBeds: 20,
        availableICUBeds: 5,
        bloodBank: [
          { type: 'O+', units: 18 },
          { type: 'A+', units: 12 },
          { type: 'B+', units: 10 }
        ],
        facilities: ['Emergency', 'Cardiology', 'Pediatrics', 'Lab', 'ICU'],
        specializations: ['Cardiology', 'Pediatrics', 'Emergency', 'Pulmonology'],
        ambulances: 4,
        averageResponseTime: 6,
        acceptingEmergencies: true
      },
      {
        name: 'Apollo Clinic',
        location: { type: 'Point', coordinates: [-73.925242, 40.720610] },
        phone: '044-55555555',
        email: 'info@apolloclinic.com',
        address: '789 Pine Road, Uptown',
        rating: 4.8,
        beds: 120,
        availableBeds: 28,
        emergency: true,
        icu: true,
        icuBeds: 15,
        availableICUBeds: 4,
        bloodBank: [
          { type: 'O+', units: 20 },
          { type: 'A+', units: 15 }
        ],
        facilities: ['Emergency', 'Surgery', 'Lab', 'ICU', 'Orthopedics'],
        specializations: ['Orthopedics', 'Neurology', 'Emergency', 'Trauma'],
        ambulances: 3,
        averageResponseTime: 7,
        acceptingEmergencies: true
      },
      {
        name: 'Emergency Care Center',
        location: { type: 'Point', coordinates: [-73.915242, 40.740610] },
        phone: '044-11111111',
        email: 'info@emergencycare.com',
        address: '321 Elm Street, Eastside',
        rating: 4.3,
        beds: 100,
        availableBeds: 22,
        emergency: true,
        icu: false,
        icuBeds: 0,
        availableICUBeds: 0,
        bloodBank: [
          { type: 'O+', units: 15 },
          { type: 'O-', units: 5 }
        ],
        facilities: ['Emergency', 'Lab', 'X-Ray', 'Trauma'],
        specializations: ['Emergency', 'Trauma', 'Toxicology'],
        ambulances: 2,
        averageResponseTime: 5,
        acceptingEmergencies: true
      },
      {
        name: 'Heart Care Specialty Hospital',
        location: { type: 'Point', coordinates: [-73.955242, 40.745610] },
        phone: '044-22222222',
        email: 'info@heartcare.com',
        address: '654 Maple Drive, Westside',
        rating: 4.9,
        beds: 80,
        availableBeds: 15,
        emergency: true,
        icu: true,
        icuBeds: 25,
        availableICUBeds: 6,
        bloodBank: [
          { type: 'O+', units: 25 },
          { type: 'A+', units: 20 },
          { type: 'B+', units: 15 }
        ],
        facilities: ['Emergency', 'Cardiology', 'ICU', 'Cath Lab', 'Surgery'],
        specializations: ['Cardiology', 'Emergency', 'Pulmonology'],
        ambulances: 4,
        averageResponseTime: 9,
        acceptingEmergencies: true
      }
    ]);

    // Create sample medicines
    await Medicine.create([
      {
        name: 'Paracetamol 500mg',
        type: 'Tablet',
        category: 'Pain Relief',
        dosage: '1 tab / 6 hrs',
        prices: [
          { shop: 'MediCare Plus', price: 5, available: true },
          { shop: 'Life Pharma', price: 5.5, available: true }
        ]
      },
      {
        name: 'Amoxicillin 500mg',
        type: 'Capsule',
        category: 'Antibiotics',
        dosage: '1 cap / 8 hrs',
        prices: [
          { shop: 'MediCare Plus', price: 12.5, available: true },
          { shop: 'Life Pharma', price: 14.2, available: true }
        ]
      },
      {
        name: 'Vitamin D3',
        type: 'Tablet',
        category: 'Supplements',
        dosage: '1 tab / day',
        prices: [
          { shop: 'HealthMart', price: 12, available: true }
        ]
      }
    ]);

    // Create sample ambulances
    await Ambulance.create([
      {
        vehiclePlate: 'AMB-9922',
        hospitalId: hospitals[0]._id,
        driverId: users[1]._id,
        status: 'available',
        location: { type: 'Point', coordinates: [-73.935242, 40.730610] }
      },
      {
        vehiclePlate: 'AMB-5544',
        hospitalId: hospitals[1]._id,
        status: 'available',
        location: { type: 'Point', coordinates: [-73.945242, 40.735610] }
      }
    ]);

    console.log('✓ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
