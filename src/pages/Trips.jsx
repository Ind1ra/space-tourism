import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [editTrip, setEditTrip] = useState(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetch("http://localhost:3001/trips")
      .then((res) => res.json())
      .then((data) => setTrips(data));
    fetch("http://localhost:3001/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data));
    fetch("http://localhost:3001/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  async function handleBook(tripId) {
    const booking = { userId: user.id, tripId, status: "pending" };
    await fetch("http://localhost:3001/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    alert("Trip booked!");
    fetch("http://localhost:3001/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data));
  }

  async function handleStatusUpdate(tripId, newStatus) {
    await fetch(`http://localhost:3001/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTrips(trips.map(trip => trip.id === tripId ? { ...trip, status: newStatus } : trip));
  }

  async function handleUpdateTrip(e) {
    e.preventDefault();
    await fetch(`http://localhost:3001/trips/${editTrip.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editTrip),
    });
    setTrips(trips.map(trip => trip.id === editTrip.id ? editTrip : trip));
    setEditTrip(null);
    alert("Trip updated!");
  }

  async function handleDeleteTrip(tripId) {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      await fetch(`http://localhost:3001/trips/${tripId}`, {
        method: "DELETE",
      });
      setTrips(trips.filter(trip => trip.id !== tripId));
      alert("Trip deleted successfully!");
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

  const getAstronautName = (astronautId) => {
    const astronaut = users.find(u => u.id === astronautId && u.role === "Astronauts");
    return astronaut ? astronaut.name : "Unassigned";
  };

  const hasBookedTrip = (tripId) => {
    return bookings.some(booking => booking.userId === user.id && booking.tripId === tripId);
  };

  const astronauts = users.filter(u => u.role === "Astronauts");

  return (
    <div style={{ padding: "20px", color: "white", background: "#0d0d1a" }}>
      <h1>Available Trips</h1>
      <ul>
        {trips.map((trip) => (
          <li key={trip.id}>
            <span onClick={() => user.role === "Admin" && showBookings(trip.id)} style={{ cursor: user.role === "Admin" ? "pointer" : "default" }}>
              {trip.name} - {trip.destination} - ${trip.price} - {trip.schedule} - Status: {trip.status} - Pilot: {getAstronautName(trip.astronautId)}
            </span>
            {user.role === "Traveller" && !hasBookedTrip(trip.id) && (
              <button onClick={() => handleBook(trip.id)}>Book Now</button>
            )}
            {user.role === "Astronauts" && trip.astronautId === user.id && (
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
                <button onClick={() => setEditTrip({ ...trip })}>Edit</button>
               
                <button onClick={() => handleDeleteTrip(trip.id)}>Delete</button>
              </>
            )}
            {selectedTripId === trip.id && user.role === "Admin" && (
              <ul>
                {getBookedUsers(trip.id).length > 0 ? (
                  getBookedUsers(trip.id).map((userInfo, index) => (
                    <li key={index}>{userInfo}</li>
                  ))
                ) : (
                  <li>No bookings for this trip yet.</li>
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>

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
              value={editTrip.astronautId || ""}
              onChange={(e) => setEditTrip({ ...editTrip, astronautId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {astronauts.map(astro => (
                <option key={astro.id} value={astro.id}>{astro.name}</option>
              ))}
            </select>
            <button type="submit">Update Trip</button>
            <button type="button" onClick={() => setEditTrip(null)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Trips;