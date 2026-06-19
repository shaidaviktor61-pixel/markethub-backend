const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получение всех категорий
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ categories });

  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};