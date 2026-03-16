const sortBy = document.getElementById("sortBy");

sortBy.addEventListener("change", () => {
  const windowURL = new URLSearchParams(window.location.search);

  windowURL.set("page", 1);
  windowURL.set("sortBy", sortBy.value);

  window.location.search = windowURL.toString();
});
