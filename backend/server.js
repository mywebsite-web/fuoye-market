const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Models
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const User = mongoose.model("User", userSchema);

const listingSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  seller: String,
  phone: String,
  images: [String]
});
const Listing = mongoose.model("Listing", listingSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve images
app.use(express.static(path.join(__dirname, "../frontend"))); // serve frontend files

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// JWT Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Routes

// Register
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.json({ message: "User registered successfully" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ name: user.name }, process.env.JWT_SECRET);
  res.json({ token, name: user.name });
});

// Post Ad
app.post("/api/listings", authenticateToken, upload.array("images", 5), async (req, res) => {
  try {
    const images = req.files.map(file => `uploads/${file.filename}`);
    const { title, price, description, phone } = req.body;
    const listing = new Listing({ title, price, description, seller: req.user.name, phone, images });
    await listing.save();
    res.json({ message: "Ad posted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to post ad" });
  }
});

// Get all listings
app.get("/api/listings", async (req, res) => {
  const listings = await Listing.find();
  res.json({ listings });
});

// Delete listing
app.delete("/api/listings/:id", authenticateToken, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.seller !== req.user.name) return res.status(403).json({ error: "Forbidden" });
  await listing.deleteOne();
  res.json({ message: "Listing deleted" });
});


// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Catch-all route to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});



// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
