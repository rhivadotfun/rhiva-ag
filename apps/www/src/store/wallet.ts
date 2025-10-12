import type { getWalletPNL, getWalletTokens } from "@/lib/get-tokens";
import {
  createEntityAdapter,
  createSlice,
  type PayloadAction,
  type SerializedError,
} from "@reduxjs/toolkit";

const walletTokenEntityAdapter =
  createEntityAdapter<Awaited<ReturnType<typeof getWalletTokens>>[number]>();

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    pnl: null as Awaited<ReturnType<typeof getWalletPNL>>["summary"] | null,
    walletToken: walletTokenEntityAdapter.getInitialState<{
      error?: SerializedError;
      status: "idle" | "loading" | "error" | "fulfilled";
    }>({
      status: "idle",
    }),
  },
  reducers: {
    setWalletToken(
      state,
      action: PayloadAction<Awaited<ReturnType<typeof getWalletPNL>>>,
    ) {
      state.pnl = action.payload.summary;
      walletTokenEntityAdapter.setMany(
        state.walletToken,
        action.payload.tokens,
      );
    },
  },
});

export const walletReducer = walletSlice.reducer;
export const walletActions = walletSlice.actions;
export const walletTokenSelectors = walletTokenEntityAdapter.getSelectors();
