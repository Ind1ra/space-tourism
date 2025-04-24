import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../authReducer";
import bcrypt from "bcryptjs";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const response = await fetch(`http://localhost:3001/users?email=${email}`);
    const data = await response.json();
    if (data.length > 0) {
      const user = data[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        dispatch(login(user));
        navigate("/dashboard");
      } else {
        alert("Invalid credentials");
      }
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <div style={{ padding: "20px", background: "#0d0d1a", color: "white" }}>
      <h1>Login to Space Tourism</h1>
      <form onSubmit={handleLogin}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;