// Global variables
let productsData = null;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const loadingState = document.getElementById("loadingState");
const resultsSection = document.getElementById("resultsSection");
const sampleProducts = document.querySelectorAll(".sample-product");

// Load products data from JSON
async function loadProductsData() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Failed to load products data");
    }
    productsData = await response.json();
    console.log("✅ Products data loaded successfully");
  } catch (error) {
    console.warn(
      "⚠️ Could not load products.json, using fallback data:",
      error
    );
  }
}


// Event Listeners
searchInput.addEventListener("input", handleSearchInput);
searchInput.addEventListener("keypress", handleKeyPress);
searchBtn.addEventListener("click", performSearch);
clearBtn.addEventListener("click", clearSearch);

// Sample product listeners
sampleProducts.forEach((product) => {
  product.addEventListener("click", () => {
    const productType = product.dataset.product;
    if (productsData && productsData.products[productType]) {
      searchInput.value = productsData.products[productType].name;
      performSearch();
    }
  });
});

function handleSearchInput() {
  const value = searchInput.value.trim();
  clearBtn.style.opacity = value ? "1" : "0";

  // Animate search icon based on input
  const searchIcon = document.getElementById("searchIcon");
  if (value) {
    searchIcon.classList.add("text-emerald-500", "scale-110");
    searchIcon.classList.remove("text-gray-400");
  } else {
    searchIcon.classList.add("text-gray-400");
    searchIcon.classList.remove("text-emerald-500", "scale-110");
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    performSearch();
  }
}

function clearSearch() {
  searchInput.value = "";
  clearBtn.style.opacity = "0";
  resultsSection.classList.add("hidden");
  loadingState.classList.add("hidden");

  // Hide suggestions
  const suggestionsContainer = document.getElementById("ecoSuggestions");
  suggestionsContainer.classList.add("hidden");

  // Cancel any scheduled search
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }

  // Reset search icon
  const searchIcon = document.getElementById("searchIcon");
  searchIcon.classList.add("text-gray-400");
  searchIcon.classList.remove("text-emerald-500", "scale-110");
}

let searchTimeout = null; // global variable

function performSearch() {
  const query = searchInput.value.trim();
  if (!query || !productsData) return;

  // Show loading state
  loadingState.classList.remove("hidden");
  resultsSection.classList.add("hidden");

  // Clear any previous timeout
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    const productData = analyzeProduct(query);
    displayResults(productData);

    loadingState.classList.add("hidden");
    resultsSection.classList.remove("hidden");

    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 2500);
}

function analyzeProduct(query) {
  // Check if it matches a sample product
  const searchTerm = query.toLowerCase().trim();

  for (const [key, product] of Object.entries(productsData.products)) {
    const productKey = key.replace("-", " ").toLowerCase();
    const productName = product.name.toLowerCase();

    if (
      searchTerm.includes(productKey) || // query contains product key
      productKey.includes(searchTerm) || // product key contains query
      searchTerm.includes(productName) || // query contains product name
      productName.includes(searchTerm) // product name contains query
    ) {
      return product;
    }
  }

  // Generate realistic product for unknown queries
  return createRealisticProduct(query);
}

function createRealisticProduct(query) {
  return {
    name: query,
    category: "Unknown Product",
    image: "❓",
    ecoScore: 0,
    recommendation: "Data Not Found",
    tip: "This product was not found in our database. Please check the spelling or try another search.",
    details: {
      Status: "No data available",
      Suggestion: "Use sample products or search eco-certified alternatives.",
    },
  };
}

function showEcoAlternatives(query) {
  if (!productsData) return;

  const suggestionsContainer = document.getElementById("ecoSuggestions");

  const ecoProducts = Object.values(productsData.products).filter(
    (p) =>
      p.ecoScore >= 70 && p.name.toLowerCase().includes(query.toLowerCase())
  );

  // Agar koi eco-friendly product nahi mila → fallback top 2 products
  const alternatives = ecoProducts.length
    ? ecoProducts.slice(0, 2)
    : Object.values(productsData.products)
        .sort((a, b) => b.ecoScore - a.ecoScore)
        .slice(0, 2); // only top 2

  if (alternatives.length === 0) {
    suggestionsContainer.classList.add("hidden");
    return;
  }

  suggestionsContainer.innerHTML = alternatives
    .map((p) => {
      const color =
        p.ecoScore >= 85
          ? "bg-green-100 hover:bg-green-200"
          : "bg-yellow-100 hover:bg-yellow-200";
      return `
            <div class="px-4 py-3 ${color} cursor-pointer transition-all duration-200 flex justify-between items-center border-b last:border-none">
                <span class="font-medium text-gray-800">${p.name}</span>
                <span class="font-semibold text-gray-700">${p.ecoScore}/100</span>
            </div>
        `;
    })
    .join("");

  suggestionsContainer.classList.remove("hidden");

  // Click → open product in main card
  Array.from(suggestionsContainer.children).forEach((el, i) => {
    el.addEventListener("click", () => {
      const selectedProduct = alternatives[i];
      searchInput.value = selectedProduct.name;
      suggestionsContainer.classList.add("hidden");
      displayResults(selectedProduct);
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// Input listener
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  const suggestionsContainer = document.getElementById("ecoSuggestions");
  if (!query) {
    suggestionsContainer.classList.add("hidden");
    suggestionsContainer.innerHTML = "";
    return;
  }
  showEcoAlternatives(query);
});

// Input listener
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  const suggestionsContainer = document.getElementById("ecoSuggestions");
  if (!query) {
    suggestionsContainer.classList.add("hidden");
    suggestionsContainer.innerHTML = "";
    return;
  }
  showEcoAlternatives(query);
});

function displayResults(product) {
  // Update product overview
  document.getElementById("productName").textContent = product.name;
  document.getElementById("productCategory").textContent = product.category;

  // Update product image with animation
  const productImageEl = document.getElementById("productImage");
  productImageEl.innerHTML = `<div class="text-9xl animate-float">${product.image}</div>`;

  // Update and animate eco score
  const ecoScore = product.ecoScore;
  document.getElementById("ecoScore").textContent = `${ecoScore}/100`;

  // Animate score bar with delay for dramatic effect
  setTimeout(() => {
    document.getElementById("ecoScoreBar").style.width = `${ecoScore}%`;
  }, 500);

  // Update score bar color based on score
  const scoreBar = document.getElementById("ecoScoreBar");
  if (ecoScore >= 85) {
    scoreBar.className =
      "bg-gradient-to-r from-emerald-500 to-green-500 h-5 rounded-full transition-all duration-2000 shadow-lg";
  } else if (ecoScore >= 70) {
    scoreBar.className =
      "bg-gradient-to-r from-yellow-500 to-orange-500 h-5 rounded-full transition-all duration-2000 shadow-lg";
  } else {
    scoreBar.className =
      "bg-gradient-to-r from-red-500 to-pink-500 h-5 rounded-full transition-all duration-2000 shadow-lg";
  }

  // Update recommendation badge
  const recommendationEl = document.getElementById("buyRecommendation");
  if (product.recommendation.includes("Recommended")) {
    recommendationEl.className =
      "inline-flex items-center space-x-3 bg-emerald-100 text-emerald-800 px-8 py-4 rounded-full mb-8 shadow-lg animate-bounce-soft";
    recommendationEl.innerHTML = `
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="font-semibold text-lg">${product.recommendation}</span>
                `;
  } else {
    recommendationEl.className =
      "inline-flex items-center space-x-3 bg-orange-100 text-orange-800 px-8 py-4 rounded-full mb-8 shadow-lg animate-bounce-soft";
    recommendationEl.innerHTML = `
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="font-semibold text-lg">${product.recommendation}</span>
                `;
  }

  // Update product details with enhanced responsive styling
  const detailsHTML = Object.entries(product.details)
    .map(
      ([key, value]) => `
                <div class="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/50 rounded-lg sm:rounded-xl border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-white/60">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <span class="font-semibold text-gray-700 text-sm sm:text-base">${key}:</span>
                        <p class="text-gray-600 text-sm sm:text-base mt-1">${value}</p>
                    </div>
                </div>
            `
    )
    .join("");
  document.getElementById("productDetails").innerHTML = detailsHTML;

  // Update eco tip
  document.getElementById("ecoTip").querySelector("p").textContent =
    product.tip;
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌱 EcoMate initializing...");
  loadProductsData();
});
