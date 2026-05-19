import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OUTPUT_DOMAIN,
  DEFAULT_OUTPUT_DOMAINS,
  normalizeOutputDomains,
} from "../../api/config/outputDomains.js";

test("normalizes configured output domains and removes invalid entries", () => {
  assert.deepEqual(
    normalizeOutputDomains([
      " https://test.hotsnew.click/ ",
      "STAGING.hotsnew.click",
      "invalid domain",
      "",
      "https://test.hotsnew.click",
    ]),
    ["test.hotsnew.click", "staging.hotsnew.click"],
  );
});

test("falls back to the default output domain when the list is empty", () => {
  assert.deepEqual(normalizeOutputDomains([]), ["hotsnew.click"]);
});

test("exports a usable default output domain", () => {
  assert.ok(DEFAULT_OUTPUT_DOMAINS.length >= 1);
  assert.equal(DEFAULT_OUTPUT_DOMAINS[0], DEFAULT_OUTPUT_DOMAIN);
});
