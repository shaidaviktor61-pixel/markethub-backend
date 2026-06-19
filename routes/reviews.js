const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

// POST /api/reviews - создать отзыв (только для авторизованных)
router.post('/', verifyToken, reviewController.createReview);

// GET /api/reviews/product/:product_id - получить отзывы товара
router.get('/product/:product_id', reviewController.getProductReviews);

module.exports = router;