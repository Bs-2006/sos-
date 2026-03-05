const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/ambulances', require('./routes/ambulances'));
app.use('/api/users', require('./routes/users'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/emergency', require('./routes/emergencyWithHospitals'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/health-assessments', require('./routes/health-assessments'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeLink API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Server accessible at http://localhost:${PORT}`);
  console.log(`✓ Server accessible at http://10.239.103.96:${PORT}`);
});
