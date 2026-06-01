import crypto from "crypto";
import type { SupabaseClient } from "../../config/supabase.js";
import type {
  SocialPublisherAccountDetails,
  SocialPublisherAccountInput,
  SocialPublisherAccountRecord,
  SocialPublisherTarget,
  SocialPublisherAccountSecrets,
} from "./types.js";

const SOCIAL_PUBLISHER_TARGETS: SocialPublisherTarget[] = [
  "youtube",
  "tiktok",
  "facebook_page",
];

const ACCOUNT_SELECT =
  "id, user_id, target, account_name, external_account_id, provider_account_url, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, metadata, is_active, last_connected_at, last_refreshed_at, created_at, updated_at";

const getEncryptionKey = () => {
  const rawKey =
    process.env.SECURITY_ENCRYPTION_KEY ||
    process.env.APP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawKey) {
    throw new Error(
      "SECURITY_ENCRYPTION_KEY is not configured. Set SECURITY_ENCRYPTION_KEY environment variable to encrypt sensitive data."
    );
  }

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

const maskSecret = (value?: string | null) => {
  if (!value) return "****";
  if (value.length <= 8) return `${value.slice(0, 2)}****${value.slice(-2)}`;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
};

const normalizeTarget = (value: unknown): SocialPublisherTarget | null => {
  if (value === "youtube" || value === "tiktok" || value === "facebook_page") {
    return value;
  }
  return null;
};

const normalizeScopes = (value?: string[]) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const scopes: string[] = [];
  for (const rawScope of value) {
    const scope = rawScope?.trim();
    if (!scope || seen.has(scope)) continue;
    seen.add(scope);
    scopes.push(scope.slice(0, 120));
    if (scopes.length >= 20) break;
  }
  return scopes;
};

const normalizeTokenExpiry = (value?: string | null) => {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Token expiry is not a valid date.");
  }
  return parsed.toISOString();
};

const normalizeAccountName = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error("Account name is required.");
  }
  return trimmed.slice(0, 120);
};

const normalizeProviderUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Invalid account URL.");
    }
    return url.toString();
  } catch {
    throw new Error("Invalid account URL.");
  }
};

const sanitizeMetadata = (value?: Record<string, unknown>) =>
  value && typeof value === "object" ? value : {};

const ensureTarget = (value: unknown): SocialPublisherTarget => {
  const target = normalizeTarget(value);
  if (!target) {
    throw new Error("Unsupported social publisher target.");
  }
  return target;
};

const toDetails = (
  record: SocialPublisherAccountRecord,
  accessToken?: string | null,
  refreshToken?: string | null,
): SocialPublisherAccountDetails => ({
  ...record,
  access_token_preview: maskSecret(accessToken),
  refresh_token_preview: refreshToken ? maskSecret(refreshToken) : null,
  has_access_token: !!accessToken,
  has_refresh_token: !!refreshToken,
});

export const createSocialPublisherAccount = async (
  supabase: SupabaseClient,
  userId: string,
  input: SocialPublisherAccountInput,
): Promise<SocialPublisherAccountDetails> => {
  const target = ensureTarget(input.target);
  const accountName = normalizeAccountName(input.accountName);
  const tokenExpiresAt = normalizeTokenExpiry(input.tokenExpiresAt);
  const scopes = normalizeScopes(input.scopes);
  const providerAccountUrl = normalizeProviderUrl(input.providerAccountUrl);

  if (!input.accessToken?.trim()) {
    throw new Error("Access token is required.");
  }

  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_publish_accounts")
    .insert({
      user_id: userId,
      target,
      account_name: accountName,
      external_account_id: input.externalAccountId?.trim() || null,
      provider_account_url: providerAccountUrl,
      access_token_encrypted: encryptSecret(input.accessToken.trim()),
      refresh_token_encrypted: input.refreshToken?.trim()
        ? encryptSecret(input.refreshToken.trim())
        : null,
      token_expires_at: tokenExpiresAt,
      scopes,
      metadata: sanitizeMetadata(input.metadata),
      is_active: true,
      last_connected_at: timestamp,
      last_refreshed_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select(ACCOUNT_SELECT)
    .single();

  if (error) throw error;

  return toDetails(data as SocialPublisherAccountRecord, input.accessToken, input.refreshToken);
};

export const listSocialPublisherAccounts = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<SocialPublisherAccountDetails[]> => {
  const { data, error } = await supabase
    .from("social_publish_accounts")
    .select(ACCOUNT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const records = (data || []) as SocialPublisherAccountRecord[];
  return records.map((record) => {
    const accessToken = decryptSecret((record as any).access_token_encrypted);
    const refreshToken = decryptSecret((record as any).refresh_token_encrypted);
    return toDetails(record, accessToken, refreshToken);
  });
};

export const getSocialPublisherAccountById = async (
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<SocialPublisherAccountDetails | null> => {
  const { data, error } = await supabase
    .from("social_publish_accounts")
    .select(ACCOUNT_SELECT)
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId) return null;

  const accessToken = decryptSecret((data as any).access_token_encrypted);
  const refreshToken = decryptSecret((data as any).refresh_token_encrypted);
  return toDetails(data as SocialPublisherAccountRecord, accessToken, refreshToken);
};

export const updateSocialPublisherAccount = async (
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  input: Partial<SocialPublisherAccountInput> & {
    isActive?: boolean;
  },
): Promise<SocialPublisherAccountDetails> => {
  const existing = await getSocialPublisherAccountById(supabase, userId, accountId);
  if (!existing) {
    throw new Error("Social publisher account not found.");
  }

  const nextAccountName =
    input.accountName !== undefined
      ? normalizeAccountName(input.accountName)
      : existing.account_name;
  const nextTarget =
    input.target !== undefined ? ensureTarget(input.target) : existing.target;
  const nextScopes =
    input.scopes !== undefined ? normalizeScopes(input.scopes) : existing.scopes;
  const nextProviderUrl =
    input.providerAccountUrl !== undefined
      ? normalizeProviderUrl(input.providerAccountUrl)
      : existing.provider_account_url || null;
  const nextTokenExpiresAt =
    input.tokenExpiresAt !== undefined
      ? normalizeTokenExpiry(input.tokenExpiresAt)
      : existing.token_expires_at || null;
  const timestamp = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    target: nextTarget,
    account_name: nextAccountName,
    external_account_id:
      input.externalAccountId !== undefined
        ? input.externalAccountId?.trim() || null
        : existing.external_account_id || null,
    provider_account_url: nextProviderUrl,
    token_expires_at: nextTokenExpiresAt,
    scopes: nextScopes,
    metadata:
      input.metadata !== undefined
        ? sanitizeMetadata(input.metadata)
        : existing.metadata || {},
    is_active:
      typeof input.isActive === "boolean" ? input.isActive : existing.is_active,
    updated_at: timestamp,
  };

  if (input.accessToken !== undefined) {
    if (!input.accessToken.trim()) {
      throw new Error("Access token cannot be empty.");
    }
    updatePayload.access_token_encrypted = encryptSecret(input.accessToken.trim());
    updatePayload.last_connected_at = timestamp;
  }

  if (input.refreshToken !== undefined) {
    updatePayload.refresh_token_encrypted = input.refreshToken.trim()
      ? encryptSecret(input.refreshToken.trim())
      : null;
    updatePayload.last_refreshed_at = timestamp;
  }

  const { data, error } = await supabase
    .from("social_publish_accounts")
    .update(updatePayload)
    .eq("id", accountId)
    .eq("user_id", userId)
    .select(`${ACCOUNT_SELECT}, access_token_encrypted, refresh_token_encrypted`)
    .single();

  if (error) throw error;

  return toDetails(
    data as SocialPublisherAccountRecord,
    decryptSecret((data as any).access_token_encrypted),
    decryptSecret((data as any).refresh_token_encrypted),
  );
};

export const deleteSocialPublisherAccount = async (
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
) => {
  const { error } = await supabase
    .from("social_publish_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const getSocialPublisherAccountSecrets = async (
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
) => {
  const { data, error } = await supabase
    .from("social_publish_accounts")
    .select("id, user_id, access_token_encrypted, refresh_token_encrypted")
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId) return null;

  return {
    accountId: data.id,
    accessToken: decryptSecret((data as any).access_token_encrypted),
    refreshToken: decryptSecret((data as any).refresh_token_encrypted),
    tokenExpiresAt: data.token_expires_at || null,
  };
};

export const getActiveSocialPublisherAccountSecretsByTarget = async (
  supabase: SupabaseClient,
  userId: string,
  target: SocialPublisherTarget,
): Promise<SocialPublisherAccountSecrets | null> => {
  const accounts = await listSocialPublisherAccounts(supabase, userId);
  const activeAccount = accounts.find(
    (account) => account.target === target && account.is_active,
  );

  if (!activeAccount) {
    return null;
  }

  const secrets = await getSocialPublisherAccountSecrets(
    supabase,
    userId,
    activeAccount.id,
  );

  if (!secrets) {
    return null;
  }

  return secrets;
};

export const normalizeSocialPublisherTargetList = (
  values?: SocialPublisherTarget[],
) =>
  Array.isArray(values)
    ? values.filter((value): value is SocialPublisherTarget =>
        SOCIAL_PUBLISHER_TARGETS.includes(value),
      )
    : [];
