import { describe, test, expect } from "vitest";
import { validateTransaction } from "@/components/send-raw-transaction-form";
import type { WagmiPreparedTransaction } from "@/types/transaction";

const ADDR = "0x1234567890abcdef1234567890abcdef12345678";

describe("validateTransaction", () => {
  // ── Valid ──────────────────────────────────────────────────────────────────

  test("returns parsed object for a valid transaction", () => {
    const result = validateTransaction(JSON.stringify({ to: ADDR, chainId: 1 }));
    expect(typeof result).toBe("object");
    expect((result as WagmiPreparedTransaction).to).toBe(ADDR);
    expect((result as WagmiPreparedTransaction).chainId).toBe(1);
  });

  test("accepts optional fields alongside required ones", () => {
    const tx = JSON.stringify({
      to: ADDR,
      chainId: 137,
      value: "0x38D7EA4C68000",
      gas: "0x5208",
      nonce: 42,
    });
    const result = validateTransaction(tx);
    expect(typeof result).toBe("object");
    expect((result as WagmiPreparedTransaction).chainId).toBe(137);
  });

  test.each([
    ["eip1559 type", { to: ADDR, chainId: 1, type: "eip1559" }],
    ["legacy type", { to: ADDR, chainId: 1, type: "legacy" }],
    ["with maxFeePerGas", { to: ADDR, chainId: 1, maxFeePerGas: "0x3B9ACA00" }],
    ["with maxPriorityFeePerGas", { to: ADDR, chainId: 1, maxPriorityFeePerGas: "0x3B9ACA00" }],
    ["with data field", { to: ADDR, chainId: 1, data: "0xabcdef" }],
    ["with account field", { to: ADDR, chainId: 1, account: ADDR }],
    ["with from field", { to: ADDR, chainId: 1, from: ADDR }],
    ["chainId 8453 (Base)", { to: ADDR, chainId: 8453 }],
    ["chainId 42161 (Arbitrum)", { to: ADDR, chainId: 42161 }],
  ])("accepts %s", (_label, tx) => {
    const result = validateTransaction(JSON.stringify(tx));
    expect(typeof result).toBe("object");
  });

  // ── Empty / missing input ──────────────────────────────────────────────────

  test("returns error string for empty input", () => {
    expect(validateTransaction("")).toBe("Vui lòng nhập JSON giao dịch");
  });

  test("returns error string for whitespace-only input", () => {
    // whitespace is not empty but invalid JSON — falls into JSON parse error
    const result = validateTransaction("   ");
    expect(typeof result).toBe("string");
  });

  // ── Invalid JSON ───────────────────────────────────────────────────────────

  test("returns error string for malformed JSON", () => {
    expect(validateTransaction("{not json}")).toBe("Định dạng JSON không hợp lệ");
  });

  test("returns error string for JSON array instead of object", () => {
    expect(validateTransaction("[1, 2, 3]")).toBe("Thiếu địa chỉ 'to'");
  });

  test("returns error string for JSON string", () => {
    expect(validateTransaction('"just a string"')).toBe("Thiếu địa chỉ 'to'");
  });

  test("returns error string for JSON number", () => {
    expect(validateTransaction("42")).toBe("Thiếu địa chỉ 'to'");
  });

  test("returns error string for JSON null", () => {
    // JSON.parse("null") === null → null.to throws → caught as Invalid JSON
    expect(typeof validateTransaction("null")).toBe("string");
  });

  // ── Missing / invalid 'to' ─────────────────────────────────────────────────

  test("returns error string when 'to' is missing", () => {
    expect(validateTransaction(JSON.stringify({ chainId: 1 }))).toBe(
      "Thiếu địa chỉ 'to'"
    );
  });

  test("returns error string when 'to' is not a string", () => {
    expect(validateTransaction(JSON.stringify({ to: 12345, chainId: 1 }))).toBe(
      "Thiếu địa chỉ 'to'"
    );
  });

  test("returns error string when 'to' is null", () => {
    expect(validateTransaction(JSON.stringify({ to: null, chainId: 1 }))).toBe(
      "Thiếu địa chỉ 'to'"
    );
  });

  test("returns error string when 'to' is an object", () => {
    expect(validateTransaction(JSON.stringify({ to: {}, chainId: 1 }))).toBe(
      "Thiếu địa chỉ 'to'"
    );
  });

  // ── Missing / invalid 'chainId' ───────────────────────────────────────────

  test("returns error string when 'chainId' is missing", () => {
    expect(validateTransaction(JSON.stringify({ to: ADDR }))).toBe(
      "Thiếu hoặc sai 'chainId' (phải là số)"
    );
  });

  test("returns error string when 'chainId' is a string instead of number", () => {
    expect(
      validateTransaction(JSON.stringify({ to: ADDR, chainId: "1" }))
    ).toBe("Thiếu hoặc sai 'chainId' (phải là số)");
  });

  test("returns error string when 'chainId' is null", () => {
    expect(
      validateTransaction(JSON.stringify({ to: ADDR, chainId: null }))
    ).toBe("Thiếu hoặc sai 'chainId' (phải là số)");
  });

  test("returns error string when 'chainId' is a boolean", () => {
    expect(
      validateTransaction(JSON.stringify({ to: ADDR, chainId: true }))
    ).toBe("Thiếu hoặc sai 'chainId' (phải là số)");
  });

  // ── Return type discrimination ─────────────────────────────────────────────

  test("valid input returns non-string (object)", () => {
    const result = validateTransaction(JSON.stringify({ to: ADDR, chainId: 1 }));
    expect(typeof result).not.toBe("string");
  });

  test("invalid input always returns a string", () => {
    const invalids = [
      "",
      "{}",
      JSON.stringify({ to: ADDR }),
      JSON.stringify({ chainId: 1 }),
      "{bad}",
    ];
    for (const input of invalids) {
      expect(typeof validateTransaction(input)).toBe("string");
    }
  });
});
