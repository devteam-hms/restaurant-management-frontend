import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { restaurantService } from '@/services/restaurant.service';
import {
  RestaurantItem,
  CreateRestaurantPayload,
  UpdateRestaurantPayload,
} from '@/types/restaurant';

interface RestaurantState {
  items: RestaurantItem[];
  selectedRestaurant: RestaurantItem | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: RestaurantState = {
  items: [],
  selectedRestaurant: null,
  total: 0,
  page: 1,
  limit: 50,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (
    params: { page?: number; limit?: number; tenant_id?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await restaurantService.getRestaurants(params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch restaurants');
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurants/fetchRestaurantById',
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const response = await restaurantService.getRestaurantById(restaurantId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch restaurant');
    }
  }
);

export const createRestaurant = createAsyncThunk(
  'restaurants/createRestaurant',
  async (payload: CreateRestaurantPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await restaurantService.createRestaurant(payload);
      dispatch(fetchRestaurants({ page: 1, limit: 50, tenant_id: payload.tenant_id }));
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create restaurant');
    }
  }
);

export const updateRestaurant = createAsyncThunk(
  'restaurants/updateRestaurant',
  async (
    { id, payload }: { id: string; payload: UpdateRestaurantPayload },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await restaurantService.updateRestaurant(id, payload);
      dispatch(fetchRestaurants());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update restaurant');
    }
  }
);

export const deleteRestaurant = createAsyncThunk(
  'restaurants/deleteRestaurant',
  async (restaurantId: string, { rejectWithValue, dispatch }) => {
    try {
      await restaurantService.deleteRestaurant(restaurantId);
      dispatch(fetchRestaurants());
      return restaurantId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete restaurant');
    }
  }
);

export const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setSelectedRestaurant: (state, action: PayloadAction<RestaurantItem | null>) => {
      state.selectedRestaurant = action.payload;
    },
    clearRestaurantError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRestaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load restaurants';
      })
      // fetchRestaurantById
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.selectedRestaurant = action.payload;
      })
      // createRestaurant
      .addCase(createRestaurant.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createRestaurant.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createRestaurant.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to create restaurant';
      })
      // updateRestaurant
      .addCase(updateRestaurant.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateRestaurant.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(updateRestaurant.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update restaurant';
      })
      // deleteRestaurant
      .addCase(deleteRestaurant.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.restaurant_id !== action.payload);
      });
  },
});

export const { setSelectedRestaurant, clearRestaurantError } = restaurantSlice.actions;
export default restaurantSlice.reducer;
