import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const PORT = 3000;
const app = express();

// A. MIDDLEWARES
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.set('trust proxy', 1);
app.set('etag', false);

// B. CACHE-BUSTING & LOGGING
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${req.path}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// C. API ROUTES (Synchronous registration for Vercel)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', msg: 'Server is healthy' });
});

app.post('/api/v1/upload-video', upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'hotsnew' },
      (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ secure_url: result?.secure_url });
      }
    );
    stream.end(req.file.buffer);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/upload-avatar', upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const fileExt = req.file.originalname.split('.').pop() || 'png';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) throw error;
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    res.json({ secure_url: publicData.publicUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/user/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/user/profile/update', async (req, res) => {
  try {
    const { userId, email, full_name, avatar_url } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/convert', async (req, res) => {
  try {
    const { url, userId, customTitle, customDescription, customImageUrl, videoUrl } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const shortCode = nanoid(8);
    const { data, error } = await supabase.from('links').insert({
      original_url: url,
      short_code: shortCode,
      user_id: userId,
      custom_title: customTitle,
      custom_description: customDescription,
      custom_image_url: customImageUrl,
      video_url: videoUrl
    }).select().single();
    if (error) throw error;
    res.json({ converted_url: `https://hotsnew.click/s/${shortCode}`, shortCode });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/v1/user/links', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase.from('links').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/user/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { count, error } = await supabase.from('links').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) throw error;
    res.json({ totalLinks: count || 0, totalClicks: 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/user/analytics', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data: links } = await supabase.from('links').select('id, custom_title, short_code').eq('user_id', userId);
    if (!links || links.length === 0) return res.json({ history: [], topLinks: [] });
    const linkIds = links.map(d => d.id);
    const linkMap = Object.fromEntries(links.map(d => [d.id, d.custom_title || d.short_code]));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: clicks } = await supabase.from('clicks').select('link_id, created_at').in('link_id', linkIds.slice(0, 50)).gte('created_at', thirtyDaysAgo.toISOString());
    const historyMap: any = {};
    const linksStats: any = {};
    if (clicks) {
      clicks.forEach((c: any) => {
        const date = c.created_at.split('T')[0];
        historyMap[date] = (historyMap[date] || 0) + 1;
        linksStats[c.link_id] = (linksStats[c.link_id] || 0) + 1;
      });
    }
    const history = Object.entries(historyMap).map(([date, clicks]) => ({ date, clicks })).sort((a, b) => a.date.localeCompare(b.date));
    const topLinks = Object.entries(linksStats).map(([id, clicks]) => ({ id, clicks, title: linkMap[id] })).sort((a: any, b: any) => b.clicks - a.clicks).slice(0, 5);
    res.json({ history, topLinks });
  } catch (e: any) {
    res.json({ history: [], topLinks: [] });
  }
});

app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId) return res.status(400).json({ error: 'Missing adminId' });
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/admin/users/:targetUid/approve', async (req, res) => {
  try {
    const { targetUid } = req.params;
    const { isApproved } = req.body;
    const { error } = await supabase.from('profiles').update({ status: isApproved ? 'approved' : 'pending' }).eq('id', targetUid);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/s/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { data: link } = await supabase.from('links').select('*').eq('short_code', shortCode).single();
    if (!link) return res.status(404).send('Not found');
    supabase.from('clicks').insert({ link_id: link.id, user_agent: req.headers['user-agent'], ip: req.ip }).then();
    res.redirect(link.original_url);
  } catch (e) {
    res.status(500).send('Error');
  }
});

// D. FALLBACKS
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// E. LOCAL SERVER START & VITE MIDDLEWARE
async function startLocalServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startLocalServer().catch(console.error);
}

export default app;
