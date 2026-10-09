import type { Page } from "@playwright/test";

/** The Card (components/ui/card.tsx) whose heading is `title`. */
export function card(page: Page, title: string) {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' bg-surface ')][1]");
}
