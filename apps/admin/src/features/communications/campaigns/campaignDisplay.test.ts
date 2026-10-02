import { describe, expect, it } from "vitest";
import { canCancel, canSend, deliveryRate, percent, readRate } from "./campaignDisplay";

const progress = { recipients: 10, sent: 8, delivered: 4, read: 1, failed: 2 };

describe("campaign rates", () => {
  it("never divides by zero", () => {
    expect(percent(1, 0)).toBe(0);
    expect(deliveryRate({ ...progress, sent: 0, delivered: 0 })).toBe(0);
  });

  it("measures delivery against sent and reads against delivered", () => {
    expect(deliveryRate(progress)).toBe(50);
    expect(readRate(progress)).toBe(25);
  });
});

describe("campaign actions", () => {
  it("only lets a campaign that has not finished be sent, and one that has not started be cancelled", () => {
    expect(canSend("draft")).toBe(true);
    expect(canSend("completed")).toBe(false);
    expect(canCancel("scheduled")).toBe(true);
    expect(canCancel("sending")).toBe(false);
  });
});
