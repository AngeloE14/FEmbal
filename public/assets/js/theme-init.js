(function () {
  try {
    var savedTheme = localStorage.getItem("formulador-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (error) {
    // Ignora si localStorage no esta disponible.
  }
})();
