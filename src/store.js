import { createStore, combineReducers } from "redux";
import authReducer from "./authReducer";
import bookingReducer from "./bookingReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  bookings: bookingReducer,
});

const store = createStore(rootReducer);

export default store;