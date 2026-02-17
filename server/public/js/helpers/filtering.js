const refineSearchButton = document.getElementById("refine-btn");

const categoryOptions = document.getElementsByClassName("category-checkboxes");

const minimumPriceBox = document.getElementById("min-price");

const maximumPriceBox = document.getElementById("max-price");

minimumPriceBox.addEventListener("input", () => {
  console.log(minimumPriceBox.value);
});

refineSearchButton.addEventListener("click", () => {
  const newFetchDetails = new URLSearchParams(window.location.search);

  if (minimumPriceBox.value)
    newFetchDetails.set("minPrice", minimumPriceBox.value);
  else newFetchDetails.delete("minPrice");

  if (maximumPriceBox.value)
    newFetchDetails.set("maxPrice", maximumPriceBox.value);
  else newFetchDetails.delete("maxPrice");

  if (categoryOptions.length >= 1) {
    newFetchDetails.delete("category");

    for (let category of categoryOptions) {
      if (category.checked) {
        newFetchDetails.append("category", category.value);
      }
    }
  }

  newFetchDetails.set("page", 1);
  window.location.search = newFetchDetails.toString();
});
