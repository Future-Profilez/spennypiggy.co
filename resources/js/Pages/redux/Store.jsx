import { configureStore } from "@reduxjs/toolkit"
import rootReducer from './UserSlice.jsx'

const Store = configureStore({
    reducer: {
        data: rootReducer,
    }
})

export default Store;