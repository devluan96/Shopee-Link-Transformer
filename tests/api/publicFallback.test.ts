import test from "node:test";
import assert from "node:assert/strict";
import {
  renderPublicLinkNotFoundPage,
  shouldReturnPublicLinkNotFound,
} from "../../server/utils/publicFallback.js";

test("returns slug 404 only for public single-segment paths", () => {
  assert.equal(shouldReturnPublicLinkNotFound("/slug-khong-ton-tai"), true);
  assert.equal(shouldReturnPublicLinkNotFound("/discover/pricing"), false);
  assert.equal(shouldReturnPublicLinkNotFound("/robots.txt"), false);
  assert.equal(shouldReturnPublicLinkNotFound("/s/abc123"), false);
});

test("renders not found html with escaped path", () => {
  const html = renderPublicLinkNotFoundPage("/slug-<script>");
  assert.match(html, /Link không tồn tại/);
  assert.match(html, /\/slug-&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

