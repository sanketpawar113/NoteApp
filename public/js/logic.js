  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");

  function updateIcon() {
    if (document.body.classList.contains("dark-mode")) {
      icon.classList.remove("bi-moon-stars");
      icon.classList.add("bi-brightness-high");
    } else {
      icon.classList.remove("bi-brightness-high");
      icon.classList.add("bi-moon-stars");
    }
  }

  updateIcon();

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }

    updateIcon();
  });
