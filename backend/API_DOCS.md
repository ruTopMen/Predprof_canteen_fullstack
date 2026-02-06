# Canteen Backend API Documentation

## Запуск (Setup & Run)

### Установка зависимостей
```bash
npm install
```

### Запуск сервера
Сервер запускается на порту **5000**.
```bash
npm run dev
```

---

## Authentication (`/auth`)
### Регистрация
- **POST** `/auth/register`
- **Body**: `{ "username": "...", "password": "...", "role": "student|cook|admin", "allergies": "..." (optional) }`

### Вход
- **POST** `/auth/login`
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "token": "..." }`

---

## Student (`/student`)
*Требуется Role: student*

### Меню
- **GET** `/student/menu` - Показать доступное меню (qty > 0).

### Покупка
- **POST** `/student/buy`
- **Body**: `{ "menu_item_id": 1, "type": "single|subscription" }`
- **Logic**: Списывает баланс, уменьшает кол-во порций, создает запись в `orders`.

### Профиль и Баланс
- **GET** `/student/profile` - Получить данные пользователя (баланс, аллергии).
- **PATCH** `/student/profile` - Обновить аллергии (`{ "allergies": "..." }`).
- **POST** `/student/balance` - Пополнить баланс (`{ "amount": 500 }`).

### Отзывы
- **POST** `/student/reviews` - Оставить отзыв (`{ "menu_item_id": 1, "rating": 5, "comment": "..." }`).
- **GET** `/student/reviews/:menuId` - Посмотреть отзывы о блюде.

---

## Cook (`/cook`)
*Требуется Role: cook (или admin)*

### Управление Меню (Блюда)
- **POST** `/cook/menu` - Добавить блюдо или пополнить кол-во.
  - **Body**: `{ "name": "...", "description": "...", "price": 100, "type": "main", "available_qty": 10 }`
  - **Logic**: Если блюдо с таким `name` уже есть, прибавляет `available_qty` к существующему.

### Закупки (Склад)
- **POST** `/cook/request` - Отправить заявку админу на закупку продуктов.
  - **Body**: `{ "item_name": "Картофель", "quantity": 50 }`

### Склад (Продукты/Ингредиенты)
См. раздел **Inventory**.

---

## Admin (`/admin`)
*Требуется Role: admin*

### Статистика
- **GET** `/admin/stats` - Общая статистика (Выручка, Расходы, Прибыль).
- **GET** `/admin/dishes-report` - Детальный отчет по продажам блюд.
- **GET** `/admin/expenses-report` - Детальный отчет по расходам (одобренные закупки).

### Управление Заявками
- **GET** `/admin/requests` - Просмотр ожидающих заявок.
- **PUT** `/admin/requests/:id/approve` - Одобрить заявку.
  - **Body**: `{ "total_cost": 500 }` (Обязательно указать стоимость для учета расходов).

---

## Inventory (`/cook/inventory` or `/inventory` alias)
*Доступно: Cook, Admin*

- **GET** `/inventory` - Список продуктов на складе.
- **POST** `/inventory` - Добавить продукт.
  - **Body**: `{ "product_name": "...", "quantity": 10, "unit": "kg" }`
  - **Logic**: Если продукт есть, увеличивает его кол-во.
- **PATCH** `/inventory/:id` - Обновить остаток вручную.
- **DELETE** `/inventory/:id` - Удалить продукт.
