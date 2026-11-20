import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { menuService } from '@/services/menu.service';
import {
  MenuItem,
  CreateMenuPayload,
  UpdateMenuPayload,
  GetMenusByBranchParams,
} from '@/types/menu';

interface MenuState {
  items: MenuItem[];
  selectedItem: MenuItem | null;
  total: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  selectedItem: null,
  total: 0,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchMenusByBranch = createAsyncThunk(
  'menus/fetchMenusByBranch',
  async (
    { branchId, params }: { branchId: string; params?: GetMenusByBranchParams },
    { rejectWithValue }
  ) => {
    try {
      const response = await menuService.getMenusByBranch(branchId, params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch menu items');
    }
  }
);

export const createMenu = createAsyncThunk(
  'menus/createMenu',
  async (payload: CreateMenuPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await menuService.createMenu(payload);
      dispatch(fetchMenusByBranch({ branchId: payload.branch_id }));
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create menu item');
    }
  }
);

export const updateMenu = createAsyncThunk(
  'menus/updateMenu',
  async (
    { branchId, menuId, payload }: { branchId: string; menuId: string; payload: UpdateMenuPayload },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await menuService.updateMenu(branchId, menuId, payload);
      dispatch(fetchMenusByBranch({ branchId }));
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenu = createAsyncThunk(
  'menus/deleteMenu',
  async (
    { branchId, menuId }: { branchId: string; menuId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await menuService.deleteMenu(branchId, menuId);
      dispatch(fetchMenusByBranch({ branchId }));
      return menuId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete menu item');
    }
  }
);

export const menuSlice = createSlice({
  name: 'menus',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<MenuItem | null>) => {
      state.selectedItem = action.payload;
    },
    clearMenuError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMenusByBranch
      .addCase(fetchMenusByBranch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenusByBranch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchMenusByBranch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load menus';
      })
      // createMenu
      .addCase(createMenu.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createMenu.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createMenu.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to create dish';
      })
      // updateMenu
      .addCase(updateMenu.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateMenu.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(updateMenu.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to update dish';
      })
      // deleteMenu
      .addCase(deleteMenu.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export const { setSelectedItem, clearMenuError } = menuSlice.actions;
export default menuSlice.reducer;
