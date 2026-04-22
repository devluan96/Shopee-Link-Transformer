import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
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
const PORT = Number(process.env.PORT) || 3000;

try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch (err) {
  console.error('Cloudinary config error:', err);
}

let _supabaseClient: any = null;
const getSupabase = () => {
  if (!_supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) throw new Error('Supabase configuration missing on server');
    _supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return _supabaseClient;
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const app = express();

const ZALOPAY_APP_ID = Number(process.env.ZALOPAY_APP_ID || 0);
const ZALOPAY_KEY1 = process.env.ZALOPAY_KEY1 || '';
const ZALOPAY_KEY2 = process.env.ZALOPAY_KEY2 || '';
const ZALOPAY_API_BASE_URL = process.env.ZALOPAY_API_BASE_URL || 'https://sb-openapi.zalopay.vn';
const ZALOPAY_PREFERRED_PAYMENT_METHODS = (() => {
  try {
    return JSON.parse(process.env.ZALOPAY_PREFERRED_PAYMENT_METHODS || '["vietqr","domestic_card"]');
  } catch {
    return ['vietqr', 'domestic_card'];
  }
})();

const isSubscriptionActive = (profile: any) => {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  if (profile.subscription_status !== 'active' || !profile.subscription_expires_at) return false;
  return new Date(profile.subscription_expires_at).getTime() > Date.now();
};

const computeSubscriptionDates = (plan: 'monthly' | 'yearly', baseDate?: Date) => {
  const startedAt = baseDate ? new Date(baseDate) : new Date();
  const expiresAt = new Date(startedAt);
  if (plan === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);
  return { startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() };
};

const getBaseUrl = (req: express.Request) => {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
};

const normalizeExpiredProfile = async (supabase: any, profile: any) => {
  if (!profile || profile.role === 'admin') return profile;
  if (profile.subscription_status === 'active' && profile.subscription_expires_at) {
    const expired = new Date(profile.subscription_expires_at).getTime() <= Date.now();
    if (expired) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  }
  return profile;
};

const getProfileById = async (supabase: any, userId?: string) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return normalizeExpiredProfile(supabase, data);
};

const isAdminRequest = async (supabase: any, adminId?: string) => {
  const profile = await getProfileById(supabase, adminId);
  return profile?.role === 'admin';
};

const hmacSha256 = (key: string, data: string) => crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');

const formatVietnamDatePrefix = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const year = parts.find((part) => part.type === 'year')?.value || '00';
  return `${year}${month}${day}`;
};

const zalopayCreateOrder = async (payload: URLSearchParams) => {
  const response = await fetch(`${ZALOPAY_API_BASE_URL}/v2/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.return_message || 'ZaloPay create order failed');
  return data;
};

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.set('trust proxy', 1);
app.set('etag', false);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    msg: 'Health Check Success',
    serverInfo: {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      hasKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY),
      hasZaloPay: !!(ZALOPAY_APP_ID && ZALOPAY_KEY1 && ZALOPAY_KEY2),
    }
  });
});

app.post('/api/v1/billing/zalopay/callback', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, mac } = req.body || {};
    if (!data || !mac) return res.status(400).json({ return_code: 2, return_message: 'Invalid' });

    const expectedMac = hmacSha256(ZALOPAY_KEY2, data);
    if (expectedMac !== mac) {
      return res.json({ return_code: 2, return_message: 'Invalid' });
    }

    const parsed = JSON.parse(data);
    const embedData = parsed.embed_data ? JSON.parse(parsed.embed_data) : {};
    const userId = embedData.userId || null;
    const plan = embedData.plan as 'monthly' | 'yearly' | undefined;

    if (!userId || !plan) {
      return res.json({ return_code: 1, return_message: 'Success' });
    }

    const baseDate = parsed.server_time ? new Date(parsed.server_time) : new Date();
    const { startedAt, expiresAt } = computeSubscriptionDates(plan, baseDate);

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_started_at: startedAt,
        subscription_expires_at: expiresAt,
        subscription_requested_plan: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    res.json({ return_code: 1, return_message: 'Success' });
  } catch (e: any) {
    res.json({ return_code: 0, return_message: e.message });
  }
});

app.post('/api/v1/upload-video', upload.single('file'), async (req: any, res) => {
  try {
    const supabase = getSupabase();
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const profile = await getProfileById(supabase, userId);
    if (!isSubscriptionActive(profile)) return res.status(403).json({ error: 'Subscription required' });

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
    const supabase = getSupabase();
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const fileExt = req.file.originalname.split('.').pop() || 'png';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, req.file.buffer, {
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
    const supabase = getSupabase();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const profile = await getProfileById(supabase, String(userId));
    res.json(profile || { id: userId, is_new: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

app.post('/api/v1/user/profile/update', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { userId, email, full_name, avatar_url } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, full_name, avatar_url, updated_at: new Date().toISOString() })
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/billing/zalopay/create-order', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { userId, plan } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!['monthly', 'yearly'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    if (!(ZALOPAY_APP_ID && ZALOPAY_KEY1 && ZALOPAY_KEY2)) return res.status(500).json({ error: 'ZaloPay is not configured' });

    const profile = await getProfileById(supabase, userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (profile.status !== 'approved' && profile.role !== 'admin') {
      return res.status(403).json({ error: 'User is not approved' });
    }
    if (isSubscriptionActive(profile)) {
      return res.status(400).json({ error: 'Subscription already active' });
    }

    const amount = plan === 'monthly' ? 299000 : 2490000;
    const appTransId = `${formatVietnamDatePrefix()}_${nanoid(10)}`;
    const baseUrl = getBaseUrl(req);
    const embedData = JSON.stringify({
      redirecturl: `${baseUrl}?checkout=success&provider=zalopay&plan=${plan}`,
      userId,
      plan,
      preferred_payment_method: ZALOPAY_PREFERRED_PAYMENT_METHODS,
    });
    const item = JSON.stringify([{ name: `HotsNew ${plan === 'monthly' ? 'Goi thang' : 'Goi nam'}`, quantity: 1, price: amount }]);
    const appTime = Date.now();
    const hmacInput = `${ZALOPAY_APP_ID}|${appTransId}|${userId}|${amount}|${appTime}|${embedData}|${item}`;
    const mac = hmacSha256(ZALOPAY_KEY1, hmacInput);

    const params = new URLSearchParams();
    params.set('app_id', String(ZALOPAY_APP_ID));
    params.set('app_user', userId);
    params.set('app_trans_id', appTransId);
    params.set('app_time', String(appTime));
    params.set('amount', String(amount));
    params.set('description', `Thanh toan ${plan === 'monthly' ? 'goi thang' : 'goi nam'} cho ${profile.email || userId}`);
    params.set('callback_url', `${baseUrl}/api/v1/billing/zalopay/callback`);
    params.set('item', item);
    params.set('embed_data', embedData);
    params.set('bank_code', '');
    params.set('expire_duration_seconds', String(15 * 60));
    params.set('mac', mac);

    const result = await zalopayCreateOrder(params);
    if (result.return_code !== 1 && result.return_code !== 2 && !result.order_url) {
      throw new Error(result.return_message || 'ZaloPay create order failed');
    }

    await supabase.from('profiles').update({
      subscription_requested_plan: plan,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    res.json({
      orderUrl: result.order_url,
      qrCode: result.qr_code,
      appTransId,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/convert', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { url, userId, customTitle, customDescription, customImageUrl, videoUrl } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await getProfileById(supabase, userId);
    if (!profile || profile.status !== 'approved') return res.status(403).json({ error: 'User is not approved' });
    if (!isSubscriptionActive(profile)) return res.status(403).json({ error: 'Subscription required' });

    const shortCode = nanoid(8);
    const { error } = await supabase.from('links').insert({
      original_url: url,
      short_code: shortCode,
      user_id: userId,
      custom_title: customTitle,
      custom_description: customDescription,
      custom_image_url: customImageUrl,
      video_url: videoUrl
    });
    if (error) throw error;
    res.json({ converted_url: `https://hotsnew.click/s/${shortCode}`, shortCode });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/v1/user/links', async (req, res) => {
  try {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data: links } = await supabase.from('links').select('id, custom_title, short_code').eq('user_id', userId);
    if (!links || links.length === 0) return res.json({ history: [], topLinks: [] });
    const linkIds = links.map((d: any) => d.id);
    const linkMap = Object.fromEntries(links.map((d: any) => [d.id, d.custom_title || d.short_code]));
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
    const history = Object.entries(historyMap).map(([date, clickCount]) => ({ date, clicks: clickCount })).sort((a: any, b: any) => a.date.localeCompare(b.date));
    const topLinks = Object.entries(linksStats).map(([id, clickCount]) => ({ id, clicks: clickCount, title: linkMap[id] })).sort((a: any, b: any) => b.clicks - a.clicks).slice(0, 5);
    res.json({ history, topLinks });
  } catch {
    res.json({ history: [], topLinks: [] });
  }
});

app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { adminId } = req.query;
    if (!adminId) return res.status(400).json({ error: 'Missing adminId' });
    if (!(await isAdminRequest(supabase, String(adminId)))) return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const normalized = await Promise.all((data || []).map((profile: any) => normalizeExpiredProfile(supabase, profile)));
    res.json(normalized);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/admin/users/:targetUid/approve', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { targetUid } = req.params;
    const { isApproved, adminId } = req.body;
    if (!(await isAdminRequest(supabase, adminId))) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await supabase.from('profiles').update({ status: isApproved ? 'approved' : 'pending' }).eq('id', targetUid);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/admin/users/:targetUid/subscription', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { targetUid } = req.params;
    const { adminId, plan } = req.body;
    if (!(await isAdminRequest(supabase, adminId))) return res.status(403).json({ error: 'Forbidden' });
    if (!['monthly', 'yearly', 'none'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    let updatePayload: Record<string, any>;
    if (plan === 'none') {
      updatePayload = {
        subscription_plan: null,
        subscription_status: 'inactive',
        subscription_started_at: null,
        subscription_expires_at: null,
        subscription_requested_plan: null,
        updated_at: new Date().toISOString(),
      };
    } else {
      const { startedAt, expiresAt } = computeSubscriptionDates(plan as 'monthly' | 'yearly');
      updatePayload = {
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_started_at: startedAt,
        subscription_expires_at: expiresAt,
        subscription_requested_plan: null,
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase.from('profiles').update(updatePayload).eq('id', targetUid).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/v1/admin/users/:targetUid', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { targetUid } = req.params;
    const { adminId } = req.body;
    if (!(await isAdminRequest(supabase, adminId))) return res.status(403).json({ error: 'Forbidden' });
    if (targetUid === adminId) return res.status(400).json({ error: 'Cannot delete current admin user' });

    const { data: userLinks, error: linksFetchError } = await supabase.from('links').select('id').eq('user_id', targetUid);
    if (linksFetchError) throw linksFetchError;
    const linkIds = (userLinks || []).map((link: any) => link.id).filter(Boolean);
    if (linkIds.length > 0) {
      const { error: clicksDeleteError } = await supabase.from('clicks').delete().in('link_id', linkIds);
      if (clicksDeleteError) throw clicksDeleteError;
    }
    const { error: linksDeleteError } = await supabase.from('links').delete().eq('user_id', targetUid);
    if (linksDeleteError) throw linksDeleteError;
    const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', targetUid);
    if (profileDeleteError) throw profileDeleteError;
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUid);
    if (authDeleteError && authDeleteError.message !== 'User not found') throw authDeleteError;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/s/:shortCode', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { shortCode } = req.params;
    const { data: link } = await supabase.from('links').select('*').eq('short_code', shortCode).single();
    if (!link) return res.status(404).send('Not found');
    supabase.from('clicks').insert({ link_id: link.id, user_agent: req.headers['user-agent'], ip: req.ip }).then();
    res.redirect(link.original_url);
  } catch {
    res.status(500).send('Error');
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('FINAL EXPRESS ERROR:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

async function startLocalServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
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
