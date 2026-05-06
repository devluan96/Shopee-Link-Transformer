import test from "node:test";
import assert from "node:assert/strict";
import { ensureSameShopeeHostname } from "../../api/utils/normalizers.js";

test("allows Shopee secondary when primary link is TikTok", () => {
  assert.doesNotThrow(() => {
    ensureSameShopeeHostname(
      "https://www.tiktok.com/@demo/video/1234567890",
      "https://shopee.vn/product/123/456",
    );
  });
});

test("blocks mismatched Shopee hosts when both primary and secondary are Shopee", () => {
  assert.throws(
    () => {
      ensureSameShopeeHostname(
        "https://shopee.vn/product/123/456",
        "https://mall.shopee.vn/product/123/456",
      );
    },
    /Shopee/i,
  );
});
