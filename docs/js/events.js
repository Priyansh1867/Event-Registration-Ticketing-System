const API_URL = "http://localhost:5000/api"; // backend server
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

async function fetchEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();

    const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = "";

    events.forEach(ev => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
          <div class="card-image-wrapper">
              <img src="${ev.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}" alt="Event Image">
              <div class="card-category">${ev.category || 'General'}</div>
          </div>
          <h3>${ev.title}</h3>
          <p>${ev.description || ""}</p>
          <p><strong>Date:</strong> ${ev.date.split("T")[0]} | <strong>Time:</strong> ${ev.time}</p>
          <p><strong>Location:</strong> ${ev.venue}</p>
          <p><strong>Seats:</strong> ${ev.available_seats}/${ev.total_seats}</p>
          <div class="price-tag">${ev.price && parseFloat(ev.price) > 0 ? '$' + ev.price : 'FREE'}</div>
          <div class="card-actions" style="margin-top: 1rem; display: flex; gap: 10px;"></div>
      `;

      const actionsDiv = card.querySelector(".card-actions");

      // For Students → Register Button
      if (role === "student" || role === null) {
        const registerBtn = document.createElement("button");
        registerBtn.textContent = ev.available_seats > 0 ? "Register Now" : "Join Waitlist";
        registerBtn.onclick = () => registerForEvent(ev.event_id);
        actionsDiv.appendChild(registerBtn);
      }

      // For Admin → Update & Delete Buttons
      if (role === "admin") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete ❌";
        deleteBtn.style.background = "rgba(239, 68, 68, 0.2)";
        deleteBtn.style.color = "#ef4444";
        deleteBtn.onclick = () => deleteEvent(ev.event_id);
        actionsDiv.appendChild(deleteBtn);

        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update ✏️";
        updateBtn.onclick = () => updateEvent(ev.event_id);
        actionsDiv.appendChild(updateBtn);
      }

      eventsList.appendChild(card);
    });

    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll("#eventsList .card"), {
            max: 10,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
        });
    }
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
      alert(data.message + " ✅");
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
