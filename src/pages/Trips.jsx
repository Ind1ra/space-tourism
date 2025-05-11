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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingTripId, setBookingTripId] = useState(null);
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const tripsPerPage = 3;
  const user = useSelector((state) => state.auth.user);

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
        setBookings(bookingsData);
        setUsers(usersData);
        setPhotos(photosData);
        setAstronautAssignments(assignmentsData);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setIsLoading(false));
  }, []);

  function handleBook(tripId) {
    if (user.isBanned) {
      toast.error("You are banned and cannot book trips");
      return;
    }
    setBookingTripId(tripId);
    setShowBookingForm(true);
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const selectedTrip = trips.find((trip) => trip.id === bookingTripId);
      if (!selectedTrip) {
        toast.error("Trip not found");
        setShowBookingForm(false);
        return;
      }

      const ageNum = parseInt(age);
      if (ageNum < 18) {
        toast.error("You must be at least 18 years old to book a trip");
        setIsLoading(false);
        return;
      }

      const userBookings = bookings.filter((booking) => booking.userId === user.id);
      const hasConflictingBooking = userBookings.some((booking) => {
        const bookedTrip = trips.find((trip) => trip.id === booking.tripId);
        return bookedTrip && bookedTrip.schedule === selectedTrip.schedule;
      });

      if (hasConflictingBooking) {
        toast.error("You already have a booking for a trip on this date");
        setShowBookingForm(false);
        return;
      }

      const booking = {
        userId: user.id,
        tripId: bookingTripId,
        status: "pending",
        country,
        age: ageNum,
      };
      const response = await fetch("http://localhost:3001/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (response.ok) {
        toast.success("Trip booked successfully!");
        const bookingsData = await fetch("http://localhost:3001/bookings").then((res) => res.json());
        setBookings(bookingsData);
        setShowBookingForm(false);
        setCountry("");
        setAge("");
        setBookingTripId(null);
      } else {
        toast.error("Failed to book trip");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBookingCancel() {
    setShowBookingForm(false);
    setCountry("");
    setAge("");
    setBookingTripId(null);
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
        setTrips(trips.map((trip) => (trip.id === tripId ? { ...trip, status: newStatus } : trip)));
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

  const validateTrip = (trip) => {
    if (!trip.name || trip.name.length < 3) {
      toast.error("Trip name must be at least 3 characters long");
      return false;
    }
    if (!trip.destination || trip.destination.length < 3) {
      toast.error("Destination must be at least 3 characters long");
      return false;
    }
    if (trip.price <= 0) {
      toast.error("Price must be positive");
      return false;
    }
    if (new Date(trip.schedule) < new Date()) {
      toast.error("Schedule date cannot be in the past");
      return false;
    }
    return true;
  };

  async function handleUpdateTrip(e) {
    e.preventDefault();
    if (!validateTrip(editTrip)) return;

    setIsLoading(true);
    try {
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
      if (!response.ok) {
        throw new Error(`Failed to update trip: ${response.statusText}`);
      }

      const currentAssignments = astronautAssignments.filter((a) => a.tripId === editTrip.id);
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

      if (newPhoto) {
        const formData = new FormData();
        formData.append("photo", newPhoto);
        formData.append("tripId", editTrip.id);
        formData.append("description", editTrip.newPhotoDescription || "New photo");
        console.log("Uploading photo with data:", { tripId: editTrip.id, description: editTrip.newPhotoDescription });

        const photoResponse = await fetch("http://localhost:8080/api/photos", {
          method: "POST",
          body: formData,
        });
        if (photoResponse.ok) {
          const photoData = await photoResponse.json();
          console.log("Photo uploaded successfully:", photoData);
          const newPhotoEntry = {
            id: photoData.id,
            tripId: editTrip.id,
            url: photoData.url,
            description: photoData.description,
          };
          const syncResponse = await fetch("http://localhost:3001/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPhotoEntry),
          });
          if (syncResponse.ok) {
            setPhotos([...photos, newPhotoEntry]);
          } else {
            console.error("Failed to sync photo with JSON Server");
          }
        } else {
          const errorText = await photoResponse.text();
          console.error("Photo upload failed:", errorText);
          toast.error(`Failed to upload photo: ${errorText}`);
        }
      }

      const assignmentsData = await fetch("http://localhost:3001/astronaut_assignments").then((res) => res.json());
      setAstronautAssignments(assignmentsData);
      setTrips(trips.map((trip) => (trip.id === editTrip.id ? editTrip : trip)));
      toast.success("Trip updated!");
      setEditTrip(null);
      setNewPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error updating trip:", error);
      toast.error(`Failed to update trip: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteTrip(tripId) {
    setTripToDelete(tripId);
    setShowDeleteModal(true);
  }

  async function confirmDeleteTrip() {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/trips/${tripToDelete}`, { method: "DELETE" });
      if (response.ok) {
        setTrips(trips.filter((trip) => trip.id !== tripToDelete));
        const tripPhotos = photos.filter((p) => p.tripId === tripToDelete);
        for (const photo of tripPhotos) {
          const fileName = photo.url.split("/").pop();
          await fetch(`http://localhost:8080/api/photos/${fileName}`, { method: "DELETE" });
          await fetch(`http://localhost:3001/photos/${photo.id}`, { method: "DELETE" });
        }
        const tripAssignments = astronautAssignments.filter((a) => a.tripId === tripToDelete);
        for (const assignment of tripAssignments) {
          await fetch(`http://localhost:3001/astronaut_assignments/${assignment.id}`, { method: "DELETE" });
        }
        const [photosData, assignmentsData] = await Promise.all([
          fetch("http://localhost:3001/photos").then((res) => res.json()),
          fetch("http://localhost:3001/astronaut_assignments").then((res) => res.json()),
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
      setShowDeleteModal(false);
      setTripToDelete(null);
    }
  }

  async function handleDeletePhoto(photoId) {
    setIsLoading(true);
    try {
      const photoToRemove = photos.find((p) => p.id === photoId);
      if (photoToRemove) {
        const fileName = photoToRemove.url.split("/").pop();
        const deleteResponse = await fetch(`http://localhost:8080/api/photos/${fileName}`, { method: "DELETE" });
        if (deleteResponse.ok) {
          await fetch(`http://localhost:3001/photos/${photoId}`, { method: "DELETE" });
          setPhotos(photos.filter((p) => p.id !== photoId));
          setEditTrip({ ...editTrip, photos: editTrip.photos.filter((p) => p.id !== photoId) });
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
    const tripBookings = bookings.filter((booking) => booking.tripId === tripId);
    return tripBookings.map((booking) => {
      const bookedUser = users.find((u) => u.id === booking.userId);
      return {
        userInfo: bookedUser
          ? `${bookedUser.name} (${bookedUser.email}) - ${booking.status}`
          : "Unknown User",
        tripId: booking.tripId,
      };
    });
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

  const hasBookedTrip = (tripId) => {
    return bookings.some((booking) => booking.userId === user.id && booking.tripId === tripId);
  };

  const astronauts = users.filter((u) => u.role === "Astronauts");

  const filteredTrips = trips.filter((trip) => {
    const statusMatch = filterStatus === "all" || trip.status === filterStatus;
    const dateMatch = !filterDate || trip.schedule === filterDate;
    return statusMatch && dateMatch;
  });

  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = filteredTrips.slice(indexOfFirstTrip, indexOfLastTrip);
  const totalPages = Math.ceil(filteredTrips.length / tripsPerPage);

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
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setNewPhoto(null);
      setPhotoPreview(null);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Available Trips
      </h1>
      {isLoading && <p style={{ textAlign: "center" }}>Loading...</p>}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", justifyContent: "center" }}>
        <div>
          <label style={{ marginRight: "10px" }}>Filter by Status: </label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="preparing">Preparing</option>
            <option value="launched">Launched</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: "10px" }}>Filter by Date: </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>
      <div className="trip-grid">
        {currentTrips.length > 0 ? (
          currentTrips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div
                onClick={() => user.role === "Admin" && showBookings(trip.id)}
                style={{ cursor: user.role === "Admin" ? "pointer" : "default" }}
              >
                <h3 style={{ marginBottom: "10px", color: "#ff00ff" }}>
                  {trip.name}
                </h3>
                <p><strong>Destination:</strong> {trip.destination}</p>
                <p><strong>Price:</strong> ${trip.price}</p>
                <p><strong>Schedule:</strong> {trip.schedule}</p>
                <p><strong>Status:</strong> {trip.status || "Unknown"}</p>
                <p><strong>Pilots:</strong> {getAstronautNames(trip.id)}</p>
              </div>
              <div className="trip-card-photos">
                <h4 style={{ color: "#00d4ff", width: "100%", marginBottom: "10px" }}>Photos for {trip.name}</h4>
                {photos
                  .filter((p) => p.tripId === trip.id)
                  .map((photo) => (
                    <div key={photo.id} style={{ flex: "1 1 100%", maxWidth: "100%" }}>
                      <img
                        src={`http://localhost:8080${photo.url}`}
                        alt={photo.description}
                        onError={(e) =>
                          console.log(`Failed to load image: http://localhost:8080${photo.url}`)
                        }
                      />
                      <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>{photo.description}</p>
                    </div>
                  ))}
              </div>
              <div className="trip-card-actions">
                {user.role === "Traveller" && !hasBookedTrip(trip.id) && (
                  <button onClick={() => handleBook(trip.id)}>
                    Book Now
                  </button>
                )}
                {user.role === "Astronauts" &&
                  astronautAssignments.some((a) => a.tripId === trip.id && a.userId === user.id) && (
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
                    <button
                      onClick={() =>
                        setEditTrip({
                          ...trip,
                          astronautIds: astronautAssignments
                            .filter((a) => a.tripId === trip.id)
                            .map((a) => a.userId),
                          photos: photos.filter((p) => p.tripId === trip.id),
                          newPhotoDescription: "",
                        })
                      }
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteTrip(trip.id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
              {selectedTripId === trip.id && user.role === "Admin" && (
                <div style={{ marginTop: "15px" }}>
                  <h4 style={{ color: "#00d4ff" }}>Bookings</h4>
                  <ul>
                    {getBookedUsers(trip.id).length > 0 ? (
                      getBookedUsers(trip.id).map((booking, index) => {
                        const tripPhotos = photos.filter((p) => p.tripId === booking.tripId);
                        const firstPhoto = tripPhotos.length > 0 ? tripPhotos[0] : null;
                        return (
                          <li key={index} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                            {firstPhoto && (
                              <img
                                src={`http://localhost:8080${firstPhoto.url}`}
                                alt={firstPhoto.description}
                                style={{ maxWidth: "100px", maxHeight: "75px", objectFit: "cover", borderRadius: "5px" }}
                                onError={(e) =>
                                  console.log(`Failed to load image: http://localhost:8080${firstPhoto.url}`)
                                }
                              />
                            )}
                            <span>{booking.userInfo}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li>No bookings for this trip yet.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", gridColumn: "1 / -1" }}>
            No trips available.
          </p>
        )}
      </div>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            disabled={currentPage === i + 1}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {showBookingForm && (
        <div className="modal" style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 1000,
          maxWidth: "400px",
          width: "100%"
        }}>
          <h2>Booking Details</h2>
          <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>Country:</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>Age:</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                required
                min="1"
                max="120"
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={isLoading}>
                Submit
              </button>
              <button type="button" onClick={handleBookingCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editTrip && user.role === "Admin" && (
        <div className="modal" style={{
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "20px auto"
        }}>
          <h2>Edit Trip</h2>
          <form onSubmit={handleUpdateTrip} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
              onChange={(e) =>
                setEditTrip({
                  ...editTrip,
                  astronautIds: Array.from(e.target.selectedOptions, (option) => option.value),
                })
              }
              style={{ minHeight: "100px" }}
            >
              {astronauts.map((astro) => (
                <option key={astro.id} value={astro.id}>
                  {astro.name}
                </option>
              ))}
            </select>
            <div>
              <h4 style={{ color: "#00d4ff" }}>Photos</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {editTrip.photos.map((photo) => (
                  <div key={photo.id} style={{ position: "relative", maxWidth: "150px" }}>
                    <img
                      src={`http://localhost:8080${photo.url}`}
                      alt={photo.description}
                      style={{ maxWidth: "100%", borderRadius: "4px" }}
                    />
                    <p style={{ fontSize: "12px" }}>{photo.description}</p>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "10px" }}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ maxWidth: "150px", borderRadius: "4px" }}
                    />
                  </div>
                )}
                <input
                  type="text"
                  placeholder="New Photo Description (optional)"
                  value={editTrip.newPhotoDescription || ""}
                  onChange={(e) =>
                    setEditTrip({ ...editTrip, newPhotoDescription: e.target.value })
                  }
                  style={{ width: "100%", marginTop: "10px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit">
                Update Trip
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTrip(null);
                  setNewPhoto(null);
                  setPhotoPreview(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal" style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          borderRadius: "8px",
          background: "rgba(26, 26, 61, 0.95)",
          border: "1px solid #00d4ff",
          boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
          zIndex: 1000,
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          color: "#e6e6fa",
          animation: "teleportIn 0.5s ease-in-out"
        }}>
          <h2 style={{ color: "#00d4ff", marginBottom: "15px" }}>Confirm Deletion</h2>
          <p>Are you sure you want to delete this trip?</p>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={confirmDeleteTrip} style={{ background: "#ff4444" }}>
              Yes, delete
            </button>
            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;