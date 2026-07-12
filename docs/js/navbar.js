// frontend/js/navbar.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token) {
    document.getElementById("loginLink")?.style?.setProperty("display", "none");
    document.getElementById("registerLink")?.style?.setProperty("display", "none");
    document.getElementById("logoutBtn")?.style?.setProperty("display", "inline-block");
  }

  if (role === "admin") {
    document.getElementById("dashboardLink")?.style?.setProperty("display", "inline-block");
  }

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});
