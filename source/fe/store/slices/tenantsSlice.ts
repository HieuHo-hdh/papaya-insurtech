import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'

interface TenantsState {
  list: TenantRow[]
  total: number
  detail: TenantRow | null
  detailLoading: boolean
}

const initialState: TenantsState = {
  list: [],
  total: 0,
  detail: null,
  detailLoading: false,
}

export const fetchTenantDetail = createAsyncThunk(
  'tenants/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    const res = await tenantsApi.getById(id)
    if (isSuccess(res.code) && res.data) return res.data
    return rejectWithValue(res.message || 'Failed to load tenant')
  },
)

const tenantsSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setTenants(state, action: PayloadAction<{ data: TenantRow[]; total: number }>) {
      state.list = action.payload.data
      state.total = action.payload.total
    },
    addTenant(state, action: PayloadAction<TenantRow>) {
      state.list.unshift(action.payload)
      state.total += 1
    },
    updateTenantInList(state, action: PayloadAction<TenantRow>) {
      const idx = state.list.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    removeTenant(state, action: PayloadAction<string>) {
      state.list = state.list.filter((t) => t.id !== action.payload)
      state.total -= 1
    },
    setDetail(state, action: PayloadAction<TenantRow>) {
      state.detail = action.payload
    },
    clearDetail(state) {
      state.detail = null
      state.detailLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantDetail.pending, (state) => {
        state.detailLoading = true
      })
      .addCase(fetchTenantDetail.fulfilled, (state, action) => {
        state.detail = action.payload
        state.detailLoading = false
      })
      .addCase(fetchTenantDetail.rejected, (state) => {
        state.detailLoading = false
      })
  },
})

export const { setTenants, addTenant, updateTenantInList, removeTenant, setDetail, clearDetail } =
  tenantsSlice.actions
export default tenantsSlice.reducer
