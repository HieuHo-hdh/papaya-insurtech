import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authApi, saveToken, clearToken } from '@/lib/api/auth'
import { isSuccess } from '@/lib/api/client'

interface AuthState {
  token: string | null
  loading: boolean
  error: string | null
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
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const res = await authApi.login(email, password)
    if (isSuccess(res.code) && res.data?.token) {
      saveToken(res.data.token)
      return res.data.token
    }
    return rejectWithValue(res.message || 'Login failed')
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload
    },
    clearAuth(state) {
      state.token = null
      state.error = null
      clearToken()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setToken, clearAuth } = authSlice.actions
export default authSlice.reducer
