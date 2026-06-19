const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Создание заказа
exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address } = req.body;
    const buyer_id = req.user.userId; // Из JWT токена (UUID)

    // Валидация
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    if (!shipping_address) {
      return res.status(400).json({ error: 'Адрес доставки обязателен' });
    }

    // Вычисляем общую сумму
    const total_amount = items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    // Создаем заказ с помощью транзакции
    const order = await prisma.$transaction(async (tx) => {
      // 1. Создаем заказ
      const newOrder = await tx.order.create({
        data: {
          buyer_id, // ✅ UUID (строка)
          total_amount,
          shipping_address,
          status: 'PENDING'
        }
      });

      // 2. Создаем позиции заказа
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            order_id: newOrder.id, // ✅ UUID (строка)
            product_id: item.id, // ✅ UUID (строка)
            seller_id: item.seller_id, // ✅ UUID (строка)
            title: item.title,
            price: parseFloat(item.price),
            quantity: item.quantity
          }
        });

        // 3. Уменьшаем остаток товара
        await tx.product.update({
          where: { id: item.id }, // ✅ UUID (строка)
          data: {
            stock_quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({
      message: 'Заказ создан',
      order: {
        id: order.id, // ✅ UUID (строка)
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение заказов пользователя
exports.getUserOrders = async (req, res) => {
  try {
    const buyer_id = req.user.userId; // ✅ UUID (строка)

    const orders = await prisma.order.findMany({
      where: { buyer_id }, // ✅ UUID (строка)
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image_url: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ orders });

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение деталей заказа по ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer_id = req.user.userId; // ✅ UUID (строка)

    const order = await prisma.order.findUnique({
      where: { 
        id: id, // ✅ Убрали parseInt (теперь строка UUID)
        buyer_id // ✅ UUID (строка)
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image_url: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};