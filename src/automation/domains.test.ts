import { describe, expect, it } from "vitest";
import { extractHostname, matchDistractionCategory } from "./domains";

describe("extractHostname", () => {
  it("parses URLs", () => {
    expect(extractHostname("https://www.YouTube.com/shorts/abc")).toBe(
      "youtube.com",
    );
  });
});

describe("matchDistractionCategory", () => {
  const all = new Set([
    "short_video",
    "social",
    "streaming",
    "games",
    "betting",
    "shopping",
    "news",
  ]);

  it("short video first", () => {
    const m = matchDistractionCategory(
      "https://youtube.com/shorts/x",
      all,
    );
    expect(m?.id).toBe("short_video");
  });

  it("respects disabled categories", () => {
    const enabled = new Set(["social"]);
    const m = matchDistractionCategory("https://tiktok.com/@u", enabled);
    expect(m).toBeNull();
  });

  it("matches streaming youtube watch", () => {
    const enabled = new Set(["streaming"]);
    const m = matchDistractionCategory("https://youtube.com/watch?v=1", enabled);
    expect(m?.id).toBe("streaming");
  });
});