const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
exports.verifyToken = (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Токен должен быть в формате: Bearer <token>
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Неверный формат токена' });
    }

    // Проверяем и декодируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Добавляем данные пользователя в запрос
    req.user = decoded;

    // Передаем управление следующему обработчику
    next();

  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return res.status(401).json({ error: 'Невалидный токен' });
  }
};

// Middleware для проверки роли (только для продавцов)
exports.isSeller = (req, res, next) => {
  if (req.user.role !== 'SELLER') {
    return res.status(403).json({ error: 'Доступ только для продавцов' });
  }
  next();
};

// Middleware для проверки роли (только для админов)
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ только для администраторов' });
  }
  next();
};