import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** The disposable account the signed-in specs share; the teardown project deletes it. */
export type TestAccount = { email: string; password: string; displayName: string };

const AUTH_DIR = path.join(__dirname, "..", ".auth");
export const STATE_FILE = path.join(AUTH_DIR, "state.json");
const ACCOUNT_FILE = path.join(AUTH_DIR, "account.json");

export function newTestAccount(): TestAccount {
  const stamp = Date.now();
  return {
    email: `borocean-e2e-${stamp}@mailinator.com`,
    password: `E2e-${stamp}-pass`,
    displayName: "E2E Tester",
  };
}

export function saveAccount(account: TestAccount) {
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(ACCOUNT_FILE, JSON.stringify(account, null, 2));
}

export function loadAccount(): TestAccount {
  return JSON.parse(readFileSync(ACCOUNT_FILE, "utf8")) as TestAccount;
}
