import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Trips from "./pages/Trips";
import Bookings from "./pages/Bookings";
import AddTrip from "./pages/AddTrip";
import ManageUsers from "./pages/ManageUsers";

function App() {
  const user = useSelector((state) => state.auth.user);

  return (
    <BrowserRouter>
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/trips" element={user ? <Trips /> : <Navigate to="/login" />} />
        <Route path="/bookings" element={user ? <Bookings /> : <Navigate to="/login" />} />
        <Route path="/add-trip" element={user && user.role === "Admin" ? <AddTrip /> : <Navigate to="/dashboard" />} />
        <Route path="/manage-users" element={user && user.role === "Admin" ? <ManageUsers /> : <Navigate to="/dashboard" />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
    </BrowserRouter>
  );
}

export default App;