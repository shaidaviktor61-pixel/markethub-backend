const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// POST /api/orders - создать заказ
router.post('/', verifyToken, orderController.createOrder);

// GET /api/orders - получить мои заказы
router.get('/', verifyToken, orderController.getUserOrders);

// GET /api/orders/:id - получить детали заказа
router.get('/:id', verifyToken, orderController.getOrderById);

module.exports = router;