import { describe, expect, it } from "vitest";

import {
  createFrankfurterClient,
  fetchCurrencies,
  fetchHistorical,
  fetchLatest,
} from "../index.js";

const hasFetch = typeof fetch !== "undefined";

const isApiReachable = async (): Promise<boolean> => {
  if (!hasFetch) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch("https://api.frankfurter.app/latest", {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const canReachApi = await isApiReachable();
const describeIf = canReachApi ? describe : describe.skip;

describeIf("Frankfurter integration", () => {
  it(
    "fetchLatest returns live rates",
    async () => {
      const response = await fetchLatest({ from: "USD", to: "EUR" });

      expect(response.base).toBe("USD");
      expect(response.rates.EUR).toBeTypeOf("number");
      expect(response.rates.EUR).toBeGreaterThan(0);
    },
    { timeout: 10000 }
  );

  it(
    "fetchHistorical returns rates for a specific day",
    async () => {
      const response = await fetchHistorical("2020-01-01", {
        from: "USD",
        to: "JPY",
      });

      expect(response.date).toBe("2020-01-01");
      expect(response.rates.JPY).toBeTypeOf("number");
      expect(response.rates.JPY).toBeGreaterThan(0);
    },
    { timeout: 10000 }
  );

  it(
    "createFrankfurterClient can fetch currencies",
    async () => {
      const client = createFrankfurterClient();
      const response = await client.currencies();

      expect(response.USD).toMatch(/dollar/i);
    },
    { timeout: 10000 }
  );

  it(
    "fetchCurrencies returns currency map",
    async () => {
      const response = await fetchCurrencies();

      expect(response.EUR).toBeTruthy();
    },
    { timeout: 10000 }
  );
});
