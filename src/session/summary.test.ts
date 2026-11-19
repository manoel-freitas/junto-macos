import { describe, expect, it } from "vitest";
import { daySummaryLines, type SessionRecord } from "./summary";

describe("daySummaryLines", () => {
  it("formats three lines", () => {
    const records: SessionRecord[] = [
      {
        goal: "PR do login",
        durationLabel: "25",
        startedAt: "",
        endedAt: "",
        focusMs: 50 * 60 * 1000,
        outcome: "sim",
        activeApp: "Code",
      },
      {
        goal: "emails",
        durationLabel: "25",
        startedAt: "",
        endedAt: "",
        focusMs: 25 * 60 * 1000,
        outcome: "parcial",
        activeApp: "Mail",
      },
    ];
    const lines = daySummaryLines(records, "19/11/2026");
    expect(lines[0]).toMatch(/2 sessões/);
    expect(lines[1]).toMatch(/1 metas concluídas, 1 parciais/);
    expect(lines[2]).toMatch(/Mais longa/);
  });
});