import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../authReducer";
import { toast } from "react-toastify";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/users?email=${email}`);
      const data = await response.json();
      if (data.length > 0) {
        const user = data[0];
        if (user.isBanned) {
          toast.error("Your account is banned");
          return;
        }
        // Примечание: bcrypt временно убран, нужно перенести на сервер
        dispatch(login(user));
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Login to Space Tourism
      </h1>
      <form onSubmit={handleLogin} style={{
        maxWidth: "400px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        background: "rgba(255, 255, 255, 0.05)",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        animation: "fadeIn 1s ease-in-out"
      }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;