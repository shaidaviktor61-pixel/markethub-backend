const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Создание платежа
router.post('/create-payment', async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;

    // Проверяем заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Данные для ЮKassa
    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.FRONTEND_URL}/order-success/${orderId}`,
      },
      description: description || `Заказ #${orderId}`,
      metadata: {
        order_id: orderId,
      },
      // Тестовый режим
      test: true,
    };

    // Отправляем запрос в ЮKassa
    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      paymentData,
      {
        auth: {
          username: process.env.YOOKASSA_SHOP_ID,
          password: process.env.YOOKASSA_SECRET_KEY,
        },
        headers: {
          'Idempotence-Key': uuidv4(),
          'Content-Type': 'application/json',
        },
      }
    );

    const payment = response.data;

    // Сохраняем payment_id в заказе (если добавили поле)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        // payment_id: payment.id, // добавить поле в schema
      },
    });

    res.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
      status: payment.status,
    });
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ 
      error: error.response?.data?.description || error.message 
    });
  }
});

// Обработка вебхуков (уведомления от ЮKassa)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    const payment = event.object;

    if (event.type === 'payment.succeeded') {
      const orderId = payment.metadata.order_id;
      
      // Обновляем статус заказа
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      
      console.log(`✅ Заказ #${orderId} оплачен!`);
    }

    if (event.type === 'payment.canceled') {
      const orderId = payment.metadata.order_id;
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      
      console.log(`❌ Заказ #${orderId} отменён`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;