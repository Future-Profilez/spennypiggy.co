import { createSlice } from "@reduxjs/toolkit";
let reduxdata = {
    cart:'',
    appname:''
}

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
        
        // more state here....
    }
})

export const { cart_counter, app_name } = UserSlice.actions;

export const selectuser = (state) => state.data.redux[0];
export default UserSlice.reducer;