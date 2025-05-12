import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";

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
      // Проверка уникальности email
      const emailCheckResponse = await fetch(`http://localhost:3001/users?email=${email}`);
      const emailCheckData = await emailCheckResponse.json();
      if (emailCheckData.length > 0) {
        toast.error("Email is already registered");
        return;
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создание объекта пользователя с хешированным паролем
      const user = {
        name,
        email,
        password: hashedPassword,
        role: "Traveller",
        isBanned: false,
      };

      // Отправка пользователя на JSON Server
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
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error");
    }
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Register
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          background: "rgba(255, 255, 255, 0.05)",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          animation: "fadeIn 1s ease-in-out",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className="cosmic-input"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="cosmic-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="cosmic-input"
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;