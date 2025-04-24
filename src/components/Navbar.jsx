import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authReducer";

function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  return (
    <nav style={{ background: "#1a1a3d", color: "white", padding: "10px" }}>
      <Link to="/" style={{ color: "white" }}>Space Tourism</Link> | 
      {user ? (
        <>
          <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link> | 
          <Link to="/trips" style={{ color: "white" }}>Trips</Link> | 
          <Link to="/bookings" style={{ color: "white" }}>Bookings</Link> | 
          {user.role === "Admin" && <Link to="/manage-users" style={{ color: "white" }}>Manage Users</Link>} | 
          <button onClick={() => dispatch(logout())}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ color: "white" }}>Login</Link> | 
          <Link to="/register" style={{ color: "white" }}>Register</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;