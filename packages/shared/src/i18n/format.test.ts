import { test } from "node:test";
import * as assert from "node:assert/strict";
import { formatChange, formatSignedPercent } from "./format";

// Intl puts a narrow no-break space in some currency formats; compare on plain spaces.
const plain = (s: string) => s.replace(/ | /g, " ");

test("change percent follows the locale's decimal separator", () => {
  assert.equal(plain(formatChange(4.08, 1, "USD", "tr")), "+$4,08 (+%1,00)");
  assert.equal(plain(formatChange(4.08, 1, "USD", "en")), "+$4.08 (+1.00%)");
});

test("negative change keeps a single minus sign", () => {
  assert.equal(plain(formatChange(-2.5, -0.61, "USD", "en")), "-$2.50 (-0.61%)");
});

test("signed percent matches formatChange's percent style", () => {
  assert.equal(plain(formatSignedPercent(1.25, "tr")), "+%1,3");
});
