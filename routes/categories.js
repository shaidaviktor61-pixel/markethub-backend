const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/categories - получить все категории
router.get('/', categoryController.getAllCategories);

module.exports = router;