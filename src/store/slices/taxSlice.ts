import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taxService } from '@/services/tax.service';
import { TaxConfigItem, CreateTaxConfigPayload, UpdateTaxConfigPayload } from '@/types/tax';

interface TaxState {
  items: TaxConfigItem[];
  activeTax: TaxConfigItem | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: TaxState = {
  items: [],
  activeTax: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchTaxes = createAsyncThunk(
  'taxes/fetchTaxes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taxService.getTaxConfigs();
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch tax configurations');
    }
  }
);

export const createTax = createAsyncThunk(
  'taxes/createTax',
  async (payload: CreateTaxConfigPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await taxService.createTaxConfig(payload);
      dispatch(fetchTaxes());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create tax configuration');
    }
  }
);

export const updateTax = createAsyncThunk(
  'taxes/updateTax',
  async (
    { id, payload }: { id: string; payload: UpdateTaxConfigPayload },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await taxService.updateTaxConfig(id, payload);
      dispatch(fetchTaxes());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update tax configuration');
    }
  }
);

export const activateTax = createAsyncThunk(
  'taxes/activateTax',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await taxService.activateTaxConfig(id);
      dispatch(fetchTaxes());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to activate tax configuration');
    }
  }
);

export const deleteTax = createAsyncThunk(
  'taxes/deleteTax',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await taxService.deleteTaxConfig(id);
      dispatch(fetchTaxes());
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete tax configuration');
    }
  }
);

export const taxSlice = createSlice({
  name: 'taxes',
  initialState,
  reducers: {
    clearTaxError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTaxes
      .addCase(fetchTaxes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaxes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.activeTax = action.payload.find((t) => t.is_active) || action.payload[0] || null;
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load tax configs';
      })
      // createTax
      .addCase(createTax.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(createTax.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createTax.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to create tax';
      })
      // updateTax
      .addCase(updateTax.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(updateTax.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(updateTax.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update tax';
      });
  },
});

export const { clearTaxError } = taxSlice.actions;
export default taxSlice.reducer;
