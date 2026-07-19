const API_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    const profileForm = document.getElementById("profileForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const roleBadge = document.getElementById("roleBadge");

    // Load Profile Data
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            nameInput.value = user.name;
            emailInput.value = user.email;
            roleBadge.textContent = user.role === 'admin' ? '⭐ Administrator' : '🎓 Student';
        } else {
            alert("Failed to load profile. Please login again.");
            localStorage.clear();
            window.location.href = "login.html";
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }

    // Handle Profile Update
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updateData = {
            name: nameInput.value,
            email: emailInput.value,
            password: passwordInput.value // might be empty, backend handles it
        };

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profile updated successfully! ✅");
                passwordInput.value = ""; // clear password field
                
                // Update local storage if they changed their name/role
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
            } else {
                alert(data.message || "Failed to update profile ❌");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Server error. Please try again later.");
        }
    });
});
