const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    placeId: {
      type: String,
      required: true,
    },
    placeName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 600,
      trim: true,
    },
    tags: {
      type: [String],
      enum: ["SIN TACC", "Vegano", "Vegetariano", "Kosher", "Halal"],
      default: [],
    },
    images: {
      type: [String], // URLs en Cloudinary u otro CDN
      default: [],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Review", reviewSchema)
