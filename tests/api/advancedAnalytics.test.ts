import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAnalyticsEvents,
  filterClicksByAnalyticsPeriod,
  matchesLinkAnalyticsSource,
} from "../../server/services/advancedAnalytics.js";

test("matchesLinkAnalyticsSource detects Shopee and TikTok links from stored destinations", () => {
  assert.equal(
    matchesLinkAnalyticsSource(
      {
        original_url: "https://shopee.vn/product/123",
        secondary_url: "https://www.tiktok.com/@demo/video/456",
      },
      "shopee",
    ),
    true,
  );

  assert.equal(
    matchesLinkAnalyticsSource(
      {
        original_url: "https://example.com/article",
        secondary_url: "https://www.tiktok.com/@demo/video/456",
      },
      "tiktok",
    ),
    true,
  );

  assert.equal(
    matchesLinkAnalyticsSource(
      {
        original_url: "https://example.com/article",
        secondary_url: "https://example.com/next",
      },
      "shopee",
    ),
    false,
  );
});

test("filterClicksByAnalyticsPeriod groups current window by Vietnam date", () => {
  const referenceDate = new Date("2026-05-21T02:00:00.000Z");
  const clicks = filterClicksByAnalyticsPeriod(
    [
      { created_at: "2026-05-20T18:30:00.000Z" },
      { created_at: "2026-05-20T15:30:00.000Z" },
      { created_at: "2026-05-10T15:30:00.000Z" },
    ],
    "today",
    referenceDate,
  );

  assert.equal(clicks.length, 1);
  assert.equal(clicks[0].created_at, "2026-05-20T18:30:00.000Z");
});

test("buildAnalyticsEvents enriches outbound events from the nearest tracked click", () => {
  const events = buildAnalyticsEvents(
    [
      {
        link_id: "link-1",
        short_code: "abc123",
        stage: "primary",
        destination_url: "https://shopee.vn/product/1",
        user_agent: "Mozilla/5.0",
        ip_address: "1.2.3.4",
        created_at: "2026-05-21T10:00:05.000Z",
      },
    ],
    [
      {
        link_id: "link-1",
        user_agent: "Mozilla/5.0",
        ip_address: "1.2.3.4",
        country: "Vietnam",
        city: "Ho Chi Minh City",
        device_type: "mobile",
        browser: "Chrome",
        os: "Android",
        created_at: "2026-05-21T10:00:00.000Z",
      },
    ],
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].country, "Vietnam");
  assert.equal(events[0].city, "Ho Chi Minh City");
  assert.equal(events[0].device_type, "mobile");
  assert.equal(events[0].browser, "Chrome");
  assert.equal(events[0].os, "Android");
});

