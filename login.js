(function () {
  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");
  const passInput = document.getElementById("adminPass");
  const togglePassword = document.getElementById("togglePassword");

  togglePassword.addEventListener("click", () => {
    const shouldShow = passInput.type === "password";
    passInput.type = shouldShow ? "text" : "password";
    togglePassword.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
    togglePassword.setAttribute("aria-pressed", String(shouldShow));
    togglePassword.classList.toggle("active", shouldShow);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = document.getElementById("adminUser").value.trim();
    const pass = document.getElementById("adminPass").value;

    if (user === "VishnuPP11@" && pass === "vISHNUPP3355@") {
      sessionStorage.setItem("portfolioAdminLoggedIn", "true");
      location.href = "admin.html";
      return;
    }

    error.textContent = "Wrong username or password.";
  });
})();
