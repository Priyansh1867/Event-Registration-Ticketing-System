const API_URL = "http://localhost:5000/api"; // ✅ backend base URL

document.addEventListener("DOMContentLoaded", () => {
  const eventList = document.getElementById("event-list");
  const registrationList = document.getElementById("registration-list");

  const token = localStorage.getItem("token"); // ✅ use JWT from login

  // Load all events
  async function loadEvents() {
    try {
      const res = await fetch(`${API_URL}/events`);
      const events = await res.json();

      eventList.innerHTML = "";
      events.forEach(ev => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${ev.title}</h3>
          <p>${ev.description || ""}</p>
          <p><strong>Date:</strong> ${ev.date.split("T")[0]} | <strong>Time:</strong> ${ev.time}</p>
          <p><strong>Location:</strong> ${ev.location}</p>
          <p><strong>Seats:</strong> ${ev.available_seats}/${ev.total_seats}</p>
          <button data-id="${ev.event_id}" class="registerBtn">Register</button>
        `;
        eventList.appendChild(card);
      });

      attachRegisterHandlers();
    } catch (err) {
      console.error("Error loading events:", err);
    }
  }

  // Load user's registrations
  async function loadRegistrations() {
    try {
      const res = await fetch(`${API_URL}/registrations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const regs = await res.json();

      registrationList.innerHTML = "";
      regs.forEach(reg => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${reg.title}</h3>
          <p><strong>Date:</strong> ${reg.date.split("T")[0]} | <strong>Time:</strong> ${reg.time}</p>
          <p><strong>Location:</strong> ${reg.location}</p>
          <p><strong>Ticket:</strong> ${reg.ticket_code}</p>
          <button data-id="${reg.reg_id}" class="cancelBtn">Cancel</button>
          <button onclick="downloadTicket(${reg.reg_id})">Download Ticket</button>
        `;
        registrationList.appendChild(card);
      });

      attachCancelHandlers();
    } catch (err) {
      console.error("Error loading registrations:", err);
    }
  }

  // Register handler
  function attachRegisterHandlers() {
    document.querySelectorAll(".registerBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const eventId = btn.getAttribute("data-id");
        await fetch(`${API_URL}/registrations/${eventId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        loadEvents();
        loadRegistrations();
      });
    });
  }

  // Cancel handler
  function attachCancelHandlers() {
    document.querySelectorAll(".cancelBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const regId = btn.getAttribute("data-id");
        await fetch(`${API_URL}/registrations/${regId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        loadEvents();
        loadRegistrations();
      });
    });
  }

  // Download Ticket
  window.downloadTicket = async (regId) => {
    const res = await fetch(`${API_URL}/registrations/ticket/${regId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_${regId}.pdf`;
    a.click();
  };

  // Load data on page ready
  loadEvents();
  loadRegistrations();
});
