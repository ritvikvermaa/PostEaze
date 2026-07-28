import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { PLATFORM_CONFIG } from "../../configuration";
import type { PlatformId } from "../../types";

export type PlatformsState = {
  entities: Record<string, (typeof PLATFORM_CONFIG)[PlatformId]>;
  ids: PlatformId[];
  selectedPlatformIds: PlatformId[];
  status: "idle" | "loading";
};

const platformIds = Object.keys(PLATFORM_CONFIG) as PlatformId[];

const initialState: PlatformsState = {
  entities: Object.fromEntries(platformIds.map((platformId) => [platformId, PLATFORM_CONFIG[platformId]])) as Record<string, (typeof PLATFORM_CONFIG)[PlatformId]>,
  ids: platformIds,
  selectedPlatformIds: ["x"],
  status: "idle",
};

const platformsSlice = createSlice({
  name: "platforms",
  initialState,
  reducers: {
    setPlatforms(state, action: PayloadAction<PlatformId[]>) {
      state.selectedPlatformIds = action.payload;
    },
    togglePlatform(state, action: PayloadAction<PlatformId>) {
      const platformId = action.payload;
      if (state.selectedPlatformIds.includes(platformId)) {
        state.selectedPlatformIds = state.selectedPlatformIds.filter((id) => id !== platformId);
        return;
      }

      state.selectedPlatformIds = [...state.selectedPlatformIds, platformId];
    },
    setPlatformsStatus(state, action: PayloadAction<PlatformsState["status"]>) {
      state.status = action.payload;
    },
  },
});

export const { setPlatforms, togglePlatform, setPlatformsStatus } = platformsSlice.actions;

export default platformsSlice.reducer;
