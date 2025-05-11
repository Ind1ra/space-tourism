import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authReducer";

function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  return (
    <nav style={{
      background: "rgba(26, 26, 61, 0.8)",
      padding: "15px 20px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backdropFilter: "blur(5px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <Link to="/" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.5rem", marginRight: "20px" }}>
        Space Tourism
      </Link>
      {user ? (
        <>
          <Link to="/dashboard" style={{ margin: "0 15px" }}>Dashboard</Link>
          <Link to="/trips" style={{ margin: "0 15px" }}>Trips</Link>
          <Link to="/bookings" style={{ margin: "0 15px" }}>Bookings</Link>
          {user.role === "Admin" && <Link to="/manage-users" style={{ margin: "0 15px" }}>Manage Users</Link>}
          <button onClick={() => dispatch(logout())} style={{ marginLeft: "15px" }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ margin: "0 15px" }}>Login</Link>
          <Link to="/register" style={{ margin: "0 15px" }}>Register</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;