import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_FEATURE_LIMITS,
  PLAN_FEATURE_LIMITS,
  getFeatureLimitsForProfile,
} from "../../api/services/featureLimitService.js";

test("monthly and yearly plans expose different feature quotas", () => {
  assert.equal(PLAN_FEATURE_LIMITS.monthly.dailyVideoUploads, 10);
  assert.equal(PLAN_FEATURE_LIMITS.yearly.dailyVideoUploads, 30);
  assert.equal(PLAN_FEATURE_LIMITS.monthly.maxTeamWorkspaces, 1);
  assert.equal(PLAN_FEATURE_LIMITS.yearly.maxTeamWorkspaces, 5);
  assert.equal(PLAN_FEATURE_LIMITS.monthly.maxTeamMembersPerWorkspace, 3);
  assert.equal(PLAN_FEATURE_LIMITS.yearly.maxTeamMembersPerWorkspace, 20);
  assert.equal(PLAN_FEATURE_LIMITS.monthly.canUseAbTesting, false);
  assert.equal(PLAN_FEATURE_LIMITS.yearly.canUseAbTesting, true);
});

test("admin profile receives unlimited feature limits", () => {
  const limits = getFeatureLimitsForProfile({
    role: "admin",
    subscription_plan: "free",
  });

  assert.deepEqual(limits, ADMIN_FEATURE_LIMITS);
});
