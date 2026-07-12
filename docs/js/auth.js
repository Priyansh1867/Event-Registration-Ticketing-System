const API_URL = "http://localhost:5000/api"; // backend server

// ================= Custom Notification Function =================
// Replaces standard alert() with a custom, non-blocking UI message.
function showMessage(message, type = 'info') {
    const existingMsg = document.getElementById('custom-message-box');
    if (existingMsg) existingMsg.remove();

    const msgBox = document.createElement('div');
    msgBox.id = 'custom-message-box';
    msgBox.textContent = message;

    // Apply basic styling based on type
    let bgColor = '#4f46e5'; // Default info (blue)
    if (type === 'success') bgColor = '#34d399'; // Green
    if (type === 'error') bgColor = '#ef4444'; // Red

    Object.assign(msgBox.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 25px',
        borderRadius: '8px',
        color: '#ffffff',
        backgroundColor: bgColor,
        zIndex: '1000',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-out',
        transform: 'translateY(-20px)'
    });
    
    document.body.appendChild(msgBox);
    
    // Animate in
    setTimeout(() => {
        msgBox.style.opacity = '1';
        msgBox.style.transform = 'translateY(0)';
    }, 10);

    // Animate out and remove after 3 seconds
    setTimeout(() => {
        msgBox.style.opacity = '0';
        msgBox.style.transform = 'translateY(-20px)';
        msgBox.addEventListener('transitionend', () => msgBox.remove());
    }, 3000);
}

// ================= Particle Initialization Function =================
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


// Run particle initialization when the page is ready
document.addEventListener("DOMContentLoaded", initParticles);

// ================= Register =================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await res.json();
            if (res.ok) {
                showMessage("Registration successful ✅", 'success');
                // Use a slight delay to allow the user to see the message
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 800);
            } else {
                showMessage(data.message || "Registration failed ❌", 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage("Server error ❌", 'error');
        }
    });
}

// ================= Login =================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.user.role);
                localStorage.setItem("name", data.user.name);
                localStorage.setItem("userId",data.user.id);
                showMessage("Login successful ✅", 'success');

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === "admin") {
                        window.location.href = "admin-dashboard.html"; // Admin → Dashboard
                    } else {
                        window.location.href = "user-dashboard.html"; // User → Events page
                    }
                }, 800);


            } else {
                showMessage(data.message || "Login failed ❌", 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage("Server error ❌", 'error');
        }
    });
}

// ================= Logout =================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        showMessage("Logged out successfully.", 'info');
        // Give time for the message to show before redirect
        setTimeout(() => {
            window.location.href = "login.html";
        }, 800); 
    });
}
