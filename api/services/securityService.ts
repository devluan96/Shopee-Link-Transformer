import crypto from "crypto";
import { SupabaseClient } from "../config/supabase.js";

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export interface AccessLogEntry {
  id: string;
  user_id?: string | null;
  email?: string | null;
  ip_address?: string | null;
  method: string;
  path: string;
  status_code: number;
  user_agent?: string | null;
  referer?: string | null;
  blocked: boolean;
  block_reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BlockedIpEntry {
  id: string;
  ip_address: string;
  reason?: string | null;
  blocked_by?: string | null;
  active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface SecurityOverview {
  twoFactorEnabled: boolean;
  maskedSecret: string | null;
  lastVerifiedAt: string | null;
  recentAccessLogs: AccessLogEntry[];
}

interface UserSecuritySettingsRow {
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string | null;
  two_factor_enabled_at?: string | null;
  last_2fa_verified_at?: string | null;
}

const getEncryptionKey = () => {
  const rawKey =
    process.env.SECURITY_ENCRYPTION_KEY ||
    process.env.APP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "hotsnew-dev-security-key";

  return crypto.createHash("sha256").update(rawKey).digest();
};

const encryptSecret = (plaintext: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
};

const decryptSecret = (payload?: string | null) => {
  if (!payload) return null;
  const [ivB64, tagB64, encryptedB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !encryptedB64) return null;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

const encodeBase32 = (buffer: Buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = value * 256 + byte;
    bits += 8;
    while (bits >= 5) {
      const index = Math.floor(value / 2 ** (bits - 5)) % 32;
      output += BASE32_ALPHABET[index];
      bits -= 5;
      value %= 2 ** bits;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value * 2 ** (5 - bits)) % 32];
  }

  return output;
};

const decodeBase32 = (input: string) => {
  const cleaned = input
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    value = value * 32 + index;
    bits += 5;
    if (bits >= 8) {
      bytes.push(Math.floor(value / 2 ** (bits - 8)) % 256);
      bits -= 8;
      value %= 2 ** bits;
    }
  }

  return Buffer.from(bytes);
};

const generateTotpToken = (base32Secret: string, timestamp = Date.now()) => {
  const counter = Math.floor(timestamp / 1000 / TOTP_STEP_SECONDS);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto
    .createHmac("sha1", decodeBase32(base32Secret))
    .update(counterBuffer)
    .digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
};

const verifyTotpToken = (base32Secret: string, code: string) => {
  const normalizedCode = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) return false;

  const now = Date.now();
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const candidate = generateTotpToken(
      base32Secret,
      now + offset * TOTP_STEP_SECONDS * 1000,
    );
    if (
      crypto.timingSafeEqual(
        Buffer.from(candidate),
        Buffer.from(normalizedCode),
      )
    ) {
      return true;
    }
  }

  return false;
};

const maskSecret = (secret?: string | null) => {
  if (!secret) return null;
  if (secret.length <= 8) return secret;
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
};

const getOrCreateSettings = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSecuritySettingsRow> => {
  const { data: existing, error } = await supabase
    .from("user_security_settings")
    .select(
      "user_id, two_factor_enabled, two_factor_secret, two_factor_enabled_at, last_2fa_verified_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing as UserSecuritySettingsRow;

  const { data: created, error: createError } = await supabase
    .from("user_security_settings")
    .insert({ user_id: userId })
    .select(
      "user_id, two_factor_enabled, two_factor_secret, two_factor_enabled_at, last_2fa_verified_at",
    )
    .single();

  if (createError) throw createError;
  return created as UserSecuritySettingsRow;
};

export const logAccessEvent = async (
  supabase: SupabaseClient,
  payload: Omit<AccessLogEntry, "id" | "created_at">,
) => {
  const { error } = await supabase.from("access_logs").insert({
    user_id: payload.user_id || null,
    email: payload.email || null,
    ip_address: payload.ip_address || null,
    method: payload.method,
    path: payload.path,
    status_code: payload.status_code,
    user_agent: payload.user_agent || null,
    referer: payload.referer || null,
    blocked: payload.blocked,
    block_reason: payload.block_reason || null,
    metadata: payload.metadata || {},
  });

  if (error) {
    console.error("[Security] access log insert failed:", error.message);
  }
};

export const logAdminAction = async (
  supabase: SupabaseClient,
  payload: {
    actorUserId?: string | null;
    actorEmail?: string | null;
    action: string;
    targetUserId?: string | null;
    targetId?: string | null;
    targetType?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const { error } = await supabase.from("access_logs").insert({
    user_id: payload.actorUserId || null,
    email: payload.actorEmail || null,
    ip_address: null,
    method: "ADMIN",
    path: `admin:${payload.action}`,
    status_code: 200,
    user_agent: null,
    referer: null,
    blocked: false,
    block_reason: null,
    metadata: {
      kind: "admin_action",
      action: payload.action,
      target_user_id: payload.targetUserId || null,
      target_id: payload.targetId || null,
      target_type: payload.targetType || null,
      ...(payload.metadata || {}),
    },
  });

  if (error) {
    console.error("[Security] admin action log insert failed:", error.message);
  }
};

export const isIpBlocked = async (
  supabase: SupabaseClient,
  ipAddress: string,
) => {
  if (!ipAddress) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blocked_ips")
    .select(
      "id, ip_address, reason, blocked_by, active, expires_at, created_at, updated_at",
    )
    .eq("ip_address", ipAddress)
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as BlockedIpEntry | null;
};

export const getSecurityOverview = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<SecurityOverview> => {
  const settings = await getOrCreateSettings(supabase, userId);
  const recentAccessLogs = await listUserAccessLogs(supabase, userId, 10);
  const decryptedSecret = decryptSecret(settings.two_factor_secret);

  return {
    twoFactorEnabled: !!settings.two_factor_enabled,
    maskedSecret: maskSecret(decryptedSecret),
    lastVerifiedAt: settings.last_2fa_verified_at || null,
    recentAccessLogs,
  };
};

export const beginTwoFactorSetup = async (
  supabase: SupabaseClient,
  userId: string,
  email: string,
) => {
  const settings = await getOrCreateSettings(supabase, userId);
  const secret =
    decryptSecret(settings.two_factor_secret) ||
    encodeBase32(crypto.randomBytes(20));
  const encryptedSecret = encryptSecret(secret);
  const issuer = "HotsNew Click";
  const label = encodeURIComponent(`${issuer}:${email}`);
  const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;

  const { error } = await supabase.from("user_security_settings").upsert(
    {
      user_id: userId,
      two_factor_enabled: false,
      two_factor_secret: encryptedSecret,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  return {
    secret,
    otpauthUri,
  };
};

export const enableTwoFactor = async (
  supabase: SupabaseClient,
  userId: string,
  code: string,
) => {
  const settings = await getOrCreateSettings(supabase, userId);
  const decryptedSecret = decryptSecret(settings.two_factor_secret);
  if (!decryptedSecret) {
    throw new Error("Bạn cần tạo secret 2FA trước khi kích hoạt.");
  }
  if (!verifyTotpToken(decryptedSecret, code)) {
    throw new Error("Mã xác thực 2FA không hợp lệ.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_security_settings")
    .update({
      two_factor_enabled: true,
      two_factor_enabled_at: now,
      last_2fa_verified_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
};

export const disableTwoFactor = async (
  supabase: SupabaseClient,
  userId: string,
  code: string,
) => {
  const settings = await getOrCreateSettings(supabase, userId);
  const decryptedSecret = decryptSecret(settings.two_factor_secret);
  if (!decryptedSecret || !settings.two_factor_enabled) {
    throw new Error("Tài khoản này chưa bật 2FA.");
  }
  if (!verifyTotpToken(decryptedSecret, code)) {
    throw new Error("Mã xác thực 2FA không hợp lệ.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_security_settings")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      updated_at: now,
    })
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
};

export const verifyTwoFactorChallenge = async (
  supabase: SupabaseClient,
  userId: string,
  code: string,
) => {
  const settings = await getOrCreateSettings(supabase, userId);
  const decryptedSecret = decryptSecret(settings.two_factor_secret);
  if (!decryptedSecret || !settings.two_factor_enabled) {
    throw new Error("Tài khoản này chưa bật 2FA.");
  }
  if (!verifyTotpToken(decryptedSecret, code)) {
    throw new Error("Mã xác thực 2FA không hợp lệ.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_security_settings")
    .update({
      last_2fa_verified_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true, verifiedAt: now };
};

export const listUserAccessLogs = async (
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
) => {
  const { data, error } = await supabase
    .from("access_logs")
    .select(
      "id, user_id, email, ip_address, method, path, status_code, user_agent, referer, blocked, block_reason, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AccessLogEntry[];
};

export const listAdminAccessLogs = async (
  supabase: SupabaseClient,
  options: {
    limit?: number;
    userId?: string;
    ipAddress?: string;
  } = {},
) => {
  let query = supabase
    .from("access_logs")
    .select(
      "id, user_id, email, ip_address, method, path, status_code, user_agent, referer, blocked, block_reason, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(options.limit || 100);

  if (options.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options.ipAddress) {
    query = query.eq("ip_address", options.ipAddress);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AccessLogEntry[];
};

export const listBlockedIps = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("blocked_ips")
    .select(
      "id, ip_address, reason, blocked_by, active, expires_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as BlockedIpEntry[];
};

export const blockIp = async (
  supabase: SupabaseClient,
  actorUserId: string,
  payload: {
    ipAddress: string;
    reason?: string;
    expiresAt?: string | null;
  },
) => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blocked_ips")
    .upsert(
      {
        ip_address: payload.ipAddress,
        reason: payload.reason?.trim() || null,
        blocked_by: actorUserId,
        expires_at: payload.expiresAt || null,
        active: true,
        updated_at: now,
      },
      { onConflict: "ip_address" },
    )
    .select(
      "id, ip_address, reason, blocked_by, active, expires_at, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as BlockedIpEntry;
};

export const unblockIp = async (
  supabase: SupabaseClient,
  blockedIpId: string,
) => {
  const { error } = await supabase
    .from("blocked_ips")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", blockedIpId);

  if (error) throw error;
  return { success: true };
};
