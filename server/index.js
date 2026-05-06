const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missingEnvs = requiredEnvs.filter(key => !process.env[key]);
if (missingEnvs.length) {
  console.error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const bookingsRoutes = require('./routes/bookings');
const photosRoutes = require('./routes/photos');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve your existing frontend (index.html, style.css, script.js, nails/ folder)
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/photos', photosRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'joynailart API' });
});

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`joynailart server running on port ${PORT}`);
});
