import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { branchService } from '@/services/branch.service';
import {
  BranchItem,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@/types/branch';

export interface BranchQueryParams {
  page?: number;
  limit?: number;
  restaurant_id?: string;
  tenant_id?: string;
}

interface BranchState {
  items: BranchItem[];
  selectedBranch: BranchItem | null;
  selectedBranchId: string | null;
  total: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: BranchState = {
  items: [],
  selectedBranch: null,
  selectedBranchId: null,
  total: 0,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchBranches = createAsyncThunk(
  'branches/fetchBranches',
  async (params: BranchQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await branchService.getBranches(params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch branches');
    }
  }
);

export const createBranch = createAsyncThunk(
  'branches/createBranch',
  async (payload: CreateBranchPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await branchService.createBranch(payload);
      dispatch(fetchBranches({ restaurant_id: payload.restaurant_id }));
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create branch');
    }
  }
);

export const updateBranch = createAsyncThunk(
  'branches/updateBranch',
  async (
    { id, payload, restaurantId }: { id: string; payload: UpdateBranchPayload; restaurantId?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await branchService.updateBranch(id, payload);
      dispatch(fetchBranches(restaurantId ? { restaurant_id: restaurantId } : undefined));
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update branch');
    }
  }
);

export const deleteBranch = createAsyncThunk(
  'branches/deleteBranch',
  async (
    { id, restaurantId }: { id: string; restaurantId?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await branchService.deleteBranch(id);
      dispatch(fetchBranches(restaurantId ? { restaurant_id: restaurantId } : undefined));
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete branch');
    }
  }
);

export const branchSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {
    setSelectedBranch: (state, action: PayloadAction<BranchItem | null>) => {
      state.selectedBranch = action.payload;
      state.selectedBranchId = action.payload?.branch_id || null;
    },
    setSelectedBranchId: (state, action: PayloadAction<string | null>) => {
      state.selectedBranchId = action.payload;
      state.selectedBranch =
        state.items.find((b) => b.branch_id === action.payload) || null;
    },
    clearBranchError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBranches
      .addCase(fetchBranches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        if (!state.selectedBranchId && action.payload.data.length > 0) {
          state.selectedBranchId = action.payload.data[0].branch_id;
          state.selectedBranch = action.payload.data[0];
        } else if (state.selectedBranchId) {
          const match = action.payload.data.find((b) => b.branch_id === state.selectedBranchId);
          state.selectedBranch = match || action.payload.data[0] || null;
        }
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load branches';
      })
      // createBranch
      .addCase(createBranch.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createBranch.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to create branch';
      })
      // updateBranch
      .addCase(updateBranch.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateBranch.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update branch';
      })
      // deleteBranch
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.branch_id !== action.payload);
        if (state.selectedBranchId === action.payload) {
          state.selectedBranchId = state.items[0]?.branch_id || null;
          state.selectedBranch = state.items[0] || null;
        }
      });
  },
});

export const { setSelectedBranch, setSelectedBranchId, clearBranchError } = branchSlice.actions;
export default branchSlice.reducer;
