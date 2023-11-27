import { configureStore } from "@reduxjs/toolkit"
import userReducer from './UserSlice'

const Store = configureStore({
    reducer: {
        data: userReducer,
    }
})

export default Store;