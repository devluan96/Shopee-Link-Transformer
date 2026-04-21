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

// 2. Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ CRITICAL: Supabase environment variables are missing!');
  console.log('Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const PORT = 3000;
const app = express();

// A. ENSURE CORS IS AT THE VERY TOP
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// NEW: Move body parsers to the top so API routes can read req.body
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// B. TRUST PROXY FOR CLOUD ENV
app.set('trust proxy', 1);
app.set('etag', false); // Tắt ETag để tránh phản hồi 304, buộc trả về 200 OK

// C. DEBUG LOGGING & NO-CACHE HEADERS
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Nếu là API, buộc không cho trình duyệt lưu cache
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
});

async function startServer() {

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

  // NEW: Reliable Server-side Avatar Upload to Supabase Storage
  app.post('/api/v1/upload-avatar', upload.single('file'), async (req: any, res) => {
    console.log(`--- Avatar Upload API Hit: ${req.file?.originalname || 'No file'} ---`);
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' });
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ error: 'Missing userId in body' });

      const fileExt = req.file.originalname.split('.').pop() || 'png';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      console.log(`📤 Uploading to Supabase via Server Role: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase Server Upload Error:', error);
        return res.status(500).json({ error: error.message });
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('✅ Server Upload Success:', publicData.publicUrl);
      res.json({ secure_url: publicData.publicUrl });
    } catch (e: any) {
      console.error('Fatal Avatar Store error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // NEW: Reliable Server-side Profile Update
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
    console.log('--- Profile Update API Hit ---');
    try {
      const { userId, email, full_name, avatar_url } = req.body;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      console.log(`📡 Updating profile for ${userId} (${email}) to:`, { full_name, avatar_url });

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

      if (error) {
        console.error('Supabase Server Profile Update Error:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('✅ Server Profile Update Success');
      res.json(data);
    } catch (e: any) {
      console.error('Fatal Profile Update error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // F. OTHER FUNCTIONAL API ROUTES
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

  app.get('/api/v1/user/stats', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      
      const { count, error } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

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

      // Fetch links
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('id, custom_title, short_code')
        .eq('user_id', userId);

      if (linksError) {
        console.warn('Analytics API: links fetch error:', linksError.message);
        return res.json({ history: [], topLinks: [] });
      }

      if (!links || links.length === 0) return res.json({ history: [], topLinks: [] });

      const linkIds = links.map(d => d.id);
      const linkMap = Object.fromEntries(links.map(d => [d.id, d.custom_title || d.short_code]));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch clicks (defensive against missing table)
      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('link_id, created_at')
        .in('link_id', linkIds.slice(0, 100))
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (clicksError) {
        console.warn('Analytics API: clicks fetch error (table might be missing):', clicksError.message);
        return res.json({ history: [], topLinks: [] });
      }

      const historyMap: Record<string, number> = {};
      const linksStats: Record<string, number> = {};

      if (clicks) {
        clicks.forEach(click => {
          const date = click.created_at.split('T')[0];
          historyMap[date] = (historyMap[date] || 0) + 1;
          linksStats[click.link_id] = (linksStats[click.link_id] || 0) + 1;
        });
      }

      const history = Object.entries(historyMap)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topLinks = Object.entries(linksStats)
        .map(([id, clicks]) => ({ id, clicks, title: linkMap[id] }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      res.json({ history, topLinks });
    } catch (e: any) {
      console.error('Fatal Analytics API Error:', e);
      res.json({ history: [], topLinks: [], error: e.message });
    }
  });

  app.get('/api/v1/user/links', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/admin/users', async (req, res) => {
    try {
      const { adminId } = req.query;
      if (!adminId) return res.status(400).json({ error: 'Missing adminId' });
      // In a real app, verify adminId is actually an admin
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
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
      const { error } = await supabase
        .from('profiles')
        .update({ status: isApproved ? 'approved' : 'pending' })
        .eq('id', targetUid);
      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // G. REDIRECTS
  app.get('/s/:shortCode', async (req, res) => {
    try {
      const { shortCode } = req.params;
      const { data: link, error } = await supabase
        .from('links')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (error || !link) return res.status(404).send('Not found');

      // Log click async
      supabase.from('clicks').insert({
        link_id: link.id,
        user_agent: req.headers['user-agent'],
        ip: req.ip
      }).then();

      res.redirect(link.original_url);
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
  
  // GLOBAL ERROR HANDLER
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('💥 GLOBAL SERVER ERROR:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`>>> SERVER LISTENING ON PORT ${PORT} <<<`);
      console.log(`--- Ready to handle API and Web traffic ---`);
    });
  }
}

startServer().catch(err => {
  console.error('FATAL SERVER STARTUP FAIL:', err);
  process.exit(1);
});

export default app;
