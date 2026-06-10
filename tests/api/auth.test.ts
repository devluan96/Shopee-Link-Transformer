import test from "node:test";
import assert from "node:assert/strict";
import { checkAdmin } from "../../server/middleware/auth.js";
import { createMockRes } from "./testUtils.js";

test("checkAdmin allows access based on admin role", () => {
  const res = createMockRes();
  let nextCalled = false;

  checkAdmin(
    {
      authUser: { id: "user-1", email: "someone@example.com" },
      authProfile: { role: "admin" },
    } as any,
    res as any,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("checkAdmin rejects admin-by-email backdoors", () => {
  const res = createMockRes();
  let nextCalled = false;

  checkAdmin(
    {
      authUser: { id: "user-1", email: "devluan1996@gmail.com" },
      authProfile: { role: "user" },
    } as any,
    res as any,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden - Admin only" });
});

