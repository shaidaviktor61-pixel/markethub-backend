const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Создание отзыва
exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.userId;

    // Валидация
    if (!product_id || !rating) {
      return res.status(400).json({ error: 'product_id и rating обязательны' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    // Проверяем, что товар существует
    const product = await prisma.product.findUnique({
      where: { id: product_id } // ✅ Убрали parseInt (теперь строка UUID)
    });

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Проверяем, что пользователь уже не оставлял отзыв на этот товар
    const existingReview = await prisma.review.findUnique({
      where: {
        user_id_product_id: {
          user_id,
          product_id: product_id // ✅ Убрали parseInt (теперь строка UUID)
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Вы уже оставили отзыв на этот товар' });
    }

    // Создаём отзыв
    const review = await prisma.review.create({
      data: {
        user_id,
        product_id: product_id, // ✅ Убрали parseInt (теперь строка UUID)
        rating: parseInt(rating), // ✅ Оставляем parseInt для rating (число)
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ review });

  } catch (error) {
    console.error('Ошибка создания отзыва:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение отзывов товара
exports.getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { product_id: product_id }, // ✅ Убрали parseInt (теперь строка UUID)
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Вычисляем средний рейтинг
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ 
      reviews,
      averageRating: averageRating.toFixed(1),
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};