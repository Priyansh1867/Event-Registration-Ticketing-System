const API_URL = "https://event-registration-ticketing-system.onrender.com/api"; // backend server

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketCode = urlParams.get('code');
    const resultState = document.getElementById('resultState');
    const loadingState = document.getElementById('loadingState');

    if (!ticketCode) {
        loadingState.style.display = 'none';
        resultState.style.display = 'block';
        resultState.innerHTML = `
            <div class="status-icon">❌</div>
            <h2 style="color: #ef4444;">Invalid Request</h2>
            <p>No ticket code provided in the URL.</p>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/registrations/verify/${ticketCode}`);
        const data = await response.json();

        loadingState.style.display = 'none';
        resultState.style.display = 'block';

        if (response.ok && data.valid) {
            const ticket = data.ticket;
            const dateStr = ticket.date.split("T")[0];
            
            resultState.innerHTML = `
                <div class="status-icon">✅</div>
                <h2 style="color: #22c55e; margin-bottom: 20px;">Ticket Valid!</h2>
                <div class="details" style="text-align: left; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-top: 20px;">
                    <p><strong>Attendee:</strong> <span style="color: #a855f7;">${ticket.name}</span></p>
                    <p><strong>Email:</strong> ${ticket.email}</p>
                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                    <p><strong>Event:</strong> ${ticket.title}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                    <p><strong>Location:</strong> ${ticket.venue}</p>
                    <p style="margin-top: 15px; font-size: 0.9rem; color: #888;">Code: ${ticket.ticket_code.split('-')[0].toUpperCase()}</p>
                </div>
            `;
        } else {
            resultState.innerHTML = `
                <div class="status-icon">❌</div>
                <h2 style="color: #ef4444;">Invalid Ticket</h2>
                <p>${data.message || 'This ticket could not be found or is fake.'}</p>
            `;
        }

    } catch (err) {
        console.error("Verification error:", err);
        loadingState.style.display = 'none';
        resultState.style.display = 'block';
        resultState.innerHTML = `
            <div class="status-icon">⚠️</div>
            <h2 style="color: #f59e0b;">Connection Error</h2>
            <p>Could not connect to the verification server. Please try again later.</p>
        `;
    }
});
