export type CurrencyCode = string;

export interface RatesResponse {
  amount: number;
  base: CurrencyCode;
  date: string;
  rates: Record<CurrencyCode, number>;
}

export type CurrenciesResponse = Record<CurrencyCode, string>;

export interface RatesQuery {
  amount?: number;
  from?: CurrencyCode;
  to?: CurrencyCode | CurrencyCode[];
}

export interface FrankfurterClientOptions {
  baseUrl?: string;
  fetch?: FetchLike;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class FrankfurterClient {
  private readonly baseUrl: string;
  private readonly fetcher: FetchLike;

  constructor(options: FrankfurterClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.frankfurter.app/";
    this.fetcher = options.fetch ?? resolveFetch();
  }

  async latest(query: RatesQuery = {}): Promise<RatesResponse> {
    return this.request<RatesResponse>(
      "latest",
      buildRatesQuery(query) as Record<string, string | number | undefined>
    );
  }

  async historical(
    date: string | Date,
    query: RatesQuery = {}
  ): Promise<RatesResponse> {
    const normalizedDate = normalizeDate(date);
    return this.request<RatesResponse>(
      normalizedDate,
      buildRatesQuery(query) as Record<string, string | number | undefined>
    );
  }

  async currencies(): Promise<CurrenciesResponse> {
    return this.request<CurrenciesResponse>("currencies");
  }

  private async request<T>(
    path: string,
    query?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = buildUrl(this.baseUrl, path, query);
    const response = await this.fetcher(url);

    if (!response.ok) {
      const message = await safeReadError(response);
      throw new Error(
        `Frankfurter API request failed (${response.status} ${response.statusText})${message}`
      );
    }

    return (await response.json()) as T;
  }
}

export const createFrankfurterClient = (
  options?: FrankfurterClientOptions
): FrankfurterClient => new FrankfurterClient(options);

const resolveFetch = (): FetchLike => {
  if (typeof fetch !== "undefined") {
    return fetch.bind(globalThis);
  }

  throw new Error(
    "Global fetch is not available. Provide a fetch implementation in FrankfurterClientOptions."
  );
};

const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>
): URL => {
  const url = new URL(path, baseUrl);
  if (!query) {
    return url;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};

const normalizeDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
};

const safeReadError = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    return text ? `: ${text}` : "";
  } catch {
    return "";
  }
};

export const buildRatesQuery = (query: RatesQuery = {}): RatesQuery => {
  if (Array.isArray(query.to)) {
    return {
      ...query,
      to: query.to.join(","),
    };
  }

  return query;
};

export const fetchLatest = async (
  query: RatesQuery = {},
  options?: FrankfurterClientOptions
): Promise<RatesResponse> => {
  const client = new FrankfurterClient(options);
  return client.latest(buildRatesQuery(query));
};

export const fetchHistorical = async (
  date: string | Date,
  query: RatesQuery = {},
  options?: FrankfurterClientOptions
): Promise<RatesResponse> => {
  const client = new FrankfurterClient(options);
  return client.historical(date, buildRatesQuery(query));
};

export const fetchCurrencies = async (
  options?: FrankfurterClientOptions
): Promise<CurrenciesResponse> => {
  const client = new FrankfurterClient(options);
  return client.currencies();
};
