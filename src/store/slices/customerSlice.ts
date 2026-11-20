import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { customerService } from '@/services/customer.service';
import { CustomerProfile, UpdateCustomerProfilePayload } from '@/types/customer';

interface CustomerState {
  customers: CustomerProfile[];
  profile: CustomerProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await customerService.getCustomers();
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch customers');
    }
  }
);

export const fetchCustomerProfile = createAsyncThunk(
  'customers/fetchProfile',
  async (fallbackId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await customerService.getProfile(fallbackId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch customer profile');
    }
  }
);

export const updateCustomerProfile = createAsyncThunk(
  'customers/updateProfile',
  async (
    { customerId, payload }: { customerId: string; payload: UpdateCustomerProfilePayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await customerService.updateProfile(customerId, payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update customer profile');
    }
  }
);

export const uploadCustomerAvatar = createAsyncThunk(
  'customers/uploadAvatar',
  async (
    { customerId, fileOrUrl }: { customerId: string; fileOrUrl: File | string },
    { rejectWithValue }
  ) => {
    try {
      const response = await customerService.uploadAvatar(customerId, fileOrUrl);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to upload customer avatar');
    }
  }
);

export const removeCustomerAvatar = createAsyncThunk(
  'customers/removeAvatar',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await customerService.removeAvatar(customerId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove customer avatar');
    }
  }
);

export const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load customers';
      })
      // fetchCustomerProfile
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load profile';
      })
      // updateCustomerProfile
      .addCase(updateCustomerProfile.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(updateCustomerProfile.fulfilled, (state, action) => {
        state.isSaving = false;
        state.profile = action.payload;
      })
      .addCase(updateCustomerProfile.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update profile';
      })
      // uploadCustomerAvatar
      .addCase(uploadCustomerAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar = action.payload.avatar;
        }
      })
      // removeCustomerAvatar
      .addCase(removeCustomerAvatar.fulfilled, (state) => {
        if (state.profile) {
          state.profile.avatar = '';
        }
      });
  },
});

export const { clearCustomerError } = customerSlice.actions;
export default customerSlice.reducer;
