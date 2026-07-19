const API_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");

function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 80 },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5 },
                "size": { "value": 5, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 6 }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }
            },
            "retina_detect": true
        });
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initParticles();
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const resultCard = document.getElementById("verify-result");

    if (!token) {
        resultCard.className = "verify-card invalid";
        resultCard.innerHTML = `<h2>Unauthorized ❌</h2><p>You must be logged in as an admin to verify tickets.</p><button onclick="window.location.href='login.html'">Login</button>`;
        return;
    }

    if (!code) {
        resultCard.className = "verify-card invalid";
        resultCard.innerHTML = `<h2>Invalid Request ❌</h2><p>No ticket code provided in the URL.</p>`;
        return;
    }

    try {
        const res = await fetch(`${API_URL}/registrations/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ticket_code: code })
        });

        const data = await res.json();

        if (res.ok && data.valid) {
            resultCard.className = "verify-card valid";
            resultCard.innerHTML = `
                <h2 style="color: #34d399;">Ticket Verified ✅</h2>
                <div class="ticket-details">
                    <p><strong>Event:</strong> ${data.ticket.title}</p>
                    <p><strong>Date:</strong> ${data.ticket.date.split("T")[0]}</p>
                    <p><strong>Venue:</strong> ${data.ticket.venue}</p>
                    <hr style="border-color: rgba(255,255,255,0.2); margin: 15px 0;">
                    <p><strong>Attendee:</strong> ${data.ticket.name}</p>
                    <p><strong>Email:</strong> ${data.ticket.email}</p>
                    <p><strong>Code:</strong> <span style="font-family: monospace; font-size:0.9em; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">${data.ticket.ticket_code}</span></p>
                </div>
            `;
        } else {
            resultCard.className = "verify-card invalid";
            resultCard.innerHTML = `
                <h2 style="color: #ef4444;">Verification Failed ❌</h2>
                <p>${data.message || "This ticket is invalid or does not exist."}</p>
            `;
        }
    } catch (err) {
        console.error(err);
        resultCard.className = "verify-card invalid";
        resultCard.innerHTML = `<h2>Server Error ❌</h2><p>Failed to connect to the server.</p>`;
    }
});
