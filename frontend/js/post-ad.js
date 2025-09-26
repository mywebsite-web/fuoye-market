const form = document.getElementById("postAdForm");
const status = document.getElementById("status");
const token = localStorage.getItem("token"); // JWT token

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!token) {
    status.textContent = "You must be logged in to post an ad.";
    return;
  }

  const formData = new FormData(form);

  try {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { Authorization: token },
      body: formData
    });

    const json = await res.json();
    if (res.ok) {
      status.textContent = "Ad posted successfully!";
      form.reset();
    } else {
      status.textContent = json.error || "Failed to post ad";
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Error posting ad";
  }
});
