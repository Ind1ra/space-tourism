const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
};

function authReducer(state = initialState, action) {
  switch (action.type) {
    case "LOGIN":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    case "LOGOUT":
      localStorage.removeItem("user");
      return { ...state, user: null };
    default:
      return state;
  }
}

export default authReducer;
export const login = (user) => ({ type: "LOGIN", payload: user });
export const logout = () => ({ type: "LOGOUT" });