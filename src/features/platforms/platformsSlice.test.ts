import { describe, expect, it } from "vitest";
import platformsReducer, { togglePlatform } from "./platformsSlice";

describe("platforms slice", () => {
  it("keeps platform data normalized and updates the selected platform ids", () => {
    const state = platformsReducer(undefined, { type: "@@INIT" });
    const nextState = platformsReducer(state, togglePlatform("instagram"));

    expect(nextState.ids).toEqual(["x", "instagram", "facebook", "linkedin"]);
    expect(nextState.entities.instagram.label).toBe("Instagram");
    expect(nextState.selectedPlatformIds).toEqual(["x", "instagram"]);
  });
});
