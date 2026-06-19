const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ✅ ИСПРАВЛЕННЫЙ CORS
app.use(cors({
  origin: 'https://markethub-frontend-nu.vercel.app', // Ваш фронтенд на Vercel
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Роуты
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

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

// ✅ ИСПРАВЛЕННЫЙ маршрут для проверки БД
app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ 
      message: 'БД подключена!', 
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('❌ Ошибка проверки БД:', error);
    res.status(500).json({ 
      error: 'Ошибка подключения к БД', 
      details: error.message 
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
