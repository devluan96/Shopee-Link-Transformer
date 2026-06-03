import test from "node:test";
import assert from "node:assert/strict";
import { deleteLink } from "../../api/services/linkService.js";
import { insertOutboundEvent } from "../../api/utils/clickTracking.js";

test("insertOutboundEvent persists workspace scope", async () => {
  let insertedPayload: Record<string, unknown> | null = null;
  const supabase = {
    from(table: string) {
      assert.equal(table, "link_outbound_events");
      return {
        insert(payload: Record<string, unknown>) {
          insertedPayload = payload;
          return Promise.resolve({ error: null });
        },
      };
    },
  } as any;

  const inserted = await insertOutboundEvent(supabase, {
    link_id: "link-1",
    short_code: "abc123",
    workspace_id: "workspace-1",
    stage: "primary",
    destination_url: "https://shopee.vn/product/1",
  });

  assert.equal(inserted, true);
  assert.equal(insertedPayload?.workspace_id, "workspace-1");
});

test("deleteLink keeps click history rows intact", async () => {
  const deletedTables: string[] = [];
  const supabase = {
    from(table: string) {
      if (table === "links") {
        return {
          select(columns: string) {
            assert.match(columns, /workspace_id/);
            return {
              eq(column: string, value: string) {
                assert.equal(column, "id");
                assert.equal(value, "link-1");
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: "link-1",
                      user_id: "user-1",
                      workspace_id: null,
                    },
                    error: null,
                  }),
                };
              },
            };
          },
          delete() {
            deletedTables.push(table);
            return {
              eq(column: string, value: string) {
                assert.equal(column, "id");
                assert.equal(value, "link-1");
                return {
                  select() {
                    return {
                      maybeSingle: async () => ({
                        data: { id: "link-1" },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "notification_logs") {
        return {
          delete() {
            deletedTables.push(table);
            return {
              eq(column: string, value: string) {
                assert.equal(column, "link_id");
                assert.equal(value, "link-1");
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as any;

  await deleteLink(supabase, "link-1", "user-1");

  assert.deepEqual(deletedTables, ["notification_logs", "links"]);
});
