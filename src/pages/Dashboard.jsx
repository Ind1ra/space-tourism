import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Dashboard() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Space Dashboard
      </h1>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px"
      }}>
        {user.role === "Admin" && (
          <div style={{ display: "flex", gap: "15px" }}>
            <Link to="/add-trip">
              <button>Add Trip</button>
            </Link>
            <Link to="/manage-users">
              <button>Manage Users</button>
            </Link>
          </div>
        )}
        {user.role === "Traveller" && (
          <p style={{ fontSize: "1.2rem", textAlign: "center" }}>
            Welcome, Traveller! Ready to book a trip?
          </p>
        )}
        {user.role === "Astronauts" && (
          <p style={{ fontSize: "1.2rem", textAlign: "center" }}>
            Welcome, Astronaut! Manage your missions.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;