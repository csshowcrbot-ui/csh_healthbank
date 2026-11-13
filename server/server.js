import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import treeRoutes from './routes/tree.js';
import redemptionRoutes from './routes/redemption.js';
import integrationsRoutes from './routes/integrations.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import { attachUser } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(attachUser);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tree', treeRoutes);
app.use('/api/v1/redemption', redemptionRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/tasks', integrationsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'CSH-HealthBank',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend if built
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, () => {
  console.log(`[CSH-HealthBank] Backend API running at http://localhost:${PORT}`);
  if (fs.existsSync(distPath)) {
    console.log(`[CSH-HealthBank] Web App available at http://localhost:${PORT}`);
  }
});

// Keep event loop active
setInterval(() => {}, 1000 * 60 * 60);

export default app;
