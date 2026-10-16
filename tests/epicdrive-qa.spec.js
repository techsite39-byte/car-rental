import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

const vehicles = [
  ["Kia Clavis", "/carsimg/kiaklavis.png", "7", "Petrol", "₹4,000"],
  ["Maruti Suzuki Ertiga", "/carsimg/suzukietiga.png", "7", "Petrol", "₹3,000"],
  ["Maruti Suzuki Brezza", "/carsimg/suzukibreza.png", "5", "Petrol", "₹2,500"],
  ["Renault Kiger", "/carsimg/renaultkiger.png", "5", "Petrol", "₹2,300"],
  ["Maruti Suzuki Dzire", "/carsimg/suzukidzire.png", "5", "CNG", "₹2,000"],
  ["Maruti Suzuki Celerio", "/carsimg/suzukicelerio.png", "5", "Petrol", "₹1,700"],
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
];

test.describe("EPICDRIVE responsive QA", () => {
  for (const viewport of viewports) {
    test(`homepage has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).toContainText("Kia Clavis");
      await expect(page.getByText("6 vehicles shown")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    });
  }

  test("fleet shows the six supplied vehicles with matching images and data", async ({ page }) => {
    await page.goto(`${baseURL}/fleet`, { waitUntil: "domcontentloaded" });
    const cards = page.locator("article");
    await expect(cards).toHaveCount(6);

    for (const [index, [name, image, seats, fuel, price]] of vehicles.entries()) {
      const card = cards.nth(index);
      await expect(card).toContainText(name);
      await expect(card).toContainText(`Seats${seats}`);
      await expect(card).toContainText(`Fuel${fuel}`);
      await expect(card).toContainText(price);
      await expect(card.locator("img")).toHaveAttribute("src", new RegExp(encodeURIComponent(image)));
      expect(await card.locator("img").evaluate((img) => img.complete && img.naturalWidth > 0)).toBeTruthy();
    }
  });

  test("fleet category filters show only applicable vehicles", async ({ page }) => {
    await page.goto(`${baseURL}/fleet`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "SUV", exact: true }).click();
    await expect(page.locator("article")).toHaveCount(3);
    await expect(page.locator("body")).toContainText("Kia Clavis");
    await expect(page.locator("body")).toContainText("Maruti Suzuki Brezza");
    await expect(page.locator("body")).toContainText("Renault Kiger");

    await page.getByRole("button", { name: "Sedan", exact: true }).click();
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.locator("article")).toContainText("Maruti Suzuki Dzire");

    await page.getByRole("button", { name: "Sport", exact: true }).click();
    await expect(page.locator("article")).toHaveCount(0);
    await expect(page.getByText(/no vehicles/i)).toBeVisible();
  });

  test("choose-car vehicle selection updates image and specifications", async ({ page }) => {
    await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
    const vehicleSelect = page.getByRole("combobox", { name: "Choose a vehicle" });
    await vehicleSelect.selectOption({ label: "Maruti Suzuki Brezza" });
    await page.locator("[data-hero-vehicle]").scrollIntoViewIfNeeded();
    await expect(page.locator("body")).toContainText("₹2,500/day");
    await expect(page.locator("body")).toContainText("Maruti Suzuki Brezza");
    await expect(page.locator('img[src*="suzukibreza.png"]')).toBeVisible();
  });

  test("booking form keeps vehicle data and validates without submitting", async ({ page }) => {
    await page.goto(`${baseURL}/booking?vehicle=kia-clavis`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("combobox", { name: /Choose your vehicle/ })).toHaveValue("kia-clavis");
    await expect(page.getByText(/Starting at ₹4,000 \/ day/)).toBeVisible();

    await page.getByRole("radio", { name: "With driver" }).check();
    await page.getByRole("checkbox", { name: /Round trip/ }).uncheck();
    await expect(page.getByRole("radio", { name: "With driver" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /Round trip/ })).not.toBeChecked();

    const pickup = page.getByRole("textbox", { name: "Pick-up date" });
    const ret = page.getByRole("textbox", { name: "Return date" });
    await pickup.fill("2099-12-20");
    await ret.fill("2099-12-19");
    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await expect(page.getByText(/return date|after|valid/i).first()).toBeVisible();
  });
});
