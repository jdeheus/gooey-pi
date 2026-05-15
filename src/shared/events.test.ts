import { describe, expect, it } from "vitest";
import { createAppEventId } from "./events";

describe("createAppEventId", () => {
  it("creates deterministic padded IDs", () => {
    expect(createAppEventId("evt", 7)).toBe("evt-0007");
  });
});
