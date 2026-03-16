function goToPage(p) {
  const currentURL = new URLSearchParams(window.location.search);

  currentURL.set("page", p);
  window.location.search = currentURL.toString();
}
