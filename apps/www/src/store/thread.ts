import type z from "zod";
import type { threadSelectSchema } from "@rhiva-ag/datasource";
import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const threadEntityAdapter =
  createEntityAdapter<z.infer<typeof threadSelectSchema>>();

const threadSlice = createSlice({
  name: "thread",
  initialState: threadEntityAdapter.getInitialState(),
  reducers: {
    setMany: threadEntityAdapter.setMany,
    addMany: threadEntityAdapter.addMany,
    removeOne: threadEntityAdapter.removeOne,
    removeMany: threadEntityAdapter.removeMany,
  },
});

export const threadReducer = threadSlice.reducer;
export const threadActions = threadSlice.actions;
export const threadSelectors = threadEntityAdapter.getSelectors();
