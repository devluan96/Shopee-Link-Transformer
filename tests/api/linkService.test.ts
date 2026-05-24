import test from "node:test";
import assert from "node:assert/strict";

import { applyMarketingParamsToDestination } from "../../api/services/linkService.js";

test("applyMarketingParamsToDestination preserves the exact TikTok URL", () => {
  const requestedUrl =
    "  https://www.tiktok.com/view/product/1734913024708937503?_svg=1&chain_key=%7B%22t%22%3A1%7D&share_app_id=1180&utm_source=copy  ";

  const result = applyMarketingParamsToDestination(
    requestedUrl,
    requestedUrl.trim(),
    {
      tiktokAffiliateParams: "sub_id=test-a&aff_id=999",
    },
  );

  assert.equal(result, requestedUrl.trim());
});

test("applyMarketingParamsToDestination preserves the exact Shopee URL", () => {
  const requestedUrl =
    "  https://shopee.vn/product/123/456?uls_trackid=abc123&utm_source=shopee-app  ";

  const result = applyMarketingParamsToDestination(
    requestedUrl,
    requestedUrl.trim(),
    {
      shopeeAffiliateParams: "sub_id=test-a&aff_id=999",
    },
  );

  assert.equal(result, requestedUrl.trim());
});
