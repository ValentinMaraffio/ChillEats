const Review = require("../models/reviewModel")
const User = require("../models/usersModel") // Para traer nombre y foto

// Crear nueva reseña
exports.createReview = async (req, res) => {
  const { placeId, placeName, rating, comment, tags, images } = req.body
  const { userId } = req.user

  try {
    if (!placeId || !placeName || !rating) {
      return res.status(400).json({ success: false, message: "Faltan datos obligatorios" })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "La puntuación debe estar entre 1 y 5" })
    }

    const newReview = await Review.create({
      userId,
      placeId,
      placeName,
      rating,
      comment,
      tags,
      images,
    })

    res.status(201).json({ success: true, review: newReview })
  } catch (error) {
    console.error("Error creando la reseña:", error)
    res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
}

exports.getReviewsByPlace = async (req, res) => {
  const { placeId } = req.params

  try {
    const reviews = await Review.find({ placeId })
      .populate("userId", "name profileImage") // nombre y foto del usuario
      .sort({ createdAt: -1 }) // más recientes primero

    res.status(200).json({ success: true, reviews })
  } catch (error) {
    console.error("Error obteniendo reseñas:", error)
    res.status(500).json({ success: false, message: "Error al obtener las reseñas" })
  }
}

exports.getReviewsByUser = async (req, res) => {
  const { userId } = req.user

  try {
    const reviews = await Review.find({ userId }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, reviews })
  } catch (error) {
    console.error("Error al obtener reseñas del usuario:", error)
    res.status(500).json({ success: false, message: "Error interno del servidor" })
  }
}