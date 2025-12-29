# frankfurter-typescript

Typescript client for the [Frankfurter API](https://frankfurter.dev/).

## Usage

```ts
import {
  createFrankfurterClient,
  fetchCurrencies,
  fetchHistorical,
  fetchLatest,
} from "./src/index.js";

const client = createFrankfurterClient();

const latest = await client.latest({ from: "USD", to: ["EUR", "GBP"] });
const historical = await client.historical("2020-05-01", {
  amount: 25,
  from: "EUR",
  to: "USD",
});
const currencies = await client.currencies();

const latestFromFunction = await fetchLatest({ from: "USD", to: "EUR" });
const historicalFromFunction = await fetchHistorical(new Date("2020-01-01"), {
  amount: 5,
  from: "USD",
  to: "JPY",
});
const currenciesFromFunction = await fetchCurrencies();

console.log({ latest, historical, currencies, latestFromFunction, historicalFromFunction, currenciesFromFunction });
```

## Notes

- Uses the public Frankfurter API (`https://api.frankfurter.app/`).
- Works in browsers and Node.js runtimes that provide `fetch`. If `fetch` is not available, pass your own implementation via `FrankfurterClientOptions`.
