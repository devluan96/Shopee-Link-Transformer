import test from "node:test";
import assert from "node:assert/strict";
import { updateUserRole } from "../../api/services/userService.js";
import { logAdminAction } from "../../api/services/securityService.js";

test("updateUserRole updates the target profile role", async () => {
  let capturedRole: string | null = null;

  const supabase = {
    from(table: string) {
      if (table === "profiles") {
        return {
          update(payload: { role: string }) {
            capturedRole = payload.role;
            return {
              eq() {
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: { id: "user-1", role: payload.role },
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

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const profile = await updateUserRole(supabase as never, "user-1", "admin");

  assert.equal(capturedRole, "admin");
  assert.equal(profile.role, "admin");
});

test("logAdminAction writes an audit record for admin actions", async () => {
  let insertedPayload: Record<string, unknown> | null = null;

  const supabase = {
    from(table: string) {
      if (table === "access_logs") {
        return {
          insert(payload: Record<string, unknown>) {
            insertedPayload = payload;
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  await logAdminAction(supabase as never, {
    actorUserId: "admin-1",
    actorEmail: "admin@example.com",
    action: "update_user_role",
    targetUserId: "user-1",
    targetType: "profile",
    metadata: { role: "admin" },
  });

  assert.ok(insertedPayload);
  assert.equal(insertedPayload?.method, "ADMIN");
  assert.equal(insertedPayload?.path, "admin:update_user_role");
  assert.deepEqual(insertedPayload?.metadata, {
    kind: "admin_action",
    action: "update_user_role",
    target_user_id: "user-1",
    target_id: null,
    target_type: "profile",
    role: "admin",
  });
});
