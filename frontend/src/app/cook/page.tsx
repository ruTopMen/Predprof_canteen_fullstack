"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import { getUserRole } from "@/utils/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, PlusCircle, AlertTriangle, ShoppingCart, UtensilsCrossed, Bell, X } from "lucide-react"

export default function CookPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Состояния данных
  const [menu, setMenu] = useState<any[]>([])
  const [servedOrders, setServedOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])

  // Уведомления
  const [showNotifications, setShowNotifications] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  // Формы
  const [requestItem, setRequestItem] = useState({ item_name: "", quantity: "" })
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    type: "lunch",
    available_qty: ""
  })
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    quantity: "",
    unit: "кг",
    min_threshold: ""
  })
  const [editingProduct, setEditingProduct] = useState<any>(null)

  // 1. Загрузка данных
  // 1. Загрузка данных
  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      // Используем allSettled, чтобы ошибка в одном запросе не ломала остальные
      const results = await Promise.allSettled([
        api.student.getMenu(),
        api.cook.getServed(),
        api.cook.getInventory()
      ])

      const [menuRes, servedRes, inventoryRes] = results

      // Меню
      if (menuRes.status === 'fulfilled') {
        setMenu(menuRes.value)
        const lowStock = menuRes.value.filter((item: any) => item.available_qty < 10)
        setLowStockItems(lowStock)
      } else {
        console.error("Ошибка загрузки меню:", menuRes.reason)
      }

      // Выданные заказы
      if (servedRes.status === 'fulfilled') {
        console.log("Served Orders Data:", servedRes.value);
        setServedOrders(servedRes.value)
      } else {
        console.error("Ошибка загрузки заказов:", servedRes.reason)
        setServedOrders([])
      }

      // Склад
      if (inventoryRes.status === 'fulfilled') {
        setInventory(inventoryRes.value)
      } else {
        console.error("Ошибка загрузки склада:", inventoryRes.reason)
        setInventory([])
      }

    } catch (e) {
      console.error("Критическая ошибка loadData:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Проверка роли
    const role = getUserRole()
    if (role && role !== 'cook' && role !== 'admin') {
      alert('⚠️ Вы вошли не как повар! Текущая роль: ' + role + '. Пожалуйста, выйдите и войдите как повар.')
      router.push('/')
      return
    }

    loadData(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.cook.addMenu({
        ...newItem,
        price: Number(newItem.price),
        available_qty: Number(newItem.available_qty)
      })
      alert("Блюдо успешно добавлено!")
      setNewItem({ name: "", description: "", price: "", type: "lunch", available_qty: "" })
      loadData()
    } catch (err) {
      alert("Ошибка добавления")
    }
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.cook.sendRequest({
        item_name: requestItem.item_name,
        quantity: Number(requestItem.quantity)
      })
      alert("Заявка отправлена!")
      setRequestItem({ item_name: "", quantity: "" })
    } catch (err: any) {
      alert("Ошибка отправки заявки: " + (err.message || "Неизвестная ошибка"))
    }
  }

  // Управление складом
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.cook.addInventoryItem({
        ...newProduct,
        quantity: Number(newProduct.quantity),
        min_threshold: Number(newProduct.min_threshold) || 0
      })
      alert("Продукт добавлен на склад!")
      setNewProduct({ product_name: "", quantity: "", unit: "кг", min_threshold: "" })
      loadData()
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось добавить продукт"))
    }
  }

  const handleUpdateProduct = async (id: number) => {
    if (!editingProduct) return
    try {
      await api.cook.updateInventoryItem(id, {
        quantity: Number(editingProduct.quantity),
        min_threshold: Number(editingProduct.min_threshold)
      })
      alert("Продукт обновлён!")
      setEditingProduct(null)
      loadData()
    } catch (err) {
      alert("Ошибка обновления")
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Удалить этот продукт со склада?")) return
    try {
      await api.cook.deleteInventoryItem(id)
      alert("Продукт удалён")
      loadData()
    } catch (err) {
      alert("Ошибка удаления")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Загрузка панели...</div>

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-6xl relative">

      {/* МОДАЛЬНОЕ ОКНО УВЕДОМЛЕНИЙ */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-[380px] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-slate-50 rounded-t-xl">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell size={18} className={lowStockItems.length > 0 ? "text-red-500" : "text-slate-500"} />
                Уведомления
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNotifications(false)}>
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="py-6 max-h-[60vh] overflow-y-auto">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 py-4">
                  <div className="bg-green-100 p-3 rounded-full"><UtensilsCrossed size={24} className="text-green-600" /></div>
                  <p className="text-sm font-medium">Продуктов достаточно</p>
                  <p className="text-xs text-slate-400">Дефицита не обнаружено</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-bold text-yellow-800">Внимание, дефицит!</p>
                      <p className="text-xs text-yellow-700">Следующие блюда заканчиваются:</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {lowStockItems.map(item => (
                      <li key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                        <Badge variant="outline" className={`${item.available_qty === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {item.available_qty === 0 ? 'Закончилось' : `Ост: ${item.available_qty}`}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full text-xs h-8 mt-2" onClick={() => {
                    setShowNotifications(false);
                    document.querySelector('[data-value="requests"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                  }}>
                    Перейти к закупкам
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Шапка */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed /> Панель Повара
          </h1>
          <p className="text-slate-500 mt-1">Управление кухней и выдачей</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Кнопка уведомлений с индикатором */}
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full border-slate-300 hover:bg-slate-50"
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={20} className="text-slate-600" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </Button>

          <Button variant="outline" size="icon" className="rounded-full border-slate-300 hover:bg-slate-50" onClick={() => loadData(false)} title="Обновить данные">
            <UtensilsCrossed size={16} className="text-slate-600 rotate-90" />
          </Button>

          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Выйти
          </Button>
        </div>
      </div>

      <Tabs defaultValue="warehouse" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 mb-6">
          <TabsTrigger value="warehouse" onClick={() => loadData(false)}>Склад продуктов</TabsTrigger>
          <TabsTrigger value="inventory" onClick={() => loadData(false)}>Меню</TabsTrigger>
          <TabsTrigger value="served" onClick={() => loadData(false)}>История выдачи</TabsTrigger>
          <TabsTrigger value="requests">Закупка</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouse" className="space-y-6">
          <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PlusCircle size={20} /> Добавить продукт на склад</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="grid md:grid-cols-4 gap-4 items-end">
                <Input placeholder="Название продукта" value={newProduct.product_name} onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })} required className="bg-white" />
                <Input type="number" step="0.01" placeholder="Количество" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} required className="bg-white" />
                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3"
                  value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}>
                  <option value="кг">кг</option>
                  <option value="л">л</option>
                  <option value="шт">шт</option>
                  <option value="уп">уп</option>
                </select>
                <Input type="number" step="0.01" placeholder="Мин. остаток" value={newProduct.min_threshold} onChange={e => setNewProduct({ ...newProduct, min_threshold: e.target.value })} className="bg-white" />
                <Button type="submit" className="w-full md:col-span-4 bg-blue-600 text-white">Добавить на склад</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Остатки на складе</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Количество</TableHead>
                    <TableHead>Единица</TableHead>
                    <TableHead>Мин. остаток</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Склад пуст</TableCell></TableRow>
                  ) : (
                    inventory.map((product: any) => {
                      const isLowStock = product.quantity <= product.min_threshold
                      const isEditing = editingProduct?.id === product.id

                      return (
                        <TableRow key={product.id} className={isLowStock ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">{product.product_name}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input type="number" step="0.01" value={editingProduct.quantity} onChange={e => setEditingProduct({ ...editingProduct, quantity: e.target.value })} className="w-24" />
                            ) : (
                              <span className={isLowStock ? "text-red-600 font-bold" : ""}>{product.quantity}</span>
                            )}
                          </TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input type="number" step="0.01" value={editingProduct.min_threshold} onChange={e => setEditingProduct({ ...editingProduct, min_threshold: e.target.value })} className="w-24" />
                            ) : (
                              product.min_threshold
                            )}
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                <AlertTriangle size={12} className="mr-1" /> Мало
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">В наличии</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {isEditing ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateProduct(product.id)}>Сохранить</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingProduct(null)}>Отмена</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>Изменить</Button>
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteProduct(product.id)}>Удалить</Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PlusCircle size={20} /> Добавить блюдо</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="grid md:grid-cols-4 gap-4 items-end">
                <Input placeholder="Название" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required className="bg-white" />
                <Input type="number" placeholder="Цена" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required className="bg-white" />
                <Input type="number" placeholder="Порций" value={newItem.available_qty} onChange={e => setNewItem({ ...newItem, available_qty: e.target.value })} required className="bg-white" />
                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3"
                  value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                  <option value="lunch">Обед</option>
                  <option value="breakfast">Завтрак</option>
                </select>
                <Input placeholder="Описание" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="md:col-span-3 bg-white" />
                <Button type="submit" className="w-full bg-slate-800 text-white">Добавить</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menu.map(item => (
              <Card key={item.id} className={`${item.available_qty === 0 ? 'bg-red-50 border-red-200' : item.available_qty < 10 ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between"><CardTitle className="text-base">{item.name}</CardTitle><Badge>{item.price} ₽</Badge></div>
                </CardHeader>
                <CardFooter className="pt-2">
                  <div className="flex items-center gap-2">
                    {item.available_qty < 10 && <AlertTriangle size={16} className="text-orange-500" />}
                    <span className={`font-bold ${item.available_qty === 0 ? 'text-red-600' : ''}`}>Остаток: {item.available_qty} шт.</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="served">
          <Card>
            <CardHeader><CardTitle>Журнал выданных блюд</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID заказа</TableHead>
                    <TableHead>Блюдо</TableHead>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servedOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Пусто</TableCell></TableRow>
                  ) : (
                    servedOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell className="font-medium">{order.name || "Неизвестное блюдо"}</TableCell>
                        <TableCell>{order.username || "Ученик"}</TableCell>
                        <TableCell>{order.date ? new Date(order.date).toLocaleTimeString() : '—'}</TableCell>
                        <TableCell className="text-right"><Badge variant="secondary" className="bg-green-100 text-green-800">Выдано</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="max-w-xl mx-auto mt-8">
            <CardHeader><CardTitle>Заявка на продукты</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSendRequest} className="space-y-4">
                <Input placeholder="Продукт (Картофель)" value={requestItem.item_name} onChange={(e) => setRequestItem({ ...requestItem, item_name: e.target.value })} required />
                <Input type="number" placeholder="Количество" value={requestItem.quantity} onChange={(e) => setRequestItem({ ...requestItem, quantity: e.target.value })} required />
                <Button type="submit" className="w-full">Отправить</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
