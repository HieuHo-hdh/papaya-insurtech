import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TenantRow } from '@/lib/api/tenants'

interface TenantsState {
  list: TenantRow[]
  total: number
}

const initialState: TenantsState = {
  list: [],
  total: 0,
}

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
  },
})

export const { setTenants, addTenant, updateTenantInList, removeTenant } = tenantsSlice.actions
export default tenantsSlice.reducer
