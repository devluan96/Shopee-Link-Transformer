import test from "node:test";
import assert from "node:assert/strict";
import { attachTrackedSourcesToLinks } from "../../api/utils/clickTracking.js";

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
                    limit(limitValue: number) {
                      assert.equal(limitValue, 10000);
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
