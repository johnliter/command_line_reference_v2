(function () {
  const root = document.documentElement;
  const key = "clr_theme_v2";

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(key, theme);
    const label = document.getElementById("themeLabel");
    if (label) label.textContent = theme === "light" ? "Light" : "Dark";
  }

  // init
  const saved = localStorage.getItem(key);
  if (saved === "light" || saved === "dark") {
    setTheme(saved);
  } else {
    // default dark
    setTheme("dark");
  }

  // toggle
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      setTheme(current === "dark" ? "light" : "dark");
    });
  });
})();