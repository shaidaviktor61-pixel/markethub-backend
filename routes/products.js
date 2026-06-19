const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isSeller } = require('../middleware/auth');

// GET /api/products - получить все товары (публичный)
router.get('/', productController.getAllProducts);

// GET /api/products/seller - получить товары текущего продавца (защищенный)
router.get('/seller', verifyToken, isSeller, productController.getSellerProducts);

// GET /api/products/:id - получить товар по ID (публичный)
router.get('/:id', productController.getProductById);

// POST /api/products - создать товар (только для продавцов)
router.post('/', verifyToken, isSeller, productController.createProduct);

// DELETE /api/products/:id - удалить товар (только для продавца этого товара)
router.delete('/:id', verifyToken, isSeller, productController.deleteProduct);

module.exports = router;