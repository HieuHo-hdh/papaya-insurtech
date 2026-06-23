import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { tenantsApi, type VersionRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'

interface VersionsState {
  items: VersionRow[]
  total: number
  page: number
  loading: boolean
  rollingBack: string | null
  previewVersion: VersionRow | null
  previewLoading: string | null
}

const initialState: VersionsState = {
  items: [],
  total: 0,
  page: 1,
  loading: false,
  rollingBack: null,
  previewVersion: null,
  previewLoading: null,
}

export const fetchVersions = createAsyncThunk(
  'versions/fetchVersions',
  async ({ tenantId, page }: { tenantId: string; page: number }, { rejectWithValue }) => {
    const res = await tenantsApi.listVersions(tenantId, page, 10)
    if (isSuccess(res.code) && res.data) return { ...res.data, page }
    return rejectWithValue(res.message || 'Failed to load versions')
  },
)

export const fetchVersionPreview = createAsyncThunk(
  'versions/fetchVersionPreview',
  async (
    { tenantId, versionId }: { tenantId: string; versionId: string },
    { rejectWithValue },
  ) => {
    const res = await tenantsApi.getVersion(tenantId, versionId)
    if (isSuccess(res.code) && res.data) return res.data
    return rejectWithValue(res.message || 'Failed to load version')
  },
)

export const rollbackVersion = createAsyncThunk(
  'versions/rollback',
  async (
    { tenantId, versionId }: { tenantId: string; versionId: string },
    { rejectWithValue },
  ) => {
    const res = await tenantsApi.rollback(tenantId, versionId)
    if (isSuccess(res.code)) return true
    return rejectWithValue(res.message || 'Rollback failed')
  },
)

const versionsSlice = createSlice({
  name: 'versions',
  initialState,
  reducers: {
    resetVersions: () => initialState,
    clearPreview: (state) => {
      state.previewVersion = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVersions.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchVersions.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.page = action.payload.page
      })
      .addCase(fetchVersions.rejected, (state) => {
        state.loading = false
      })
      .addCase(fetchVersionPreview.pending, (state, action) => {
        state.previewLoading = action.meta.arg.versionId
      })
      .addCase(fetchVersionPreview.fulfilled, (state, action) => {
        state.previewLoading = null
        state.previewVersion = action.payload
      })
      .addCase(fetchVersionPreview.rejected, (state) => {
        state.previewLoading = null
      })
      .addCase(rollbackVersion.pending, (state, action) => {
        state.rollingBack = action.meta.arg.versionId
      })
      .addCase(rollbackVersion.fulfilled, (state) => {
        state.rollingBack = null
      })
      .addCase(rollbackVersion.rejected, (state) => {
        state.rollingBack = null
      })
  },
})

export const { resetVersions, clearPreview } = versionsSlice.actions
export default versionsSlice.reducer
