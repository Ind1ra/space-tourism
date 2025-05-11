import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user.role === "Admin") {
      fetch("http://localhost:3001/users")
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => toast.error("Failed to load users"));
    }
  }, [user.role]);

  async function handleBan(userId) {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: true }),
      });
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isBanned: true } : u
          )
        );
        toast.success("User banned successfully!");
      } else {
        toast.error("Failed to ban user");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleUnban(userId) {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: false }),
      });
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isBanned: false } : u
          )
        );
        toast.success("User unbanned successfully!");
      } else {
        toast.error("Failed to unban user");
      }
    } catch {
      toast.error("Network error");
    }
  }

  if (user.role !== "Admin") {
    return (
      <div className="container">
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          Access denied
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Manage Users
      </h1>
      {users.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Name</th>
              <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Email</th>
              <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Role</th>
              <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Status</th>
              <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>{u.name}</td>
                <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>{u.email}</td>
                <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>{u.role}</td>
                <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  {u.isBanned ? "Banned" : "Active"}
                </td>
                <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "10px" }}>
                  {u.role === "Traveller" && !u.isBanned && (
                    <button onClick={() => handleBan(u.id)}>
                      Ban
                    </button>
                  )}
                  {u.role === "Traveller" && u.isBanned && (
                    <button onClick={() => handleUnban(u.id)}>
                      Unban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: "center" }}>No users found.</p>
      )}
    </div>
  );
}

export default ManageUsers;