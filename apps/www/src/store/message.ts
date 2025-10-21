import type z from "zod";
import type { messageSelectSchema } from "@rhiva-ag/datasource";
import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const messageEntityAdapter =
  createEntityAdapter<z.infer<typeof messageSelectSchema>>();

const messageSlice = createSlice({
  name: "message",
  initialState: messageEntityAdapter.getInitialState(),
  reducers: {
    setMany: messageEntityAdapter.setMany,
    addMany: messageEntityAdapter.addMany,
    removeOne: messageEntityAdapter.removeOne,
    removeMany: messageEntityAdapter.removeMany,
  },
});

export const messageReducer = messageSlice.reducer;
export const messageActions = messageSlice.actions;
export const messageSelectors = messageEntityAdapter.getSelectors();
