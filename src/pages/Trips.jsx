import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [astronautAssignments, setAstronautAssignments] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [editTrip, setEditTrip] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newPhoto, setNewPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const tripsPerPage = 5;
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("http://localhost:3001/trips").then(res => res.json()),
      fetch("http://localhost:3001/bookings").then(res => res.json()),
      fetch("http://localhost:3001/users").then(res => res.json()),
      fetch("http://localhost:3001/photos").then(res => res.json()),
      fetch("http://localhost:3001/astronaut_assignments").then(res => res.json()),
    ])
      .then(([tripsData, bookingsData, usersData, photosData, assignmentsData]) => {
        setTrips(tripsData);
        setBookings(bookingsData);
        setUsers(usersData);
        setPhotos(photosData);
        setAstronautAssignments(assignmentsData);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleBook(tripId) {
    setIsLoading(true);
    const booking = { userId: user.id, tripId, status: "pending" };
    try {
      const response = await fetch("http://localhost:3001/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (response.ok) {
        toast.success("Trip booked successfully!");
        const bookingsData = await fetch("http://localhost:3001/bookings").then(res => res.json());
        setBookings(bookingsData);
      } else {
        toast.error("Failed to book trip");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(tripId, newStatus) {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setTrips(trips.map(trip => trip.id === tripId ? { ...trip, status: newStatus } : trip));
        toast.success("Trip status updated!");
      } else {
        toast.error("Failed to update trip status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateTrip(e) {
    e.preventDefault();
    if (new Date(editTrip.schedule) < new Date()) {
      toast.error("Schedule date cannot be in the past");
      return;
    }
    if (editTrip.price <= 0) {
      toast.error("Price must be positive");
      return;
    }
    setIsLoading(true);
    try {
      // Обновление тура
      const response = await fetch(`http://localhost:3001/trips/${editTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTrip.name,
          destination: editTrip.destination,
          price: editTrip.price,
          schedule: editTrip.schedule,
          status: editTrip.status,
        }),
      });
      if (response.ok) {
        // Обновление астронавтов
        const currentAssignments = astronautAssignments.filter(a => a.tripId === editTrip.id);
        const newAstronautIds = editTrip.astronautIds || [];
        for (const assignment of currentAssignments) {
          await fetch(`http://localhost:3001/astronaut_assignments/${assignment.id}`, { method: "DELETE" });
        }
        for (const astronautId of newAstronautIds) {
          await fetch("http://localhost:3001/astronaut_assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: astronautId, tripId: editTrip.id }),
          });
        }

        // Обработка новых фото
        if (newPhoto) {
          const formData = new FormData();
          formData.append("photo", newPhoto);
          formData.append("tripId", editTrip.id);
          formData.append("description", editTrip.newPhotoDescription || "New photo");
          const photoResponse = await fetch("http://localhost:8080/api/photos", {
            method: "POST",
            body: formData,
          });
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            const newPhotoEntry = {
              id: photoData.id,
              tripId: editTrip.id,
              url: photoData.url,
              description: photoData.description,
            };
            setPhotos([...photos, newPhotoEntry]);
            await fetch("http://localhost:3001/photos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newPhotoEntry),
            });
          }
        }

        const assignmentsData = await fetch("http://localhost:3001/astronaut_assignments").then(res => res.json());
        setAstronautAssignments(assignmentsData);
        setTrips(trips.map(trip => trip.id === editTrip.id ? editTrip : trip));
        toast.success("Trip updated!");
        setEditTrip(null);
        setNewPhoto(null);
      } else {
        toast.error("Failed to update trip");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteTrip(tripId) {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/trips/${tripId}`, { method: "DELETE" });
      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId));
        const tripPhotos = photos.filter(p => p.tripId === tripId);
        for (const photo of tripPhotos) {
          const fileName = photo.url.split('/').pop();
          await fetch(`http://localhost:8080/api/photos/${fileName}`, { method: "DELETE" });
          await fetch(`http://localhost:3001/photos/${photo.id}`, { method: "DELETE" });
        }
        const tripAssignments = astronautAssignments.filter(a => a.tripId === tripId);
        for (const assignment of tripAssignments) {
          await fetch(`http://localhost:3001/astronaut_assignments/${assignment.id}`, { method: "DELETE" });
        }
        const [photosData, assignmentsData] = await Promise.all([
          fetch("http://localhost:3001/photos").then(res => res.json()),
          fetch("http://localhost:3001/astronaut_assignments").then(res => res.json()),
        ]);
        setPhotos(photosData);
        setAstronautAssignments(assignmentsData);
        toast.success("Trip deleted successfully!");
      } else {
        toast.error("Failed to delete trip");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    setIsLoading(true);
    try {
      const photoToRemove = photos.find(p => p.id === photoId);
      if (photoToRemove) {
        const fileName = photoToRemove.url.split('/').pop();
        const deleteResponse = await fetch(`http://localhost:8080/api/photos/${fileName}`, { method: "DELETE" });
        if (deleteResponse.ok) {
          await fetch(`http://localhost:3001/photos/${photoId}`, { method: "DELETE" });
          setPhotos(photos.filter(p => p.id !== photoId));
          setEditTrip({ ...editTrip, photos: editTrip.photos.filter(p => p.id !== photoId) });
          toast.success("Photo deleted!");
        } else {
          toast.error("Failed to delete photo from server");
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  const showBookings = (tripId) => {
    setSelectedTripId(selectedTripId === tripId ? null : tripId);
  };

  const getBookedUsers = (tripId) => {
    const tripBookings = bookings.filter(booking => booking.tripId === tripId);
    return tripBookings.map(booking => {
      const bookedUser = users.find(u => u.id === booking.userId);
      return bookedUser ? `${bookedUser.name} (${bookedUser.email}) - ${booking.status}` : "Unknown User";
    });
  };

  const getAstronautNames = (tripId) => {
    const assignments = astronautAssignments.filter(a => a.tripId === tripId);
    return assignments.map(a => {
      const astronaut = users.find(u => u.id === a.userId && u.role === "Astronauts");
      return astronaut ? astronaut.name : "Unknown";
    }).join(", ") || "Unassigned";
  };

  const hasBookedTrip = (tripId) => {
    return bookings.some(booking => booking.userId === user.id && booking.tripId === tripId);
  };

  const astronauts = users.filter(u => u.role === "Astronauts");

  const filteredTrips = trips.filter(trip => {
    const statusMatch = filterStatus === "all" || trip.status === filterStatus;
    const dateMatch = !filterDate || trip.schedule === filterDate;
    return statusMatch && dateMatch;
  });

  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = filteredTrips.slice(indexOfFirstTrip, indexOfLastTrip);
  const totalPages = Math.ceil(filteredTrips.length / tripsPerPage);

  return (
    <div style={{ padding: "20px", color: "white", background: "#0d0d1a" }}>
      <h1>Available Trips</h1>
      {isLoading && <p>Loading...</p>}
      <div>
        <label>Filter by Status: </label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="preparing">Preparing</option>
          <option value="launched">Launched</option>
          <option value="completed">Completed</option>
        </select>
        <label>Filter by Date: </label>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>
      <ul>
        {currentTrips.map((trip) => (
          <li key={trip.id}>
            <span onClick={() => user.role === "Admin" && showBookings(trip.id)} style={{ cursor: user.role === "Admin" ? "pointer" : "default" }}>
              {trip.name} - {trip.destination} - ${trip.price} - {trip.schedule} - Status: {trip.status} - Pilots: {getAstronautNames(trip.id)}
            </span>
            {user.role === "Traveller" && !hasBookedTrip(trip.id) && (
              <button onClick={() => handleBook(trip.id)}>Book Now</button>
            )}
            {user.role === "Astronauts" && astronautAssignments.some(a => a.tripId === trip.id && a.userId === user.id) && (
              <select
                value={trip.status}
                onChange={(e) => handleStatusUpdate(trip.id, e.target.value)}
              >
                <option value="preparing">Preparing</option>
                <option value="launched">Launched</option>
                <option value="completed">Completed</option>
              </select>
            )}
            {user.role === "Admin" && (
              <>
                <button onClick={() => setEditTrip({ ...trip, astronautIds: astronautAssignments.filter(a => a.tripId === trip.id).map(a => a.userId), photos: photos.filter(p => p.tripId === trip.id) })}>Edit</button>
                <button onClick={() => handleDeleteTrip(trip.id)}>Delete</button>
              </>
            )}
            <div>
              <h3>Photos for {trip.name}</h3>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {photos.filter(p => p.tripId === trip.id).map(photo => (
                  <li key={photo.id} style={{ listStyle: "none" }}>
                    <img
                      src={`http://localhost:8080${photo.url}`}
                      alt={photo.description}
                      style={{ maxWidth: "200px" }}
                      onError={(e) => console.log(`Failed to load image: http://localhost:8080${photo.url}`)}
                    />
                    <p>{photo.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            {selectedTripId === trip.id && user.role === "Admin" && (
              <>
                <h3>Bookings</h3>
                <ul>
                  {getBookedUsers(trip.id).length > 0 ? (
                    getBookedUsers(trip.id).map((userInfo, index) => (
                      <li key={index}>{userInfo}</li>
                    ))
                  ) : (
                    <li>No bookings for this trip yet.</li>
                  )}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
      <div>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setCurrentPage(i + 1)} disabled={currentPage === i + 1}>
            {i + 1}
          </button>
        ))}
      </div>

      {editTrip && user.role === "Admin" && (
        <div>
          <h2>Edit Trip</h2>
          <form onSubmit={handleUpdateTrip}>
            <input
              value={editTrip.name}
              onChange={(e) => setEditTrip({ ...editTrip, name: e.target.value })}
              placeholder="Trip Name"
              required
            />
            <input
              value={editTrip.destination}
              onChange={(e) => setEditTrip({ ...editTrip, destination: e.target.value })}
              placeholder="Destination"
              required
            />
            <input
              type="number"
              value={editTrip.price}
              onChange={(e) => setEditTrip({ ...editTrip, price: parseInt(e.target.value) })}
              placeholder="Price"
              required
            />
            <input
              type="date"
              value={editTrip.schedule}
              onChange={(e) => setEditTrip({ ...editTrip, schedule: e.target.value })}
              required
            />
            <select
              multiple
              value={editTrip.astronautIds || []}
              onChange={(e) => setEditTrip({ ...editTrip, astronautIds: Array.from(e.target.selectedOptions, option => option.value) })}
            >
              {astronauts.map(astro => (
                <option key={astro.id} value={astro.id}>{astro.name}</option>
              ))}
            </select>
            <div>
              <h4>Photos</h4>
              {editTrip.photos.map(photo => (
                <div key={photo.id} style={{ marginBottom: "10px" }}>
                  <img
                    src={`http://localhost:8080${photo.url}`}
                    alt={photo.description}
                    style={{ maxWidth: "200px" }}
                  />
                  <p>{photo.description}</p>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => setNewPhoto(e.target.files[0])}
                />
                <input
                  type="text"
                  placeholder="New Photo Description"
                  value={editTrip.newPhotoDescription || ""}
                  onChange={(e) => setEditTrip({ ...editTrip, newPhotoDescription: e.target.value })}
                />
                {editTrip.photos.map(photo => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Delete {photo.description}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit">Update Trip</button>
            <button type="button" onClick={() => {
              setEditTrip(null);
              setNewPhoto(null);
            }}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Trips;