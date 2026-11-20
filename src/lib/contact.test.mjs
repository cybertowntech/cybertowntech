import { test, expect } from "bun:test";
import { WHATSAPP_NUMBER, whatsappUrl } from "./contact.ts";

test("WhatsApp enquiries use the owner's supplied Malaysian number", () => {
  expect(WHATSAPP_NUMBER).toBe("+601128043301");
  expect(new URL(whatsappUrl()).pathname).toBe("/601128043301");
});