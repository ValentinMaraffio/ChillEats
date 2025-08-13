const express = require("express")
const router = express.Router()
const reviewController = require("../controllers/reviewController")
const { identifier } = require("../middlewares/identification")

// Ruta para crear reseña (protegida)
router.post("/create", identifier, reviewController.createReview)
// Obtener todas las reseñas de un lugar
router.get("/place/:placeId", reviewController.getReviewsByPlace)
// Obtener todas las reseñas de un usuario
router.get("/my-reviews", identifier, reviewController.getReviewsByUser)

module.exports = router
