import { isIP } from "node:net";
import { SupabaseClient } from "../config/supabase.js";
import {
  countDisplayableOutboundClicks,
  fetchOutboundEventsForLinkIds,
} from "../utils/clickTracking.js";
import { isPrivateOrLocalIp } from "../utils/helpers.js";

export interface NotificationSettings {
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notify_on_click: boolean;
  notify_threshold: number;
}

export const isSafeWebhookUrl = (value?: string | null) => {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") {
      return false;
    }

    if (url.username || url.password) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan")
    ) {
      return false;
    }

    if (isIP(hostname) || hostname === "::1") {
      return !isPrivateOrLocalIp(hostname);
    }

    return true;
  } catch {
    return false;
  }
};

const normalizeSettingString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export type AppNotificationType =
  | "workspace_invitation"
  | "workspace_invitation_response"
  | "workspace_membership_updated"
  | "workspace_membership_removed"
  | "link_click_threshold"
  | "link_expiring_soon"
  | "quota_warning"
  | "subscription_expiring"
  | "payment_confirmed";

export const createPaymentConfirmedNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    plan: "monthly" | "yearly";
    amount: number;
    paymentRequestId: string;
  },
) => {
  const planLabel = payload.plan === "monthly" ? "gói tháng" : "gói năm";
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "payment_confirmed",
    title: "Thanh toán đã được xác nhận",
    message: `Quản trị viên đã xác nhận thanh toán ${payload.amount.toLocaleString("vi-VN")}đ cho ${planLabel}. Gói của bạn đã được kích hoạt.`,
    metadata: {
      payment_request_id: payload.paymentRequestId,
      subscription_plan: payload.plan,
      amount: payload.amount,
    },
    uniqueEventKey: `payment_confirmed:${payload.paymentRequestId}`,
  });
};

export interface AppNotification {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  link_id?: string | null;
  workspace_id?: string | null;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

const CLICK_NOTIFICATION_THRESHOLDS = [5, 10, 20];
const LINK_EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_EXPIRY_WARNING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const getDisplayedClickCountForLink = async (
  supabase: SupabaseClient,
  linkId: string,
) =>
  countDisplayableOutboundClicks(
    await fetchOutboundEventsForLinkIds(supabase, [linkId]),
  );

export const getNotificationSettings = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationSettings | null> => {
  const { data, error } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    webhook_url: data.webhook_url,
    telegram_bot_token: data.telegram_bot_token,
    telegram_chat_id: data.telegram_chat_id,
    notify_on_click: data.notify_on_click,
    notify_threshold: data.notify_threshold,
  };
};

export const saveNotificationSettings = async (
  supabase: SupabaseClient,
  userId: string,
  settings: Partial<NotificationSettings>,
): Promise<void> => {
  const currentSettings = await getNotificationSettings(supabase, userId);
  const mergedSettings = { ...currentSettings, ...settings };
  const webhookUrl = normalizeSettingString(mergedSettings.webhook_url);
  if (webhookUrl && !isSafeWebhookUrl(webhookUrl)) {
    throw new Error("Webhook URL must use HTTPS and a public host.");
  }

  const notifyOnClick =
    typeof mergedSettings.notify_on_click === "boolean"
      ? mergedSettings.notify_on_click
      : currentSettings?.notify_on_click ?? true;
  const notifyThresholdRaw = Number(mergedSettings.notify_threshold);
  const notifyThreshold = Number.isFinite(notifyThresholdRaw)
    ? Math.max(0, Math.floor(notifyThresholdRaw))
    : currentSettings?.notify_threshold ?? 0;

  const { error } = await supabase.from("user_notification_settings").upsert(
    {
      user_id: userId,
      webhook_url: webhookUrl,
      telegram_bot_token: normalizeSettingString(
        mergedSettings.telegram_bot_token,
      ),
      telegram_chat_id: normalizeSettingString(mergedSettings.telegram_chat_id),
      notify_on_click: notifyOnClick,
      notify_threshold: notifyThreshold,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
};

export const listAppNotifications = async (
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase
      .from("user_notifications")
      .select(
        "id, user_id, type, title, message, link_id, workspace_id, metadata, is_read, read_at, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  if (error) throw error;
  if (countError) throw countError;

  return {
    notifications: (data || []) as AppNotification[],
    unreadCount: count || 0,
  };
};

export const markNotificationRead = async (
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
) => {
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const markAllNotificationsRead = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: timestamp,
      updated_at: timestamp,
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
};

export const createAppNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    type: AppNotificationType;
    title: string;
    message: string;
    linkId?: string | null;
    workspaceId?: string | null;
    metadata?: Record<string, unknown>;
    uniqueEventKey?: string | null;
  },
) => {
  const timestamp = new Date().toISOString();
  const nextPayload = {
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link_id: payload.linkId || null,
    workspace_id: payload.workspaceId || null,
    metadata: payload.metadata || {},
    unique_event_key: payload.uniqueEventKey || null,
    is_read: false,
    read_at: null,
    updated_at: timestamp,
  };

  if (payload.uniqueEventKey) {
    const { data: existingNotification, error: existingError } = await supabase
      .from("user_notifications")
      .select("id")
      .eq("unique_event_key", payload.uniqueEventKey)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingNotification?.id) {
      const { error: updateError } = await supabase
        .from("user_notifications")
        .update(nextPayload)
        .eq("id", existingNotification.id);

      if (updateError) {
        throw updateError;
      }
      return;
    }
  }

  const { error } = await supabase
    .from("user_notifications")
    .insert(nextPayload);
  if (error) {
    throw error;
  }
};

export const sendWebhookNotification = async (
  webhookUrl: string,
  payload: {
    event: string;
    link_id: string;
    short_code: string;
    click_data: {
      country?: string;
      city?: string;
      device_type?: string;
      browser?: string;
      os?: string;
      source?: string;
      created_at: string;
    };
    user_id: string;
  },
): Promise<boolean> => {
  try {
    if (!isSafeWebhookUrl(webhookUrl)) {
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "HotsNewClick-Webhook/1.0",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Webhook notification failed:", error);
    return false;
  }
};

export const sendTelegramNotification = async (
  botToken: string,
  chatId: string,
  message: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
};

export const logNotification = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string | null,
  type: "webhook" | "telegram",
  status: "success" | "failed",
  message?: string,
): Promise<void> => {
  await supabase.from("notification_logs").insert({
    user_id: userId,
    link_id: linkId,
    notification_type: type,
    status,
    message: message || null,
  });
};

const maybeCreateClickThresholdNotification = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
  shortCode: string,
  linkTitle?: string | null,
) => {
  const totalClicks = await getDisplayedClickCountForLink(supabase, linkId);
  if (!CLICK_NOTIFICATION_THRESHOLDS.includes(totalClicks)) {
    return;
  }

  const label = linkTitle?.trim() || shortCode;
  await createAppNotification(supabase, {
    userId,
    type: "link_click_threshold",
    title: `Link đạt ${totalClicks} lượt click`,
    message: `${label} vừa đạt mốc ${totalClicks} lượt click.`,
    linkId,
    metadata: {
      short_code: shortCode,
      link_title: linkTitle || null,
      total_clicks: totalClicks,
      threshold: totalClicks,
    },
    uniqueEventKey: `link_click_threshold:${linkId}:${totalClicks}`,
  });
};

export const createWorkspaceInvitationNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    workspaceId: string;
    workspaceName: string;
    invitedByName?: string | null;
    invitationId: string;
    role: string;
  },
) => {
  const inviterLabel = payload.invitedByName?.trim() || "Owner";
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "workspace_invitation",
    title: "Bạn có lời mời vào Team Workspace",
    message: `${inviterLabel} mời bạn vào workspace ${payload.workspaceName} với vai trò ${payload.role}.`,
    workspaceId: payload.workspaceId,
    metadata: {
      invitation_id: payload.invitationId,
      workspace_name: payload.workspaceName,
      role: payload.role,
    },
    uniqueEventKey: `workspace_invitation:${payload.invitationId}`,
  });
};

export const createWorkspaceInvitationResponseNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    workspaceId: string;
    workspaceName: string;
    memberName?: string | null;
    memberEmail?: string | null;
    invitationId: string;
    action: "accepted" | "declined";
    role: string;
  },
) => {
  const memberLabel =
    payload.memberName?.trim() || payload.memberEmail?.trim() || "Thanh vien";
  const actionLabel =
    payload.action === "accepted" ? "Đã chấp Nhận" : "Đã từ chối";

  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "workspace_invitation_response",
    title:
      payload.action === "accepted"
        ? "Lời mời workspace đã được chấp nhận"
        : "Lời mời workspace đã bị từ chối",
    message: `${memberLabel} ${actionLabel} lời mời vào workspace ${payload.workspaceName} (${payload.role}).`,
    workspaceId: payload.workspaceId,
    metadata: {
      invitation_id: payload.invitationId,
      workspace_name: payload.workspaceName,
      member_name: payload.memberName || null,
      member_email: payload.memberEmail || null,
      role: payload.role,
      action: payload.action,
    },
    uniqueEventKey: `workspace_invitation_response:${payload.invitationId}:${payload.action}`,
  });
};

export const createWorkspaceMembershipUpdatedNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    workspaceId: string;
    workspaceName: string;
    role: "editor" | "viewer";
  },
) => {
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "workspace_membership_updated",
    title: "Vai trò workspace đã thay đổi",
    message: `Vai trò của bạn trong workspace ${payload.workspaceName} đã được đổi thành ${payload.role}.`,
    workspaceId: payload.workspaceId,
    metadata: {
      workspace_name: payload.workspaceName,
      role: payload.role,
    },
  });
};

export const createWorkspaceMembershipRemovedNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    workspaceId: string;
    workspaceName: string;
  },
) => {
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "workspace_membership_removed",
    title: "Bạn đã bị xóa khỏi workspace",
    message: `Bạn không còn là thành viên của workspace ${payload.workspaceName}.`,
    workspaceId: payload.workspaceId,
    metadata: {
      workspace_name: payload.workspaceName,
    },
  });
};

export const createQuotaWarningNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    quotaKey: "link_daily" | "video_daily" | "team_workspace";
    title: string;
    message: string;
    uniqueSuffix: string;
    metadata?: Record<string, unknown>;
  },
) => {
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "quota_warning",
    title: payload.title,
    message: payload.message,
    metadata: {
      quota_key: payload.quotaKey,
      ...(payload.metadata || {}),
    },
    uniqueEventKey: `quota_warning:${payload.quotaKey}:${payload.uniqueSuffix}`,
  });
};

export const maybeCreateLinkExpiryNotifications = async (
  supabase: SupabaseClient,
  userId: string,
  links: Array<{
    id?: string;
    short_code?: string | null;
    custom_title?: string | null;
    expires_at?: string | null;
  }>,
) => {
  const now = Date.now();

  await Promise.all(
    links.map(async (link) => {
      if (!link.id || !link.expires_at) return;

      const expiresAtMs = new Date(link.expires_at).getTime();
      if (!Number.isFinite(expiresAtMs)) return;

      const diffMs = expiresAtMs - now;
      if (diffMs <= 0 || diffMs > LINK_EXPIRY_WARNING_WINDOW_MS) return;

      const hoursLeft = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
      const label = link.custom_title?.trim() || link.short_code || "Link";

      await createAppNotification(supabase, {
        userId,
        type: "link_expiring_soon",
        title: "Link sắp hết hạn",
        message: `${label} sẽ hết hạn trong khoảng ${hoursLeft} giờ nữa.`,
        linkId: link.id,
        metadata: {
          short_code: link.short_code || null,
          link_title: link.custom_title || null,
          expires_at: link.expires_at,
          hours_left: hoursLeft,
        },
        uniqueEventKey: `link_expiring_soon:${link.id}:${link.expires_at}`,
      });
    }),
  );
};

export const maybeCreateSubscriptionExpiryNotification = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    subscriptionPlan?: string | null;
    subscriptionExpiry?: string | null;
  },
) => {
  if (
    !payload.subscriptionExpiry ||
    !payload.subscriptionPlan ||
    payload.subscriptionPlan === "free"
  ) {
    return;
  }

  const expiryMs = new Date(payload.subscriptionExpiry).getTime();
  if (!Number.isFinite(expiryMs)) return;

  const diffMs = expiryMs - Date.now();
  if (diffMs <= 0 || diffMs > SUBSCRIPTION_EXPIRY_WARNING_WINDOW_MS) {
    return;
  }

  const daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  await createAppNotification(supabase, {
    userId: payload.userId,
    type: "subscription_expiring",
    title: "Gói cước sắp hết hạn",
    message: `Gói ${payload.subscriptionPlan} của bạn sẽ hết hạn sau khoảng ${daysLeft} ngày.`,
    metadata: {
      subscription_plan: payload.subscriptionPlan,
      subscription_expiry: payload.subscriptionExpiry,
      days_left: daysLeft,
    },
    uniqueEventKey: `subscription_expiring:${payload.subscriptionPlan}:${payload.subscriptionExpiry}`,
  });
};

export const handleClickNotification = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
  shortCode: string,
  clickData: {
    country?: string;
    city?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    source?: string;
    created_at: string;
  },
  options?: {
    linkTitle?: string | null;
  },
): Promise<void> => {
  await maybeCreateClickThresholdNotification(
    supabase,
    userId,
    linkId,
    shortCode,
    options?.linkTitle,
  );

  const settings = await getNotificationSettings(supabase, userId);
  if (!settings || !settings.notify_on_click) {
    return;
  }

  if (settings.notify_threshold > 0) {
    const totalClicks = await getDisplayedClickCountForLink(supabase, linkId);

    if (totalClicks === 0 || totalClicks % settings.notify_threshold !== 0) {
      return;
    }
  }

  const location =
    [clickData.city, clickData.country].filter(Boolean).join(", ") || "Unknown";
  const device =
    [clickData.device_type, clickData.browser].filter(Boolean).join(" / ") ||
    "Unknown";

  if (settings.webhook_url) {
    const success = await sendWebhookNotification(settings.webhook_url, {
      event: "link.click",
      link_id: linkId,
      short_code: shortCode,
      click_data: clickData,
      user_id: userId,
    });

    await logNotification(
      supabase,
      userId,
      linkId,
      "webhook",
      success ? "success" : "failed",
      success ? undefined : "Webhook request failed",
    );
  }

  if (settings.telegram_bot_token && settings.telegram_chat_id) {
    const message = `Link ${shortCode} có click mới

Vi tri: ${location}
Thiet bi: ${device}
Nguon: ${clickData.source || "Direct"}
Thoi gian: ${new Date(clickData.created_at).toLocaleString("vi-VN")}`;

    const success = await sendTelegramNotification(
      settings.telegram_bot_token,
      settings.telegram_chat_id,
      message,
    );

    await logNotification(
      supabase,
      userId,
      linkId,
      "telegram",
      success ? "success" : "failed",
      success ? undefined : "Telegram API request failed",
    );
  }
};
