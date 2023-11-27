import { createSlice } from "@reduxjs/toolkit";
const UserSlice = createSlice({
    name: "redux",
    initialState: {
        redux: {}
    },
    reducers: {
        cart_counter: (state, action) => {
            state.redux.cart_counter = action.payload;
        },
        
        app_name: (state, action) => {
            state.redux.app_name = action.payload;
        }
    }
})

export const { cart_counter, app_name } = UserSlice.actions;
export default UserSlice.reducer;