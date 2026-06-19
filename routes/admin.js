// routes/admin.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, isAdmin } = require('../middleware/auth');

// Все маршруты админ-панели защищены
router.use(authenticate, isAdmin);

// 📊 Получение статистики
router.get('/stats', async (req, res) => {
  try {
    const [usersCount, productsCount, ordersCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: { status: 'DELIVERED' }
      })
    ]);

    res.json({
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
      revenue: totalRevenue._sum.total_amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 👥 Получение всех пользователей
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true
      }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 👤 Изменение роли пользователя
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📦 Получение всех заказов
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { email: true }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📦 Обновление статуса заказа
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;