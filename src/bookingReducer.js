const initialState = {
    bookings: [],
  };
  
  function bookingReducer(state = initialState, action) {
    switch (action.type) {
      case "ADD_BOOKING":
        return { ...state, bookings: [...state.bookings, action.payload] };
      case "UPDATE_BOOKING":
        return {
          ...state,
          bookings: state.bookings.map(booking =>
            booking.id === action.payload.id ? { ...booking, ...action.payload } : booking
          ),
        };
      case "SET_BOOKINGS":
        return { ...state, bookings: action.payload };
      default:
        return state;
    }
  }
  
  export default bookingReducer;
  export const addBooking = (booking) => ({ type: "ADD_BOOKING", payload: booking });
  export const updateBooking = (booking) => ({ type: "UPDATE_BOOKING", payload: booking });
  export const setBookings = (bookings) => ({ type: "SET_BOOKINGS", payload: bookings });