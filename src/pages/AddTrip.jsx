import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AddTrip() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState("");
  const [schedule, setSchedule] = useState("");
  const [astronautId, setAstronautId] = useState("");
  const [astronauts, setAstronauts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/users?role=Astronauts")
      .then((res) => res.json())
      .then((data) => setAstronauts(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const newTrip = { name, destination, price: parseInt(price), schedule, astronautId: astronautId || null };
    const response = await fetch("http://localhost:3001/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrip),
    });
    if (response.ok) {
      alert("Trip added!");
      navigate("/dashboard");
    }
  }

  return (
    <div style={{ padding: "20px", color: "white", background: "#0d0d1a" }}>
      <h1>Add New Trip (Admin Only)</h1>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip Name" required />
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" required />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" required />
        <input type="date" value={schedule} onChange={(e) => setSchedule(e.target.value)} required />
        <select value={astronautId} onChange={(e) => setAstronautId(e.target.value)}>
          <option value="">Unassigned</option>
          {astronauts.map(astro => (
            <option key={astro.id} value={astro.id}>{astro.name}</option>
          ))}
        </select>
        <button type="submit">Add Trip</button>
      </form>
    </div>
  );
}

export default AddTrip;