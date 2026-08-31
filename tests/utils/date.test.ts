import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatTime } from "../../app/utils/date";

describe("date utils", () => {
  it("formatDate should format valid dates as YYYY/MM/DD", () => {
    const d = new Date(2026, 7, 31); // 2026-08-31
    expect(formatDate(d)).toBe("2026/08/31");
    expect(formatDate("2026-08-31T00:00:00Z")).toBe("2026/08/31");
  });

  it("formatDate should return fallback on invalid or empty date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("invalid-date")).toBe("-");
    expect(formatDate(null, "N/A")).toBe("N/A");
  });

  it("formatDateTime should format valid dates as YYYY/MM/DD HH:mm", () => {
    const d = new Date(2026, 7, 31, 9, 5); // 2026-08-31 09:05
    expect(formatDateTime(d)).toBe("2026/08/31 09:05");
  });

  it("formatTime should format valid times as HH:mm", () => {
    const d = new Date(2026, 7, 31, 14, 30);
    expect(formatTime(d)).toBe("14:30");
  });
});
