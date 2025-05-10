import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AddTrip() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState("");
  const [schedule, setSchedule] = useState("");
  const [astronautIds, setAstronautIds] = useState([]);
  const [astronauts, setAstronauts] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoDescription, setPhotoDescription] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/users?role=Astronauts")
      .then((res) => res.json())
      .then((data) => setAstronauts(data))
      .catch(() => toast.error("Failed to load astronauts"));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (new Date(schedule) < new Date()) {
        toast.error("Schedule date cannot be in the past");
        return;
    }
    const newTrip = { name, destination, price: parseInt(price), schedule, status: "preparing" };
    const response = await fetch("http://localhost:3001/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
    });
    if (response.ok) {
        const trip = await response.json();
        // Add astronaut assignments
        for (const astronautId of astronautIds) {
            await fetch("http://localhost:3001/astronaut_assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: astronautId, tripId: trip.id }),
            });
        }
        // Add photo if provided
        if (photo && photoDescription) {
            const formData = new FormData();
            formData.append("photo", photo);
            formData.append("tripId", trip.id);
            formData.append("description", photoDescription);
            const photoResponse = await fetch("http://localhost:8080/api/photos", {
                method: "POST",
                body: formData,
            });
            if (!photoResponse.ok) {
                toast.error("Failed to upload photo");
            }
        }
        toast.success("Trip added!");
        navigate("/dashboard");
    } else {
        toast.error("Failed to add trip");
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
        <select multiple value={astronautIds} onChange={(e) => setAstronautIds(Array.from(e.target.selectedOptions, option => option.value))}>
          {astronauts.map(astro => (
            <option key={astro.id} value={astro.id}>{astro.name}</option>
          ))}
        </select>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={(e) => setPhoto(e.target.files[0])}
        />
        <input value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)} placeholder="Photo Description" />
        <button type="submit">Add Trip</button>
      </form>
    </div>
  );
}

export default AddTrip;