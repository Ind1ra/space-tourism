import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/bookings").then((res) => res.json()),
      fetch("http://localhost:3001/trips").then((res) => res.json()),
      fetch("http://localhost:3001/users").then((res) => res.json()),
    ])
      .then(([bookingsData, tripsData, usersData]) => {
        setBookings(bookingsData);
        setTrips(tripsData);
        setUsers(usersData);
      })
      .catch(() => toast.error("Failed to load data"));
  }, []);

  async function handleStatusUpdate(bookingId, newStatus) {
    try {
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setBookings(
          bookings.map((booking) =>
            booking.id === bookingId ? { ...booking, status: newStatus } : booking
          )
        );
        toast.success("Booking status updated!");
      } else {
        toast.error("Failed to update booking status");
      }
    } catch {
      toast.error("Network error");
    }
  }

  const getTripName = (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    return trip ? trip.name : "Unknown Trip";
  };

  const getUserEmail = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : "Unknown User";
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      (filterStatus === "all" || booking.status === filterStatus) &&
      trips.some((t) => t.id === booking.tripId) &&
      users.some((u) => u.id === booking.userId)
  );

  const userBookings = bookings.filter(
    (booking) =>
      booking.userId === user.id &&
      trips.some((t) => t.id === booking.tripId)
  );

  const getBookedTrips = () => {
    const bookedTripIds = [...new Set(bookings.map((booking) => booking.tripId))];
    return bookedTripIds
      .map((tripId) => {
        const trip = trips.find((t) => t.id === tripId);
        if (!trip) return null;
        const tripBookings = bookings.filter((b) => b.tripId === tripId);
        const userEmails = tripBookings
          .map((b) => getUserEmail(b.userId))
          .filter((email, index, self) => email && self.indexOf(email) === index);
        return {
          id: tripId,
          name: trip.name,
          emails: userEmails,
        };
      })
      .filter((trip) => trip !== null);
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Bookings
      </h1>

      {user.role === "Traveller" && (
        <>
          <h2 style={{ color: "#ff00ff", marginBottom: "15px" }}>
            Your Bookings
          </h2>
          {userBookings.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {userBookings.map((booking) => (
                <li key={booking.id} className="trip-card">
                  Trip: {getTripName(booking.tripId)} - Status: {booking.status}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: "center" }}>No bookings found.</p>
          )}
        </>
      )}

      {(user.role === "Admin" || user.role === "Astronauts") && (
        <>
          <h2 style={{ color: "#ff00ff", marginBottom: "15px" }}>
            {user.role === "Admin" ? "All Bookings" : "Trips with Bookings"}
          </h2>
          {user.role === "Admin" && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <label style={{ marginRight: "10px" }}>Filter by Status: </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          {user.role === "Admin" ? (
            filteredBookings.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Trip</th>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>User</th>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Status</th>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {getTripName(booking.tripId)}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {getUserEmail(booking.userId)}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {booking.status}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: "center" }}>No bookings found.</p>
            )
          ) : (
            getBookedTrips().length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Trip Name</th>
                    <th style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>Registered Users (Email)</th>
                  </tr>
                </thead>
                <tbody>
                  {getBookedTrips().map((trip) => (
                    <tr key={trip.id}>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {trip.name}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {trip.emails.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: "20px" }}>
                            {trip.emails.map((email, index) => (
                              <li key={index}>{email}</li>
                            ))}
                          </ul>
                        ) : (
                          "No users registered"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: "center" }}>No trips with bookings found.</p>
            )
          )}
        </>
      )}
    </div>
  );
}

export default Bookings;