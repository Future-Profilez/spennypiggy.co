import { createSlice, combineReducers } from "@reduxjs/toolkit";
const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cart: [],
    },
    reducers: {
        add_to_cart: (state, action) => {
            state.cart.push(action.payload);
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


// Combine the reducers into a single root reducer
const rootReducer = combineReducers({
    cart: cartSlice.reducer,
    user: userSlice.reducer,
});
export const { add_to_cart } = cartSlice.actions;
export const { set_user_info } = userSlice.actions;

export default rootReducer;
