const API_URL = "http://localhost:5000/api"; // backend server
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

async function fetchEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();

    const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = "";

    events.forEach((event) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${event.title}</h3>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Venue:</strong> ${event.venue}</p>
        <p><strong>Seats:</strong> ${event.available_seats}</p>
        <div class="card-actions"></div>
      `;

      const actionsDiv = card.querySelector(".card-actions");

      // For Students → Register Button
      if (role === "student" || role === null) {
        const registerBtn = document.createElement("button");
        registerBtn.textContent = "Register 🎟";
        registerBtn.onclick = () => registerForEvent(event.event_id);
        actionsDiv.appendChild(registerBtn);
      }

      // For Admin → Update & Delete Buttons
      if (role === "admin") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete ❌";
        deleteBtn.onclick = () => deleteEvent(event.event_id);
        actionsDiv.appendChild(deleteBtn);

        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update ✏️";
        updateBtn.onclick = () => updateEvent(event.event_id);
        actionsDiv.appendChild(updateBtn);
      }

      eventsList.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching events", err);
  }
}

// ========== Register for Event ==========
async function registerForEvent(eventId) {
  if (!token) {
    alert("Please login first ❌");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/registrations/${eventId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Registered successfully ✅");
      fetchEvents(); // refresh seat count
    } else {
      alert(data.message || "Registration failed ❌");
    }
  } catch (err) {
    console.error(err);
    alert("Server error ❌");
  }
}

// ========== Delete Event (Admin) ==========
async function deleteEvent(eventId) {
  if (!token) return alert("Unauthorized ❌");

  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Event deleted ✅");
      fetchEvents();
    } else {
      alert(data.message || "Failed to delete ❌");
    }
  } catch (err) {
    console.error(err);
  }
}

// ========== Update Event (Admin) ==========
async function updateEvent(eventId) {
  const newTitle = prompt("Enter new event title:");
  if (!newTitle) return;

  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Event updated ✅");
      fetchEvents();
    } else {
      alert(data.message || "Failed to update ❌");
    }
  } catch (err) {
    console.error(err);
  }
}

// Load events on page load
document.addEventListener("DOMContentLoaded", fetchEvents);


