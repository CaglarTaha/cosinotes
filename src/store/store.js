import { configureStore } from '@reduxjs/toolkit';
import notesReducer from './notesSlice';

export const store = configureStore({
  reducer: {
    notes: notesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notes/loadNotesFromStorage'],
      },
    }),
});
