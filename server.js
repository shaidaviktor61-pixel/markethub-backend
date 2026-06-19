const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');


const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',  // Разрешить запросы с любого домена
  credentials: true
}));
app.use(express.json());

// Роуты
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const categoryRoutes = require('./routes/categories');
app.use('/api/categories', categoryRoutes);
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

// Тестовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'MarketHub API работает!' });
});

// Проверка подключения к БД
app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany({select: {
      id: true,
      email: true,
      role: true,
      created_at: true
    }
  });
    res.json({ message: 'БД подключена!', users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});