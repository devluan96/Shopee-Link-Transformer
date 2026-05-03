import { SupabaseClient } from "../config/supabase.js";

export interface NotificationSettings {
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notify_on_click: boolean;
  notify_threshold: number;
}

// Get notification settings for user
export const getNotificationSettings = async (
  supabase: SupabaseClient,
  userId: string
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

// Save notification settings
export const saveNotificationSettings = async (
  supabase: SupabaseClient,
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> => {
  const { error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
};

// Send webhook notification
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
  }
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

// Send Telegram notification
export const sendTelegramNotification = async (
  botToken: string,
  chatId: string,
  message: string
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
      }
    );

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
};

// Log notification attempt
export const logNotification = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string | null,
  type: "webhook" | "telegram",
  status: "success" | "failed",
  message?: string
): Promise<void> => {
  await supabase.from("notification_logs").insert({
    user_id: userId,
    link_id: linkId,
    notification_type: type,
    status,
    message: message || null,
  });
};

// Main notification handler - call this when a click happens
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
  }
): Promise<void> => {
  const settings = await getNotificationSettings(supabase, userId);
  
  if (!settings || !settings.notify_on_click) {
    return;
  }

  // Check threshold (0 = notify on every click)
  if (settings.notify_threshold > 0) {
    const { count } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .eq("link_id", linkId);

    // Only notify if click count matches threshold
    if ((count || 0) % settings.notify_threshold !== 0) {
      return;
    }
  }

  // Format message
  const location = [clickData.city, clickData.country].filter(Boolean).join(", ") || "Unknown";
  const device = [clickData.device_type, clickData.browser].filter(Boolean).join(" / ") || "Unknown";

  // Send webhook if configured
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
      success ? undefined : "Webhook request failed"
    );
  }

  // Send Telegram if configured
  if (settings.telegram_bot_token && settings.telegram_chat_id) {
    const message = `🔥 <b>Click mới!</b>

🔗 Link: <code>${shortCode}</code>
📍 Vị trí: ${location}
📱 Thiết bị: ${device}
🌐 Nguồn: ${clickData.source || "Direct"}
🕐 Thời gian: ${new Date(clickData.created_at).toLocaleString("vi-VN")}`;

    const success = await sendTelegramNotification(
      settings.telegram_bot_token,
      settings.telegram_chat_id,
      message
    );

    await logNotification(
      supabase,
      userId,
      linkId,
      "telegram",
      success ? "success" : "failed",
      success ? undefined : "Telegram API request failed"
    );
  }
};
