import { describe, expect, it } from "vitest";

import {
  buildRatesQuery,
  createFrankfurterClient,
  fetchCurrencies,
  fetchHistorical,
  fetchLatest,
} from "../index.js";

const makeFetch =
  (responseInit: ResponseInit, body: unknown, capture: { url?: URL }) =>
  async (input: RequestInfo | URL): Promise<Response> => {
    capture.url =
      input instanceof URL ? input : new URL(input.toString(), "http://example");
    return new Response(JSON.stringify(body), responseInit);
  };

describe("buildRatesQuery", () => {
  it("joins array values for the to query", () => {
    expect(buildRatesQuery({ to: ["EUR", "GBP"], amount: 10 })).toEqual({
      to: "EUR,GBP",
      amount: 10,
    });
  });
});

describe("FrankfurterClient requests", () => {
  it("builds the latest URL with query params", async () => {
    const capture: { url?: URL } = {};
    const fetcher = makeFetch(
      { status: 200 },
      {
        amount: 1,
        base: "USD",
        date: "2024-01-01",
        rates: { EUR: 0.9 },
      },
      capture
    );

    const client = createFrankfurterClient({
      baseUrl: "https://example.com/",
      fetch: fetcher,
    });
    await client.latest({ from: "USD", to: ["EUR", "GBP"] });

    expect(capture.url?.toString()).toBe(
      "https://example.com/latest?from=USD&to=EUR%2CGBP"
    );
  });

  it("normalizes dates for historical requests", async () => {
    const capture: { url?: URL } = {};
    const fetcher = makeFetch(
      { status: 200 },
      {
        amount: 1,
        base: "USD",
        date: "2020-05-01",
        rates: { GBP: 0.8 },
      },
      capture
    );

    const client = createFrankfurterClient({
      baseUrl: "https://example.com/",
      fetch: fetcher,
    });
    await client.historical(new Date("2020-05-01T00:00:00.000Z"), {
      from: "USD",
      to: "GBP",
    });

    expect(capture.url?.toString()).toBe(
      "https://example.com/2020-05-01?from=USD&to=GBP"
    );
  });

  it("throws with response details on errors", async () => {
    const capture: { url?: URL } = {};
    const fetcher = makeFetch({ status: 500, statusText: "Server Error" }, "nope", capture);
    const client = createFrankfurterClient({
      baseUrl: "https://example.com/",
      fetch: fetcher,
    });

    await expect(client.latest()).rejects.toThrow(
      "Frankfurter API request failed (500 Server Error): \"nope\""
    );
  });
});

describe("convenience fetch helpers", () => {
  it("fetchLatest returns the parsed response", async () => {
    const fetcher = makeFetch(
      { status: 200 },
      { amount: 1, base: "USD", date: "2024-01-01", rates: { EUR: 0.9 } },
      {}
    );

    const response = await fetchLatest(
      { from: "USD", to: "EUR" },
      { baseUrl: "https://example.com/", fetch: fetcher }
    );

    expect(response.rates).toEqual({ EUR: 0.9 });
  });

  it("fetchHistorical accepts Date inputs", async () => {
    const capture: { url?: URL } = {};
    const fetcher = makeFetch(
      { status: 200 },
      { amount: 1, base: "USD", date: "2020-01-01", rates: { JPY: 100 } },
      capture
    );

    await fetchHistorical(
      new Date("2020-01-01T00:00:00.000Z"),
      { from: "USD", to: "JPY" },
      { baseUrl: "https://example.com/", fetch: fetcher }
    );

    expect(capture.url?.toString()).toBe(
      "https://example.com/2020-01-01?from=USD&to=JPY"
    );
  });

  it("fetchCurrencies returns the currency map", async () => {
    const fetcher = makeFetch(
      { status: 200 },
      { USD: "United States Dollar", EUR: "Euro" },
      {}
    );

    const response = await fetchCurrencies({
      baseUrl: "https://example.com/",
      fetch: fetcher,
    });

    expect(response.EUR).toBe("Euro");
  });
});
