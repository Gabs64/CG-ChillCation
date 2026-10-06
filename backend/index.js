import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint for Railway deployment monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CG Chillcation Booking System',
    version: 'Alpha-Test v1.1',
    deployment: 'Railway'
  });
});

// Initialize database seed & start Express server
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` CG CHILLCATION API SERVER - Alpha-Test v1.1`);
    console.log(` Ready for Railway Deployment`);
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}).catch((err) => {
  console.error('Failed to initialize database seed:', err);
});
