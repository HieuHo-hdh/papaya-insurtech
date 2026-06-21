import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  token: string | null
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

const initialState: AuthState = {
  token: getStoredToken(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload
    },
    clearAuth(state) {
      state.token = null
    },
  },
})

export const { setToken, clearAuth } = authSlice.actions
export default authSlice.reducer
