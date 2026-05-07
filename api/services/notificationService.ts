import { SupabaseClient } from "../config/supabase.js";

export interface NotificationSettings {
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notify_on_click: boolean;
  notify_threshold: number;
}

export type AppNotificationType =
  | "workspace_invitation"
  | "link_click_threshold";

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
  const { error } = await supabase.from("user_notification_settings").upsert(
    {
      user_id: userId,
      ...settings,
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
  const { count, error } = await supabase
    .from("link_outbound_events")
    .select("id", { count: "exact", head: true })
    .eq("link_id", linkId);

  if (error) throw error;

  const totalClicks = Number(count || 0);
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
    role: "editor" | "viewer";
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
    const { count } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .eq("link_id", linkId);

    if ((count || 0) % settings.notify_threshold !== 0) {
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
