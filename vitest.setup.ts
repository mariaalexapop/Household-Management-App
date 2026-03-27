import { config } from "dotenv";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Load .env.local for integration tests (Supabase URL, service role key, etc.)
config({ path: ".env.local" });

// Clean up React Testing Library after each test
afterEach(() => {
  cleanup();
});

export {};
