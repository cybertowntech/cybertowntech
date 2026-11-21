import { test, expect } from "bun:test";
import { allocateCartDiscount } from "./cart-pricing.ts";

test("RM0 products remain claimable without a voucher", () => {
  expect(allocateCartDiscount([0, 0], 0)).toEqual([{ amount: 0, discount: 0 }, { amount: 0, discount: 0 }]);
});

test("a full-cart discount produces an RM0 payment", () => {
  expect(allocateCartDiscount([89, 129], 218).map((line) => line.amount)).toEqual([0, 0]);
});

test("all order amounts add up to one exact payment after rounding", () => {
  const lines = allocateCartDiscount([1, 1, 1], 1);
  expect(lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0)).toBe(200);
  expect(lines.reduce((sum, line) => sum + Math.round(line.discount * 100), 0)).toBe(100);
});