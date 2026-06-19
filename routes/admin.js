const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin } = require('../middleware/auth');

// Все маршруты защищены — только для админов
router.use(verifyToken, isAdmin);

// 📊 Статистика
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
    console.error('❌ Ошибка в /stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 👥 Получение всех пользователей
router.get('/users', async (req, res) => {
  try {
    console.log('🔍 Запрос на /api/admin/users');
    
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`✅ Найдено ${users.length} пользователей`);
    res.json({ users });
  } catch (error) {
    console.error('❌ Ошибка в /users:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки пользователей',
      details: error.message 
    });
  }
});

// 🔄 Изменение роли пользователя
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    const user = await prisma.user.update({
      where: { id: id },
      data: { role }
    });

    res.json({ 
      message: 'Роль обновлена',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('❌ Ошибка изменения роли:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📦 Получение всех заказов с деталями
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        buyer: {
          select: { id: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, price: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    console.error('❌ Ошибка в /orders:', error);
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
      where: { id: id },
      data: { status }
    });

    res.json({ 
      message: 'Статус обновлён',
      order: { id: order.id, status: order.status }
    });
  } catch (error) {
    console.error('❌ Ошибка изменения статуса заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📦 Получение всех товаров
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        seller: {
          select: { id: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ products });
  } catch (error) {
    console.error('❌ Ошибка в /products:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = id;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Удаление товара
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: id }
    });

    res.json({ message: 'Товар удалён' });
  } catch (error) {
    console.error('❌ Ошибка удаления товара:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;