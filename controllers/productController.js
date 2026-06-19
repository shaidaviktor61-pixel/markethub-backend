const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Создание товара (только для продавцов)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, stock_quantity, category_id, image_url } = req.body;

    // Валидация
    if (!title || !price || !category_id) {
      return res.status(400).json({ error: 'Название, цена и категория обязательны' });
    }

    // Создаем товар
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price), // Преобразуем в число
        stock_quantity: stock_quantity || 0,
        category_id: parseInt(category_id),
        image_url,
        seller_id: req.user.userId // Берем ID продавца из токена!
      }
    });

    res.status(201).json({
      message: 'Товар создан',
      product
    });

  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение всех товаров
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        seller: {
          select: {
            id: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ products });

  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение товара по ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        seller: {
          select: {
            id: true,
            email: true
          }
        },
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
// Получение товаров текущего продавца
exports.getSellerProducts = async (req, res) => {
  try {
    const seller_id = req.user.userId;

    const products = await prisma.product.findMany({
      where: { seller_id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ products });

  } catch (error) {
    console.error('Ошибка получения товаров продавца:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Удаление товара
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const seller_id = req.user.userId;

    // Проверяем, что товар принадлежит этому продавцу
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (product.seller_id !== seller_id) {
      return res.status(403).json({ error: 'Нет прав на удаление этого товара' });
    }

    // Удаляем товар
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Товар удален' });

  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};