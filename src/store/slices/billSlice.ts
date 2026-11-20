import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { billService } from '@/services/bill.service';
import {
  BillItem,
  GenerateBillPayload,
  GetBillsParams,
  UpdateBillPayload,
  CancelBillPayload,
} from '@/types/bill';

interface BillState {
  items: BillItem[];
  selectedBill: BillItem | null;
  total: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: BillState = {
  items: [],
  selectedBill: null,
  total: 0,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchBills = createAsyncThunk(
  'bills/fetchBills',
  async (params: GetBillsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await billService.getBills(params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bills');
    }
  }
);

export const fetchBillById = createAsyncThunk(
  'bills/fetchBillById',
  async (billId: string, { rejectWithValue }) => {
    try {
      const response = await billService.getBillById(billId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bill');
    }
  }
);

export const generateBill = createAsyncThunk(
  'bills/generateBill',
  async (payload: GenerateBillPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await billService.generateBill(payload);
      dispatch(fetchBills());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to generate bill');
    }
  }
);

export const updateBill = createAsyncThunk(
  'bills/updateBill',
  async (
    { id, payload }: { id: string; payload: UpdateBillPayload },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await billService.updateBill(id, payload);
      dispatch(fetchBills());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update bill');
    }
  }
);

export const cancelBill = createAsyncThunk(
  'bills/cancelBill',
  async (
    { id, payload }: { id: string; payload?: CancelBillPayload },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await billService.cancelBill(id, payload);
      dispatch(fetchBills());
      return { id, response };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel bill');
    }
  }
);

export const billSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    setSelectedBill: (state, action: PayloadAction<BillItem | null>) => {
      state.selectedBill = action.payload;
    },
    clearBillError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBills
      .addCase(fetchBills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load bills';
      })
      // fetchBillById
      .addCase(fetchBillById.fulfilled, (state, action) => {
        state.selectedBill = action.payload;
      })
      // generateBill
      .addCase(generateBill.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(generateBill.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(generateBill.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to generate bill';
      })
      // updateBill
      .addCase(updateBill.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.items.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedBill?.id === action.payload.id) {
          state.selectedBill = action.payload;
        }
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update bill';
      });
  },
});

export const { setSelectedBill, clearBillError } = billSlice.actions;
export default billSlice.reducer;
