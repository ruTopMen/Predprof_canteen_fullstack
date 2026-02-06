// services/api.ts

const BASE_URL = 'http://localhost:5000';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ошибка сервера');
  }

  return res.json();
}

export const api = {
  // --- Авторизация ---
  auth: {
    login: async (data: any) => {
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.token) localStorage.setItem('token', response.token);
      return response;
    },
    register: (data: any) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // --- Студент ---
  student: {
    getMenu: () => request('/student/menu'),
    // Получение профиля (баланс, аллергии)
    getProfile: () => request('/student/profile'),
    // Обновление аллергий
    updateProfile: (data: any) => request('/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    // Пополнение баланса
    topUp: (amount: number) => request('/student/balance', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),
    buy: (id: number, type: 'single' | 'subscription') => request('/student/buy', {
      method: 'POST',
      body: JSON.stringify({ menu_item_id: id, type })
    }),
    redeem: (orderId: number) => request(`/student/redeem/${orderId}`, {
      method: 'POST'
    }),
    sendReview: (data: any) => request('/student/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getReviews: (menuId: number) => request(`/student/reviews/${menuId}`),
  },

  // --- Повар ---
  cook: {
    addMenu: (data: any) => request('/cook/menu', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    sendRequest: (data: any) => request('/cook/request', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getServed: () => request('/cook/served'),

    // Склад продуктов
    getInventory: () => request('/cook/inventory'),
    addInventoryItem: (data: any) => request('/cook/inventory', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateInventoryItem: (id: number, data: any) => request(`/cook/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    deleteInventoryItem: (id: number) => request(`/cook/inventory/${id}`, {
      method: 'DELETE'
    }),
  },

  // --- Администратор ---
  admin: {
    getStats: () => request('/admin/stats'),
    getRequests: () => request('/admin/requests'),
    getDishesReport: () => request('/admin/dishes-report'),
    getExpensesReport: () => request('/admin/expenses-report'),
    approveRequest: (id: number, data?: { total_cost: number }) => request(`/admin/requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data || {})
    }),
    getAnalytics: (startDate?: string, endDate?: string) => {
      let url = '/admin/analytics';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      return request(url);
    },
  }
};
