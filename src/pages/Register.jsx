import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../authReducer";
import bcrypt from "bcryptjs";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Traveller");

  async function handleRegister(e) {
    e.preventDefault();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, role };
    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (response.ok) {
      const user = await response.json();
      dispatch(login(user));
      navigate("/dashboard");
    } else {
      alert("Registration failed.");
    }
  }

  return (
    <div style={{ padding: "20px", background: "#0d0d1a", color: "white" }}>
      <h1>Register for Space Travel</h1>
      <form onSubmit={handleRegister}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Traveller">Traveller</option>
          <option value="Astronauts">Astronauts</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;