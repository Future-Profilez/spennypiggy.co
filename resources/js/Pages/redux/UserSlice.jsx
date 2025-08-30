import { createSlice, combineReducers } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cart: false,
    },
    reducers: {
        add_to_cart: (state, action) => {
            // Disabled cart caching to prevent stale data
            // Cart data should always be fetched fresh from API
            console.log('Cart Redux action disabled - use API calls instead');
            // state.cart = action.payload;
        },
    },
});

const userSlice = createSlice({
    name: "user",
    initialState: {
        userInfo: null,
    },
    reducers: {
        set_user_info: (state, action) => {
            state.userInfo = action.payload;
        },
    },
});

const rootReducer = combineReducers({
    cart: cartSlice.reducer,
    user: userSlice.reducer,
});
export const { add_to_cart } = cartSlice.actions;
export const { set_user_info } = userSlice.actions;

export default rootReducer;
