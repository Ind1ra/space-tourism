import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  useEffect(() => {
    let url = user.role === "Admin" 
      ? "http://localhost:3001/bookings" 
      : `http://localhost:3001/bookings?userId=${user.id}`;
    
    if (statusFilter !== "all") {
      url += `${url.includes("?") ? "&" : "?"}status=${statusFilter}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch(() => toast.error("Failed to load bookings"));
  }, [user.id, user.role, statusFilter]);

  async function handleStatusChange(bookingId, newStatus) {
    const response = await fetch(`http://localhost:3001/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      toast.success(`Booking ${newStatus} successfully!`);
    } else {
      toast.error("Failed to update booking status.");
    }
  }

  return (
    <div style={{ padding: "20px", color: "white", background: "#0d0d1a" }}>
      <h1>{user.role === "Admin" ? "All Bookings" : "Your Bookings"}</h1>
      <div>
        <button onClick={() => setSearchParams({ status: "pending" })}>Pending</button>
        <button onClick={() => setSearchParams({ status: "confirmed" })}>Confirmed</button>
        <button onClick={() => setSearchParams({ status: "cancelled" })}>Cancelled</button>
        <button onClick={() => setSearchParams({})}>All</button>
      </div>
      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            Trip ID: {booking.tripId} - User ID: {booking.userId} - Status: {booking.status}
            {user.role === "Admin" && booking.status === "pending" && (
              <>
                <button onClick={() => handleStatusChange(booking.id, "confirmed")}>Confirm</button>
                <button onClick={() => handleStatusChange(booking.id, "cancelled")}>Cancel</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Bookings;