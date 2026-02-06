"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import { getUserRole } from "@/utils/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, TrendingUp, Users, DollarSign, CheckCircle, Clock, FileText, Download, Bell, X, Filter } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminAnalyticsChart } from "@/components/AdminAnalyticsChart"

export default function AdminDashboard() {
  const router = useRouter()

  // Состояние модального окна уведомлений
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)

  // Состояния данных
  const [stats, setStats] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [dishesReport, setDishesReport] = useState<any[]>([])
  const [expensesReport, setExpensesReport] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const fetchAnalytics = async (start?: string, end?: string) => {
    try {
      const data = await api.admin.getAnalytics(start, end)
      setAnalytics(data)
    } catch (e) {
      console.error("Failed to load analytics", e)
    }
  }

  // 1. Загрузка данных
  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, requestsData, reportData, expensesData] = await Promise.all([
        api.admin.getStats().catch(() => ({ total_orders: 0, total_revenue: 0 })),
        api.admin.getRequests().catch(() => []),
        api.admin.getDishesReport().catch(() => []),
        api.admin.getExpensesReport().catch(() => []),
      ])

      setStats(statsData)
      setRequests(requestsData)
      setDishesReport(reportData)
      setExpensesReport(expensesData)

      // Load analytics with current state (initially empty)
      await fetchAnalytics(dateRange.start, dateRange.end)

    } catch (err) {
      console.error("Ошибка загрузки данных админа")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Проверка роли
    const role = getUserRole()
    if (role && role !== 'admin') {
      alert('⚠️ Доступ запрещен! Вы вошли как: ' + role + '. Эта страница только для администраторов.')
      router.push('/')
      return
    }

    loadData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleApprove = async (id: number) => {
    try {
      const costStr = prompt("Введите стоимость закупки (для учета расходов):", "0")
      if (costStr === null) return; // Отмена

      const total_cost = parseFloat(costStr);
      if (isNaN(total_cost) || total_cost < 0) {
        alert("Пожалуйста, введите корректное число.");
        return;
      }

      await api.admin.approveRequest(id, { total_cost })
      alert("Заявка одобрена!")
      loadData() // Перезагружаем данные
    } catch (err: any) {
      console.error("Ошибка одобрения:", err)
      alert("Ошибка при одобрении: " + (err.response?.data?.message || err.message || "Неизвестная ошибка"))
    }
  }

  // Генерация HTML отчета (Beautiful Report)
  const downloadPDF = () => {
    const dateStr = new Date().toLocaleDateString('ru-RU');

    // HTML контент с встроенными стилями
    const content = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Отчет Столовая - ${dateStr}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          h2 { color: #0f172a; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .meta { margin-bottom: 40px; color: #64748b; font-size: 14px; background: #f1f5f9; padding: 15px; border-radius: 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; }
          .stat-val { font-size: 24px; font-weight: bold; color: #0f172a; display: block; margin-bottom: 5px; }
          .stat-label { font-size: 14px; color: #64748b; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden; }
          th, td { border: 1px solid #cbd5e1; padding: 12px 16px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
          tr:nth-child(even) { background-color: #fbfcfd; }
          tr:hover { background-color: #f1f5f9; }
          .total-row td { background-color: #e2e8f0; font-weight: bold; color: #0f172a; }
          
          @media print {
            body { padding: 0; max-width: 100%; }
            .no-print { display: none; }
            table { box-shadow: none; border: 1px solid #000; }
            th, td { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <h1>📊 Отчет по работе столовой</h1>
        <div class="meta">
          <strong>Дата формирования:</strong> ${dateStr} ${new Date().toLocaleTimeString()}<br>
          <strong>Период:</strong> За всё время
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-val">${stats?.total_orders || 0}</span>
            <span class="stat-label">Всего заказов</span>
          </div>
          <div class="stat-card" style="background: #f0fdf4; border-color: #bbf7d0;">
            <span class="stat-val" style="color: #16a34a;">${stats?.total_revenue || 0} ₽</span>
            <span class="stat-label" style="color: #15803d;">Общая выручка</span>
          </div>
          <div class="stat-card" style="background: #fef2f2; border-color: #fecaca;">
            <span class="stat-val" style="color: #dc2626;">${stats?.total_expenses || 0} ₽</span>
            <span class="stat-label" style="color: #b91c1c;">Расходы (закупки)</span>
          </div>
          <div class="stat-card" style="background: #eff6ff; border-color: #bfdbfe;">
            <span class="stat-val" style="color: #2563eb;">${stats?.net_profit || 0} ₽</span>
            <span class="stat-label" style="color: #1d4ed8;">Чистая прибыль</span>
          </div>
        </div>

        <h2>Детализация продаж (Доходы)</h2>
        <table>
          <thead>
            <tr>
              <th>Название блюда</th>
              <th style="text-align: right;">Продано (шт)</th>
              <th style="text-align: right;">Выручка (₽)</th>
            </tr>
          </thead>
          <tbody>
            ${dishesReport.map((item: any) => `
              <tr>
                <td>${item.dish_name || item.name || "Неизвестно"}</td>
                <td style="text-align: right;">${item.quantity_sold || item.count || 0}</td>
                <td style="text-align: right;">${item.total_revenue || 0}</td>
              </tr>
            `).join('')}
            
            <tr class="total-row">
              <td>ИТОГО</td>
              <td style="text-align: right;">${stats?.total_orders || 0}</td>
              <td style="text-align: right;">${stats?.total_revenue || 0}</td>
            </tr>
          </tbody>
        </table>

        <h2>Детализация закупок (Расходы)</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Продукт</th>
              <th style="text-align: right;">Количество</th>
              <th style="text-align: right;">Стоимость (₽)</th>
            </tr>
          </thead>
          <tbody>
            ${expensesReport.map((item: any) => `
              <tr>
                <td>#${item.id}</td>
                <td>${item.item_name}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${item.total_cost || 0}</td>
              </tr>
            `).join('')}
            
            <tr class="total-row">
              <td colspan="3">ИТОГО РАСХОДЫ</td>
              <td style="text-align: right;">${stats?.total_expenses || 0}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Документ сгенерирован автоматически системой управления столовой.<br>
          Для сохранения в PDF нажмите Ctrl+P (Печать) -> Сохранить как PDF
        </div>
      </body>
      </html>
    `;

    // Создаем Blob и скачиваем
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Отчет_Столовая_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl relative">

      {/* МОДАЛЬНОЕ ОКНО УВЕДОМЛЕНИЙ */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-[350px] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg">Уведомления</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNotifications(false)}>
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                <div className="bg-slate-100 p-4 rounded-full">
                  <Bell size={32} className="text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Новых уведомлений нет</p>
                <p className="text-xs text-slate-400 text-center px-4">Здесь будут появляться важные сообщения о работе столовой</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary" onClick={() => setShowNotifications(false)}>Понятно</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Шапка */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            🛡️ Панель Администратора
          </h1>
          <p className="text-slate-500 mt-1">Мониторинг и управление</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Кнопка обновления */}
          <Button variant="outline" size="icon" className="rounded-full border-slate-300 hover:bg-slate-50" onClick={loadData} title="Обновить данные">
            <TrendingUp size={20} className="text-slate-600" />
          </Button>

          {/* Кнопка колокольчика (Заглушка) */}
          <Button variant="outline" size="icon" className="rounded-full border-slate-300 hover:bg-slate-50 relative" onClick={() => setShowNotifications(true)}>
            <Bell size={20} className="text-slate-600" />
            {/* Индикатор (красная точка, если бы были уведомления) */}
            {/* <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span> */}
          </Button>

          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Выйти
          </Button>
        </div>
      </div>

      {/* Сводка */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats?.total_revenue || 0} ₽</div>
            <p className="text-xs text-green-600 mt-1">Доходы от продаж</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Активность высокая</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Расходы</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats?.total_expenses || 0} ₽</div>
            <p className="text-xs text-red-600 mt-1">Одобренные закупки</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Чистая прибыль</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.net_profit || 0} ₽</div>
            <p className="text-xs text-blue-600 mt-1">Доходы - Расходы</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Динамика доходов и посещаемости</CardTitle>
              <CardDescription>Статистика по дням</CardDescription>
            </div>
            <div className="flex items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <Label htmlFor="date-start" className="text-xs text-slate-500 mb-1 block">Начало</Label>
                <Input
                  id="date-start"
                  type="date"
                  className="bg-white h-8 w-[140px]"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date-end" className="text-xs text-slate-500 mb-1 block">Конец</Label>
                <Input
                  id="date-end"
                  type="date"
                  className="bg-white h-8 w-[140px]"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchAnalytics(dateRange.start, dateRange.end)}
                className="h-8"
              >
                <Filter size={14} className="mr-2" />
                Применить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminAnalyticsChart data={analytics} />
        </CardContent>
      </Card>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6">
          <TabsTrigger value="requests" className="px-6">Заявки от повара</TabsTrigger>
          <TabsTrigger value="sales" className="px-6">Отчет по продажам</TabsTrigger>
          <TabsTrigger value="reports" className="px-6">Документация</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader><CardTitle>Заявки на закупку</CardTitle><CardDescription>Требуют согласования</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Количество</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Нет активных заявок</TableCell></TableRow>
                  ) : (
                    requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.id}</TableCell>
                        <TableCell className="font-medium">{req.item_name}</TableCell>
                        <TableCell>{req.quantity}</TableCell>
                        <TableCell>
                          {req.status === 'approved'
                            ? <Badge className="bg-green-500"><CheckCircle size={12} className="mr-1" /> Одобрено</Badge>
                            : <Badge variant="outline" className="text-yellow-600 border-yellow-500"><Clock size={12} className="mr-1" /> Ожидает</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status !== 'approved' ? (
                            <Button size="sm" onClick={() => handleApprove(req.id)}>Одобрить</Button>
                          ) : <span className="text-xs text-slate-400 px-2">Обработано</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle>Детализация продаж</CardTitle><CardDescription>Популярность блюд</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название блюда</TableHead>
                    <TableHead className="text-right">Продано порций</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishesReport.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Нет данных</TableCell></TableRow>
                  ) : (
                    dishesReport.map((item, idx) => (
                      <TableRow key={idx}>
                        {/* ИСПРАВЛЕН МАППИНГ ПОЛЕЙ */}
                        <TableCell className="font-medium">
                          {item.dish_name || item.name || "Неизвестное блюдо"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {item.quantity_sold || item.count || 0} шт.
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total_revenue || 0} ₽
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-slate-50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="bg-white p-4 rounded-full shadow-sm"><FileText size={48} className="text-slate-400" /></div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-700">Отчет по затратам</h3>
                <p className="text-sm text-slate-500">Сформировать документ для бухгалтерии</p>
              </div>
              <Button onClick={downloadPDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Download size={16} /> Скачать HTML Отчет</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
