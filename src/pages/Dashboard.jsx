import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Dashboard() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div style={{ padding: "20px", background: "#0d0d1a", color: "white" }}>
      <h1>Space Dashboard</h1>
      {user.role === "Admin" && (
        <>
          <Link to="/add-trip"><button>Add Trip</button></Link>
          <Link to="/manage-users"><button>Manage Users</button></Link>
        </>
      )}
      {user.role === "Traveller" && <p>Welcome, Traveller! Ready to book a trip?</p>}
      {user.role === "Astronauts" && <p>Welcome, Astronaut! Manage your missions.</p>}
    </div>
  );
}

export default Dashboard;