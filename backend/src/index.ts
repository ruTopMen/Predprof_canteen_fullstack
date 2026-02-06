import express from 'express';
import cors from 'cors';
import { initDB } from './database';

import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import cookRoutes from './routes/cook';
import adminRoutes from './routes/admin';
import inventoryRoutes from './routes/inventory';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение маршрутов
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/cook', cookRoutes);
app.use('/cook', inventoryRoutes); // Склад продуктов
app.use('/admin', adminRoutes);

// Запуск
const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};

start();