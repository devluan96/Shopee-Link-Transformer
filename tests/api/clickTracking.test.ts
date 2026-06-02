import test from "node:test";
import assert from "node:assert/strict";
import {
  attachTrackedSourcesToLinks,
  countDisplayableOutboundClicks,
  fetchOutboundEventsForWorkspaceIds,
} from "../../api/utils/clickTracking.js";

test("attachTrackedSourcesToLinks counts TikTok outbound clicks separately", async () => {
  const mockOutboundEvents = [
    {
      id: "evt-1",
      link_id: "link-1",
      short_code: "abc123",
      stage: "primary",
      destination_url: "https://shopee.vn/product/1",
      source: "facebook",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.1",
      created_at: "2026-05-07T00:00:00.000Z",
    },
    {
      id: "evt-2",
      link_id: "link-1",
      short_code: "abc123",
      stage: "secondary",
      destination_url: "https://www.tiktok.com/@demo/video/123",
      source: "tiktok",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.1",
      created_at: "2026-05-07T00:01:00.000Z",
    },
  ];

  const supabase = {
    from(table: string) {
      assert.equal(table, "link_outbound_events");
      return {
        select(columns: string) {
          assert.match(columns, /destination_url/);
          return {
            in(column: string, values: string[]) {
              assert.equal(column, "link_id");
              assert.deepEqual(values, ["link-1"]);
              return {
                order(orderColumn: string, options: { ascending: boolean }) {
                  assert.equal(orderColumn, "created_at");
                  assert.deepEqual(options, { ascending: false });
                  return {
                    range(start: number, end: number) {
                      assert.deepEqual([start, end], [0, 999]);
                      return Promise.resolve({
                        data: mockOutboundEvents,
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  } as any;

  const [link] = await attachTrackedSourcesToLinks(supabase, [
    { id: "link-1", short_code: "abc123" },
  ]);

  assert.equal(link.clicks, 1);
  assert.equal(link.tiktok_clicks, 1);
  assert.deepEqual(link.tracked_sources, [{ label: "facebook", count: 1 }]);
});

test("fetchOutboundEventsForWorkspaceIds paginates past the first 1000 rows", async () => {
  const firstPage = Array.from({ length: 1000 }, (_, index) => ({
    id: `evt-${index + 1}`,
    link_id: "link-1",
    short_code: "abc123",
    workspace_id: "workspace-1",
    stage: "primary",
    destination_url: "https://shopee.vn/product/1",
    source: "facebook",
    source_detail: null,
    referer: null,
    user_agent: "Mozilla/5.0",
    ip_address: "1.1.1.1",
    created_at: "2026-05-07T00:00:00.000Z",
  }));
  const secondPage = [
    {
      id: "evt-1001",
      link_id: "link-2",
      short_code: "def456",
      workspace_id: "workspace-1",
      stage: "primary",
      destination_url: "https://www.tiktok.com/@demo/video/123",
      source: "tiktok",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.2",
      created_at: "2026-05-06T00:00:00.000Z",
    },
  ];

  const supabase = {
    from(table: string) {
      assert.equal(table, "link_outbound_events");
      return {
        select(columns: string) {
          assert.match(columns, /workspace_id/);
          return {
            in(column: string, values: string[]) {
              assert.equal(column, "workspace_id");
              assert.deepEqual(values, ["workspace-1"]);
              return {
                order(orderColumn: string, options: { ascending: boolean }) {
                  assert.equal(orderColumn, "created_at");
                  assert.deepEqual(options, { ascending: false });
                  return {
                    range(start: number, end: number) {
                      if (start === 0 && end === 999) {
                        return Promise.resolve({ data: firstPage, error: null });
                      }
                      if (start === 1000 && end === 1999) {
                        return Promise.resolve({ data: secondPage, error: null });
                      }
                      return Promise.resolve({ data: [], error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  } as any;

  const events = await fetchOutboundEventsForWorkspaceIds(supabase, ["workspace-1"]);

  assert.equal(events.length, 1001);
  assert.equal(events[0].id, "evt-1");
  assert.equal(events[1000].id, "evt-1001");
});

test("countDisplayableOutboundClicks matches link card totals", () => {
  const total = countDisplayableOutboundClicks([
    {
      id: "evt-1",
      link_id: "link-1",
      short_code: "abc123",
      stage: "primary",
      destination_url: "https://shopee.vn/product/1",
      source: "facebook",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.1",
      created_at: "2026-05-07T00:00:00.000Z",
    },
    {
      id: "evt-2",
      link_id: "link-1",
      short_code: "abc123",
      stage: "secondary",
      destination_url: "https://www.tiktok.com/@demo/video/123",
      source: "tiktok",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.1",
      created_at: "2026-05-07T00:01:00.000Z",
    },
    {
      id: "evt-3",
      link_id: "link-1",
      short_code: "abc123",
      stage: "primary",
      destination_url: "https://example.com/article",
      source: "direct",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.2",
      created_at: "2026-05-07T00:02:00.000Z",
    },
    {
      id: "evt-4",
      link_id: "link-1",
      short_code: "abc123",
      stage: "primary",
      destination_url: "https://youtube.com/watch?v=demo",
      source: "youtube",
      source_detail: null,
      referer: null,
      user_agent: "Mozilla/5.0",
      ip_address: "1.1.1.3",
      created_at: "2026-05-07T00:03:00.000Z",
    },
  ] as any);

  assert.equal(total, 2);
});
