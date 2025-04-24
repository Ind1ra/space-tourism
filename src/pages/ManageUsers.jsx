import { useState, useEffect } from "react";

function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  async function handleDelete(userId) {
    await fetch(`http://localhost:3001/users/${userId}`, { method: "DELETE" });
    setUsers(users.filter(user => user.id !== userId));
  }

  return (
    <div style={{ padding: "20px", color: "white", background: "#0d0d1a" }}>
      <h1>Manage Users (Admin Only)</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email} - {user.role}
            <button onClick={() => handleDelete(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageUsers;