const API_URL = "http://localhost:5000/api/events";
const token = localStorage.getItem("token");

// --- Particle Initialization Function (New) ---
/**
 * Initializes the particles.js background animation with a cosmic configuration.
 */
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 5,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 6,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    } else {
        console.warn("particlesJS library not loaded.");
    }
}
// ---------------------------------------------


document.addEventListener("DOMContentLoaded", () => {
    // Initialize particles for visual effect
    initParticles();
    
    const eventList = document.getElementById("event-list");
    const createForm = document.getElementById("createEventForm");

    // ✅ Load Events
    async function loadEvents() {
        const res = await fetch(API_URL);
        // NOTE: Add error handling for non-200 responses if needed.
        const events = await res.json();

        eventList.innerHTML = "";
        events.forEach(ev => {
            const card = document.createElement("div");
            card.className = "card"; // Using 'card' class for consistent styling
            card.innerHTML = `
                <h3>${ev.title}</h3>
                <p>${ev.description || ""}</p>
                <p><strong>Date:</strong> ${ev.date.split("T")[0]} | ${ev.time}</p>
                <p><strong>Location:</strong> ${ev.venue}</p>
                <p><strong>Seats:</strong> ${ev.available_seats}/${ev.total_seats}</p>
                <button onclick="deleteEvent(${ev.event_id})">🗑 Delete</button>
                <button onclick="editEvent(${ev.event_id}, '${ev.title}', '${ev.description}', '${ev.date.split("T")[0]}', '${ev.time}', '${ev.venue}', ${ev.total_seats})">✏ Edit</button>
            `;
            eventList.appendChild(card);
        });
    }

    // ✅ Create Event
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newEvent = {
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            date: document.getElementById("date").value,
            time: document.getElementById("time").value,
            venue: document.getElementById("venue").value,
            total_seats: parseInt(document.getElementById("total_seats").value)
        };

        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(newEvent)
        });

        createForm.reset();
        loadEvents();
    });

    // ✅ Delete Event
    // NOTE: For better UX, replace window.confirm() with a custom modal.
    window.deleteEvent = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        loadEvents();
    };

    // ✅ Edit Event
    // NOTE: For better UX, replace window.prompt() with a custom edit modal.
    window.editEvent = async (id, title, description, date, time, venue, seats) => {
        const updatedTitle = prompt("Edit Title:", title);
        if (!updatedTitle) return; 
        
        const updatedEvent = {
            title: updatedTitle,
            description,
            date,
            time,
            venue,
            total_seats: seats
        };

        await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(updatedEvent)
        });

        loadEvents();
    };

    loadEvents();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    // Clear JWT/localStorage (or session)
    localStorage.removeItem("token"); 

    // Redirect to login page
    window.location.href = "login.html";
});
