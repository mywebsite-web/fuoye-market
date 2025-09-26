const listingsContainer = document.getElementById("listings");
const token = localStorage.getItem("token"); // JWT token of logged-in user
let username = "";

// Optional: decode username from JWT to get seller name
if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    username = payload.name;
  } catch (e) { console.log("Invalid token"); }
}

// Load listings from backend
async function loadListings() {
  try {
    const res = await fetch("/api/listings");
    const data = await res.json();

    listingsContainer.innerHTML = "";

    // Only show real listings
    if (!data.listings || data.listings.length === 0) {
      listingsContainer.innerHTML = "<p>No listings available.</p>";
      return;
    }

    data.listings.forEach(listing => {
      const ad = document.createElement("div");
      ad.className = "ad-card";

      const imagesHTML = listing.images.map(img => `<img src="${img}" alt="${listing.title}">`).join("");

      ad.innerHTML = `
        <div class="ad-images">${imagesHTML}</div>
        <h2>${listing.title}</h2>
        <p>Price: ₦${listing.price}</p>
        <p>${listing.description}</p>
        <p>Seller: ${listing.seller}</p>
        ${listing.seller === username ? 
          `<button onclick="deleteAd('${listing._id}')">Delete</button>` : 
          `<button onclick="buyAd('${listing.seller}', '${listing.phone}', '${listing.title}', '${listing.images[0]}')">Buy</button>`}
      `;

      listingsContainer.appendChild(ad);
    });
  } catch (err) {
    listingsContainer.innerHTML = "<p>Failed to load listings.</p>";
    console.error(err);
  }
}

// Delete ad function
async function deleteAd(id) {
  if (!confirm("Are you sure you want to delete this ad?")) return;

  const res = await fetch(`/api/listings/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });

  const json = await res.json();
  if (res.ok) {
    alert("Ad deleted successfully!");
    loadListings();
  } else {
    alert(json.error || "Failed to delete ad");
  }
}

// Buy ad → WhatsApp with image link
function buyAd(seller, phone, title, imagePath) {
  const url = `https://wa.me/${phone}?text=Hi ${seller}, I want to buy this product: ${title}. See image: ${window.location.origin}/${imagePath}`;
  window.open(url, "_blank");
}

// Load listings on page load
loadListings();



