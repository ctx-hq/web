import { describe, it, expect } from "vitest";
import { DeviceLoginPage } from "../../src/pages/device-login";

describe("DeviceLoginPage", () => {
  it("renders code input with correct attributes", () => {
    const html = DeviceLoginPage({ code: "" })!.toString();
    expect(html).toContain('name="user_code"');
    expect(html).toContain('maxlength="8"');
    expect(html).toContain('pattern="[A-Za-z0-9]+"');
    expect(html).toContain('autocomplete="off"');
    expect(html).toContain("required");
  });

  it("pre-fills code when provided", () => {
    const html = DeviceLoginPage({ code: "ABC12345" })!.toString();
    expect(html).toContain('value="ABC12345"');
  });

  it("renders empty value when no code", () => {
    const html = DeviceLoginPage({})!.toString();
    expect(html).toContain('value=""');
  });

  it("renders authorize button", () => {
    const html = DeviceLoginPage({})!.toString();
    expect(html).toContain("Authorize");
    expect(html).toContain('type="submit"');
  });

  it("contains informational text about granting access", () => {
    const html = DeviceLoginPage({})!.toString();
    expect(html).toContain("ctx");
    expect(html).toContain("access to your getctx.org account");
  });

  it("contains data-device-form for client JS", () => {
    const html = DeviceLoginPage({})!.toString();
    expect(html).toContain("data-device-form");
  });

  it("contains aria-live region for status messages", () => {
    const html = DeviceLoginPage({})!.toString();
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-device-msg="success"');
    expect(html).toContain('data-device-msg="error"');
    expect(html).toContain('data-device-msg="loading"');
  });
});
