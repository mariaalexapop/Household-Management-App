import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up React Testing Library after each test
afterEach(() => {
  cleanup();
});

export {};
