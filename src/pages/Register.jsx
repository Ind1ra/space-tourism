import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      // Примечание: Хеширование пароля должно быть на сервере, временно оставляем как есть
      const user = { name, email, password, role: "Traveller" };
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (response.ok) {
        toast.success("Registration successful! Please log in.");
        navigate("/login");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Registration failed");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Register
      </h1>
      <form onSubmit={handleSubmit} style={{
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
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
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;