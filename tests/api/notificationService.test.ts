import test from "node:test";
import assert from "node:assert/strict";
import {
  isSafeWebhookUrl,
  sendWebhookNotification,
} from "../../api/services/notificationService.js";

test("isSafeWebhookUrl accepts public https endpoints and rejects unsafe URLs", () => {
  assert.equal(isSafeWebhookUrl("https://example.com/webhook"), true);
  assert.equal(isSafeWebhookUrl("http://example.com/webhook"), false);
  assert.equal(isSafeWebhookUrl("https://localhost/webhook"), false);
  assert.equal(isSafeWebhookUrl("https://127.0.0.1/webhook"), false);
  assert.equal(isSafeWebhookUrl("https://user:pass@example.com/webhook"), false);
});

test("sendWebhookNotification short-circuits unsafe endpoints without fetching", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = (async () => {
    fetchCalled = true;
    return new Response("ok", { status: 200 });
  }) as typeof fetch;

  try {
    const result = await sendWebhookNotification("http://127.0.0.1/webhook", {
      event: "click",
      link_id: "link-1",
      short_code: "abc123",
      click_data: {
        created_at: new Date().toISOString(),
      },
      user_id: "user-1",
    });

    assert.equal(result, false);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
