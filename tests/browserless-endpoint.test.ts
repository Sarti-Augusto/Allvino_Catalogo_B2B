import assert from "node:assert/strict";
import { resolveBrowserlessEndpoint } from "../src/lib/browserless";

assert.equal(resolveBrowserlessEndpoint(undefined), undefined);
assert.equal(resolveBrowserlessEndpoint("   "), undefined);

assert.equal(
  resolveBrowserlessEndpoint("browserless-token"),
  "wss://production-sfo.browserless.io?token=browserless-token"
);

assert.equal(
  resolveBrowserlessEndpoint("token with reserved?/characters"),
  "wss://production-sfo.browserless.io?token=token%20with%20reserved%3F%2Fcharacters"
);

assert.equal(
  resolveBrowserlessEndpoint(
    "wss://production-ams.browserless.io?token=browserless-token"
  ),
  "wss://production-ams.browserless.io?token=browserless-token"
);

assert.equal(
  resolveBrowserlessEndpoint(
    "https://production-sfo.browserless.io?token=browserless-token"
  ),
  "wss://production-sfo.browserless.io/?token=browserless-token"
);

assert.throws(
  () => resolveBrowserlessEndpoint("ftp://production-sfo.browserless.io"),
  /token ou uma URL HTTP\/WebSocket válida/
);

console.log("browserless endpoint tests passed");
