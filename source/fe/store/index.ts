import { configureStore } from '@reduxjs/toolkit'
import tenantsReducer from './slices/tenantsSlice'
import authReducer from './slices/authSlice'
import versionsReducer from './slices/versionsSlice'

export const store = configureStore({
  reducer: {
    tenants: tenantsReducer,
    auth: authReducer,
    versions: versionsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
