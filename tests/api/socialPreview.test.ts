import test from "node:test";
import assert from "node:assert/strict";
import {
  isMetaPreviewBot,
  isSocialPreviewBot,
} from "../../api/utils/socialPreview.js";

test("detects legacy Facebook preview bot", () => {
  assert.equal(
    isSocialPreviewBot(
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    ),
    true,
  );
});

test("detects Meta external preview bots", () => {
  assert.equal(
    isSocialPreviewBot(
      "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
    ),
    true,
  );
  assert.equal(
    isSocialPreviewBot(
      "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
    ),
    true,
  );
  assert.equal(
    isMetaPreviewBot(
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    ),
    true,
  );
  assert.equal(
    isMetaPreviewBot(
      "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
    ),
    true,
  );
});

test("does not mark normal browsers as social preview bots", () => {
  assert.equal(
    isSocialPreviewBot(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36",
    ),
    false,
  );
  assert.equal(
    isMetaPreviewBot(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36",
    ),
    false,
  );
});
