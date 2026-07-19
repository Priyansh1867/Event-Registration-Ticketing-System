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
          <button data-id="${ev.event_id}" class="registerBtn">
            ${ev.available_seats > 0 ? 'Register Now' : 'Join Waitlist'}
          </button>
        `;
        eventList.appendChild(card);
      });

      if (typeof VanillaTilt !== 'undefined') {
          VanillaTilt.init(document.querySelectorAll("#event-list .card"), {
              max: 10,
              speed: 400,
              glare: true,
              "max-glare": 0.2,
          });
      }

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
        const isWaitlisted = reg.status === 'waitlisted';
        
        card.innerHTML = `
          <div class="status-badge ${isWaitlisted ? 'status-waitlisted' : 'status-registered'}">
            ${isWaitlisted ? '🕒 WAITLISTED' : '✅ REGISTERED'}
          </div>
          <h3>${reg.title}</h3>
          <p><strong>Date:</strong> ${reg.date.split("T")[0]} | <strong>Time:</strong> ${reg.time}</p>
          <p><strong>Location:</strong> ${reg.venue}</p>
          <p><strong>Ticket Code:</strong> ${reg.ticket_code.split('-')[0].toUpperCase()}</p>
          
          <div style="display:flex; gap: 10px; margin-top: 15px;">
            <button data-id="${reg.reg_id}" class="cancelBtn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; flex: 1;">Cancel</button>
            <button onclick="downloadTicket(${reg.reg_id})" ${isWaitlisted ? 'disabled style="background: gray; cursor: not-allowed; flex:1;"' : 'style="flex: 1;"'}>
              ${isWaitlisted ? 'Ticket Unavailable' : 'Download Ticket'}
            </button>
          </div>
        `;
        registrationList.appendChild(card);
      });

      if (typeof VanillaTilt !== 'undefined') {
          VanillaTilt.init(document.querySelectorAll("#registration-list .card"), {
              max: 10,
              speed: 400,
              glare: true,
              "max-glare": 0.2,
          });
      }

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
        const response = await fetch(`${API_URL}/registrations/${eventId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
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
    
    if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Cannot download ticket.");
        return;
    }

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
