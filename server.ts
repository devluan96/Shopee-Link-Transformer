import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Firebase Admin
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}
const db = getFirestore();

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const PORT = 3000;

async function startServer() {
  const app = express();

  // A. ENSURE CORS IS AT THE VERY TOP
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }));

  // B. TRUST PROXY FOR CLOUD ENV
  app.set('trust proxy', 1);

  // C. DEBUG LOGGING
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // D. CRITICAL API HANDLERS (DEFINED DIRECTLY ON APP)
  
  // Health check - Absolute verification
  app.get('/api/health', (req, res) => {
    console.log('--- API Health Accessed ---');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ 
      status: 'ok', 
      ok: true, 
      msg: 'Server is receiving and responding to API calls' 
    }));
  });

  // Video Upload - Defined with Multer inline
  app.post('/api/v1/upload-video', upload.single('file'), async (req: any, res) => {
    console.log(`--- Upload API Hit: ${req.file?.originalname || 'No file'} ---`);
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided in body' });
      
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'hotsnew' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Stream Error:', error);
            return res.status(500).json({ error: error.message });
          }
          console.log('Cloudinary Upload Success:', result?.secure_url);
          res.json({ secure_url: result?.secure_url });
        }
      );
      stream.end(req.file.buffer);
    } catch (e: any) {
      console.error('Server Upload Catch-all Error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // E. SECONDARY MIDDLEWARES (After critical routes to avoid interference)
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // F. OTHER FUNCTIONAL API ROUTES
  app.post('/api/v1/convert', async (req, res) => {
    try {
      const { url, userId, customTitle, customDescription, customImageUrl, videoUrl } = req.body;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const shortCode = nanoid(8);
      await db.collection('links').add({
        originalUrl: url, shortCode, userId, customTitle, customDescription, customImageUrl, videoUrl,
        createdAt: FieldValue.serverTimestamp(),
      });
      res.json({ converted_url: `https://hotsnew.click/s/${shortCode}`, shortCode });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/v1/user/stats', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const snap = await db.collection('links').where('userId', '==', userId).get();
      res.json({ totalLinks: snap.size, totalClicks: 0 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/user/analytics', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const linksSnap = await db.collection('links').where('userId', '==', userId).get();
      const linkIds = linksSnap.docs.map(d => d.id);
      const linkMap = Object.fromEntries(linksSnap.docs.map(d => [d.id, d.data().customTitle || d.data().shortCode]));

      if (linkIds.length === 0) return res.json({ history: [], topLinks: [] });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Batch linkIds for 'in' query (Firestore limit 30)
      const targetLinkIds = linkIds.slice(0, 30);
      const clicksSnap = await db.collection('clicks')
        .where('linkId', 'in', targetLinkIds)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const historyMap: Record<string, number> = {};
      const linksStats: Record<string, number> = {};

      clicksSnap.docs.forEach(doc => {
        const data = doc.data();
        const date = data.timestamp.toDate().toISOString().split('T')[0];
        historyMap[date] = (historyMap[date] || 0) + 1;
        linksStats[data.linkId] = (linksStats[data.linkId] || 0) + 1;
      });

      const history = Object.entries(historyMap)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topLinks = Object.entries(linksStats)
        .map(([id, clicks]) => ({ id, clicks, title: linkMap[id] }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      res.json({ history, topLinks });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // G. REDIRECTS
  app.get('/s/:shortCode', async (req, res) => {
    try {
      const { shortCode } = req.params;
      const snap = await db.collection('links').where('shortCode', '==', shortCode).limit(1).get();
      if (snap.empty) return res.status(404).send('Not found');
      res.redirect(snap.docs[0].data().originalUrl);
    } catch (e) {
      res.status(500).send('Error');
    }
  });

  // H. API 404 FALLTHROUGH
  app.all('/api/*', (req, res) => {
    console.log(`[404 API] No match for: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: `API Route Not Found: ${req.method} ${req.url}`,
      diagnostics: { method: req.method, path: req.path, url: req.url }
    });
  });

  // I. VITE / SPA / STATIC (LAST PRIORITY)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> SERVER LISTENING ON PORT ${PORT} <<<`);
    console.log(`--- Ready to handle API and Web traffic ---`);
  });
}

startServer().catch(err => {
  console.error('FATAL SERVER STARTUP FAIL:', err);
  process.exit(1);
});
