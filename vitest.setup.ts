import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up React Testing Library after each test
afterEach(() => {
  cleanup();
});

// Stub global fetch if not available in jsdom
if (typeof globalThis.fetch === "undefined") {
  // @ts-expect-error — jsdom does not include fetch; stub for unit tests
  globalThis.fetch = () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
}

export {};
