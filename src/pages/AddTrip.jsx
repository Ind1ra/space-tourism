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
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/users?role=Astronauts")
      .then((res) => res.json())
      .then((data) => setAstronauts(data))
      .catch(() => toast.error("Failed to load astronauts"));
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhoto(null);
      setPhotoPreview(null);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (new Date(schedule) < new Date()) {
      toast.error("Schedule date cannot be in the past");
      return;
    }
    if (!name || name.length < 3) {
      toast.error("Trip name must be at least 3 characters long");
      return;
    }
    if (!destination || destination.length < 3) {
      toast.error("Destination must be at least 3 characters long");
      return;
    }
    if (parseInt(price) <= 0) {
      toast.error("Price must be positive");
      return;
    }

    const newTrip = { name, destination, price: parseInt(price), schedule, status: "preparing" };
    try {
      const response = await fetch("http://localhost:3001/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
      });
      if (!response.ok) {
        throw new Error(`Failed to add trip: ${response.statusText}`);
      }
      const trip = await response.json();

      for (const astronautId of astronautIds) {
        const assignmentResponse = await fetch("http://localhost:3001/astronaut_assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: astronautId, tripId: trip.id }),
        });
        if (!assignmentResponse.ok) {
          console.error(`Failed to assign astronaut ${astronautId}`);
        }
      }

      if (photo) {
        const formData = new FormData();
        formData.append("photo", photo);
        formData.append("tripId", trip.id);
        formData.append("description", photoDescription || "New photo");
        console.log("Uploading photo with data:", { tripId: trip.id, description: photoDescription });

        const photoResponse = await fetch("http://localhost:8080/api/photos", {
          method: "POST",
          body: formData,
        });
        if (photoResponse.ok) {
          const photoData = await photoResponse.json();
          console.log("Photo uploaded successfully:", photoData);
          const newPhotoEntry = {
            id: photoData.id,
            tripId: trip.id,
            url: photoData.url,
            description: photoData.description,
          };
          const syncResponse = await fetch("http://localhost:3001/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPhotoEntry),
          });
          if (!syncResponse.ok) {
            console.error("Failed to sync photo with JSON Server");
          }
        } else {
          const errorText = await photoResponse.text();
          console.error("Photo upload failed:", errorText);
          toast.error(`Failed to upload photo: ${errorText}`);
        }
      }

      toast.success("Trip added!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding trip:", error);
      toast.error(`Failed to add trip: ${error.message}`);
    }
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Add New Trip (Admin Only)
      </h1>
      <form onSubmit={handleSubmit} className="modal" style={{
        maxWidth: "500px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip Name"
          required
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          required
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          required
        />
        <input
          type="date"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          required
        />
        <select
          multiple
          value={astronautIds}
          onChange={(e) => setAstronautIds(Array.from(e.target.selectedOptions, option => option.value))}
          style={{ minHeight: "100px" }}
        >
          {astronauts.map(astro => (
            <option key={astro.id} value={astro.id}>{astro.name}</option>
          ))}
        </select>
        <div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handlePhotoChange}
          />
          {photoPreview && (
            <div style={{ marginTop: "10px" }}>
              <img src={photoPreview} alt="Preview" style={{ maxWidth: "150px" }} />
            </div>
          )}
          <input
            value={photoDescription}
            onChange={(e) => setPhotoDescription(e.target.value)}
            placeholder="Photo Description (optional)"
            style={{ width: "100%", marginTop: "10px" }}
          />
        </div>
        <button type="submit">
          Add Trip
        </button>
      </form>
    </div>
  );
}

export default AddTrip;