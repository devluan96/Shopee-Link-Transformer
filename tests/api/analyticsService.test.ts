import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeFocusedAnalytics,
  summarizeOutboundEvents,
} from "../../api/services/analyticsService.js";

const daysAgoIso = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

test("summarizeOutboundEvents keeps all-time totals but limits recent Shopee history to the last 30 days", () => {
  const summary = summarizeOutboundEvents([
    {
      link_id: "link-1",
      destination_url: "https://shopee.vn/product/1",
      source: "facebook",
      created_at: daysAgoIso(0),
    },
    {
      link_id: "link-1",
      destination_url: "https://shopee.vn/product/2",
      source: "zalo",
      created_at: daysAgoIso(1),
    },
    {
      link_id: "link-2",
      destination_url: "https://www.tiktok.com/@demo/video/123",
      source: "tiktok",
      created_at: daysAgoIso(2),
    },
    {
      link_id: "link-3",
      destination_url: "https://shopee.vn/product/3",
      source: "youtube",
      created_at: daysAgoIso(35),
    },
  ]);

  assert.equal(summary.totalClicks, 4);
  assert.equal(summary.totalShopeeClicks, 3);
  assert.equal(summary.totalTiktokClicks, 1);

  assert.equal(summary.last30DaysClicks, 3);
  assert.equal(summary.last30DaysShopeeClicks, 2);
  assert.equal(summary.last30DaysTiktokClicks, 1);
  assert.equal(summary.todayClicks, 1);
  assert.equal(summary.yesterdayClicks, 1);
  assert.equal(summary.todayShopeeClicks, 1);
  assert.equal(summary.todayTiktokClicks, 0);

  assert.deepEqual(
    summary.recentShopeeClicks.map((item) => item.clicks),
    [1, 1],
  );
  assert.deepEqual(
    Array.from(summary.trafficSourcesLast30Days.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    ),
    [
      ["facebook", 1],
      ["tiktok", 1],
      ["zalo", 1],
    ],
  );
});

test("summarizeOutboundEvents computes 30-day growth against the previous 30-day window", () => {
  const summary = summarizeOutboundEvents([
    {
      link_id: "link-1",
      destination_url: "https://shopee.vn/product/1",
      source: "facebook",
      created_at: daysAgoIso(2),
    },
    {
      link_id: "link-1",
      destination_url: "https://shopee.vn/product/2",
      source: "facebook",
      created_at: daysAgoIso(4),
    },
    {
      link_id: "link-2",
      destination_url: "https://shopee.vn/product/3",
      source: "facebook",
      created_at: daysAgoIso(40),
    },
  ]);

  assert.equal(summary.last30DaysClicks, 2);
  assert.equal(summary.growthPercentage, 100);
});

test("summarizeOutboundEvents groups today and yesterday by Vietnam time", () => {
  const referenceDate = new Date("2026-05-21T02:00:00.000Z");
  const summary = summarizeOutboundEvents(
    [
      {
        link_id: "link-1",
        destination_url: "https://shopee.vn/product/1",
        source: "facebook",
        created_at: "2026-05-20T18:30:00.000Z",
      },
      {
        link_id: "link-2",
        destination_url: "https://www.tiktok.com/@demo/video/123",
        source: "tiktok",
        created_at: "2026-05-20T15:30:00.000Z",
      },
    ],
    referenceDate,
  );

  assert.equal(summary.todayClicks, 1);
  assert.equal(summary.yesterdayClicks, 1);
  assert.equal(summary.todayShopeeClicks, 1);
  assert.equal(summary.todayTiktokClicks, 0);
  assert.deepEqual(
    summary.recentClicks.map((item) => item.date),
    ["2026-05-20", "2026-05-21"],
  );
});

test("summarizeFocusedAnalytics filters by source and today period", () => {
  const referenceDate = new Date("2026-05-21T02:00:00.000Z");
  const summary = summarizeFocusedAnalytics(
    [
      {
        link_id: "link-1",
        destination_url: "https://shopee.vn/product/1",
        source: "facebook",
        created_at: "2026-05-20T18:30:00.000Z",
      },
      {
        link_id: "link-2",
        destination_url: "https://www.tiktok.com/@demo/video/123",
        source: "tiktok",
        created_at: "2026-05-20T19:30:00.000Z",
      },
      {
        link_id: "link-3",
        destination_url: "https://shopee.vn/product/9",
        source: "facebook",
        created_at: "2026-05-20T15:30:00.000Z",
      },
    ],
    { source: "shopee", period: "today" },
    referenceDate,
  );

  assert.equal(summary.totalClicks, 1);
  assert.equal(summary.totalShopeeClicks, 1);
  assert.equal(summary.totalTiktokClicks, 0);
  assert.equal(summary.growthPercentage, 0);
  assert.deepEqual(summary.history, [{ date: "2026-05-21", clicks: 1 }]);
  assert.deepEqual(Array.from(summary.topLinkCounts.entries()), [["link-1", 1]]);
});

test("summarizeFocusedAnalytics compares 7-day data against the previous 7 days", () => {
  const referenceDate = new Date("2026-05-21T02:00:00.000Z");
  const summary = summarizeFocusedAnalytics(
    [
      {
        link_id: "link-1",
        destination_url: "https://shopee.vn/product/1",
        source: "facebook",
        created_at: "2026-05-20T18:30:00.000Z",
      },
      {
        link_id: "link-2",
        destination_url: "https://shopee.vn/product/2",
        source: "facebook",
        created_at: "2026-05-19T18:30:00.000Z",
      },
      {
        link_id: "link-3",
        destination_url: "https://shopee.vn/product/3",
        source: "facebook",
        created_at: "2026-05-12T18:30:00.000Z",
      },
    ],
    { source: "all", period: "7d" },
    referenceDate,
  );

  assert.equal(summary.totalClicks, 2);
  assert.equal(summary.growthPercentage, 100);
  assert.deepEqual(
    summary.history.map((item) => item.date),
    ["2026-05-20", "2026-05-21"],
  );
});

test("summaries ignore non-Shopee and non-TikTok outbound events", () => {
  const referenceDate = new Date("2026-05-21T02:00:00.000Z");
  const events = [
    {
      link_id: "link-1",
      destination_url: "https://shopee.vn/product/1",
      source: "facebook",
      created_at: "2026-05-20T18:30:00.000Z",
    },
    {
      link_id: "link-2",
      destination_url: "https://www.tiktok.com/@demo/video/123",
      source: "tiktok",
      created_at: "2026-05-20T18:40:00.000Z",
    },
    {
      link_id: "link-3",
      destination_url: "https://example.com/article",
      source: "direct",
      created_at: "2026-05-20T18:50:00.000Z",
    },
  ];

  const outboundSummary = summarizeOutboundEvents(events as any, referenceDate);
  const focusedSummary = summarizeFocusedAnalytics(events as any, {}, referenceDate);

  assert.equal(outboundSummary.totalClicks, 2);
  assert.equal(outboundSummary.todayClicks, 2);
  assert.equal(outboundSummary.totalShopeeClicks, 1);
  assert.equal(outboundSummary.totalTiktokClicks, 1);

  assert.equal(focusedSummary.totalClicks, 2);
  assert.equal(focusedSummary.totalShopeeClicks, 1);
  assert.equal(focusedSummary.totalTiktokClicks, 1);
  assert.deepEqual(
    focusedSummary.history,
    [{ date: "2026-05-21", clicks: 2 }],
  );
});
