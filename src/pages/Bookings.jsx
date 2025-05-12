import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setBookings, updateBooking } from "../bookingReducer";

function Bookings() {
  const bookings = useSelector((state) => state.bookings.bookings);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [astronautAssignments, setAstronautAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("http://localhost:3001/trips").then((res) => res.json()),
      fetch("http://localhost:3001/bookings").then((res) => res.json()),
      fetch("http://localhost:3001/users").then((res) => res.json()),
      fetch("http://localhost:3001/photos").then((res) => res.json()),
      fetch("http://localhost:3001/astronaut_assignments").then((res) => res.json()),
    ])
      .then(([tripsData, bookingsData, usersData, photosData, assignmentsData]) => {
        setTrips(tripsData);
        dispatch(setBookings(bookingsData)); // Загружаем бронирования в Redux
        setUsers(usersData);
        setPhotos(photosData);
        setAstronautAssignments(assignmentsData);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setIsLoading(false));
  }, [dispatch]);

  async function handleStatusUpdate(bookingId, newStatus) {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        dispatch(updateBooking({ id: bookingId, status: newStatus })); // Обновляем в Redux
        toast.success("Booking status updated!");
      } else {
        toast.error("Failed to update booking status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  const getTripDetails = (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    return trip || { name: "Unknown", destination: "Unknown", schedule: "Unknown" };
  };

  const getUserDetails = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user || { name: "Unknown", email: "Unknown" };
  };

  const getAstronautNames = (tripId) => {
    const assignments = astronautAssignments.filter((a) => a.tripId === tripId);
    return assignments
      .map((a) => {
        const astronaut = users.find((u) => u.id === a.userId && u.role === "Astronauts");
        return astronaut ? astronaut.name : "Unknown";
      })
      .join(", ") || "Unassigned";
  };

  const getTripBookings = (tripId) => {
    return bookings.filter((booking) => booking.tripId === tripId);
  };

  const travellerBookings = bookings.filter((booking) => booking.userId === user.id);
  const tripsWithAssignments = trips.filter((trip) =>
    astronautAssignments.some((a) => a.tripId === trip.id && a.userId === user.id)
  );

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Your Bookings</h1>
      {isLoading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {user.role === "Traveller" && (
        <div>
          {travellerBookings.length > 0 ? (
            travellerBookings.map((booking) => {
              const trip = getTripDetails(booking.tripId);
              const tripPhotos = photos.filter((p) => p.tripId === booking.tripId);
              const firstPhoto = tripPhotos.length > 0 ? tripPhotos[0] : null;
              return (
                <div key={booking.id} className="booking-item trip-card">
                  <h3 style={{ marginBottom: "10px", color: "#ff00ff" }}>{trip.name}</h3>
                  {firstPhoto && (
                    <img
                      src={`http://localhost:8080${firstPhoto.url}`}
                      alt={firstPhoto.description}
                      style={{
                        maxWidth: "150px",
                        maxHeight: "100px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        marginBottom: "10px",
                      }}
                    />
                  )}
                  <p>
                    <strong>Destination:</strong> {trip.destination}
                  </p>
                  <p>
                    <strong>Schedule:</strong> {trip.schedule}
                  </p>
                  <p>
                    <strong>Status:</strong> {booking.status}
                  </p>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center" }}>No bookings yet.</p>
          )}
        </div>
      )}

      {user.role === "Admin" && (
        <div>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>All Bookings</h2>
          {bookings.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>User</th>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>Trip</th>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>Destination</th>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>Schedule</th>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>Status</th>
                  <th style={{ border: "1px solid #00d4ff", padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const trip = getTripDetails(booking.tripId);
                  const bookedUser = getUserDetails(booking.userId);
                  return (
                    <tr key={booking.id}>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>
                        {bookedUser.name} ({bookedUser.email})
                      </td>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>{trip.name}</td>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>{trip.destination}</td>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>{trip.schedule}</td>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>{booking.status}</td>
                      <td style={{ border: "1px solid #00d4ff", padding: "10px" }}>
                        {booking.status === "pending" && (
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => handleStatusUpdate(booking.id, "confirmed")}>
                              Confirm
                            </button>
                            <button onClick={() => handleStatusUpdate(booking.id, "cancelled")}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: "center" }}>No bookings available.</p>
          )}
        </div>
      )}

      {user.role === "Astronauts" && (
        <div>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Assigned Trips</h2>
          {tripsWithAssignments.length > 0 ? (
            tripsWithAssignments.map((trip) => (
              <div key={trip.id} className="trip-card">
                <h3 style={{ marginBottom: "10px", color: "#ff00ff" }}>{trip.name}</h3>
                <p>
                  <strong>Destination:</strong> {trip.destination}
                </p>
                <p>
                  <strong>Schedule:</strong> {trip.schedule}
                </p>
                <p>
                  <strong>Status:</strong> {trip.status || "Unknown"}
                </p>
                <p>
                  <strong>Pilots:</strong> {getAstronautNames(trip.id)}
                </p>
                <h4 style={{ marginTop: "15px", color: "#00d4ff" }}>Bookings</h4>
                <ul>
                  {getTripBookings(trip.id).length > 0 ? (
                    getTripBookings(trip.id).map((booking) => {
                      const bookedUser = getUserDetails(booking.userId);
                      return (
                        <li key={booking.id}>
                          {bookedUser.name} ({bookedUser.email}) - {booking.status}
                        </li>
                      );
                    })
                  ) : (
                    <li>No bookings for this trip yet.</li>
                  )}
                </ul>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center" }}>No assigned trips.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Bookings;