import { configureStore } from '@reduxjs/toolkit';
import restaurantReducer from './slices/restaurantSlice';
import branchReducer from './slices/branchSlice';
import menuReducer from './slices/menuSlice';
import orderReducer from './slices/orderSlice';
import billReducer from './slices/billSlice';
import customerReducer from './slices/customerSlice';
import taxReducer from './slices/taxSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    restaurants: restaurantReducer,
    branches: branchReducer,
    menus: menuReducer,
    orders: orderReducer,
    bills: billReducer,
    customers: customerReducer,
    taxes: taxReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore file uploads or dates if needed in actions
        ignoredActionPaths: ['payload.file', 'meta.arg.fileOrUrl', 'payload.fileOrUrl'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
