const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  seller: { type: String, required: true }, // later this can be userId
  status: { type: String, enum: ["available", "sold"], default: "available" },
}, { timestamps: true });

module.exports = mongoose.model("Listing", listingSchema);
