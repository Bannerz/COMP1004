function showHtmlDiv() {
  var htmlShow = document.getElementById("hideDiv");
  if (htmlShow.style.display == "none") {
    htmlShow.style.display = "block";
  } else {
    htmlShow.style.display = "none";
  }
}

function toggleDarkMode() {
  var dark_mode_sky = document.getElementById("body_bg");
  var dark_mode_body = document.getElementById("pageBody");

  if (dark_mode_sky.classList == "light_mode") {
    dark_mode_sky.classList.remove("light_mode");
    dark_mode_sky.classList.add("dark_mode");
    localStorage.setItem("darkMode", "enabled");
  } else if (dark_mode_sky.classList == "dark_mode") {
    dark_mode_sky.classList.remove("dark_mode");
    dark_mode_sky.classList.add("light_mode");
    localStorage.setItem("darkMode", "disabled");
  }

  if (dark_mode_body.classList == "pageBody") {
    dark_mode_body.classList.remove("pageBody");
    dark_mode_body.classList.add("pageBody_dark");
  } else if (dark_mode_body.classList == "pageBody_dark") {
    dark_mode_body.classList.remove("pageBody_dark");
    dark_mode_body.classList.add("pageBody");
  }

}

function applyDarkModePreference() {
  var dark_mode_sky = document.getElementById("body_bg");
  var dark_mode_body = document.getElementById("pageBody");
  var darkMode = localStorage.getItem("darkMode");

  if (darkMode === "enabled") {
    dark_mode_sky.classList.remove("light_mode");
    dark_mode_sky.classList.add("dark_mode");
    dark_mode_body.classList.remove("pageBody");
    dark_mode_body.classList.add("pageBody_dark");
  } else {
    dark_mode_sky.classList.remove("dark_mode");
    dark_mode_sky.classList.add("light_mode");
    dark_mode_body.classList.remove("pageBody_dark");
    dark_mode_body.classList.add("pageBody");
  }
}

// Apply the user's preference when the page loads
document.addEventListener("DOMContentLoaded", applyDarkModePreference);
