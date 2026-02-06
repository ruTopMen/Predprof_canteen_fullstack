"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star, Wallet, Save, LogOut, QrCode, Bell, X, MessageCircle } from "lucide-react"

export default function StudentDashboard() {
  const router = useRouter()
  const [menu, setMenu] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [allergies, setAllergies] = useState("")
  const [lastOrderId, setLastOrderId] = useState<number | null>(null)
  const [reviews, setReviews] = useState<{ [key: number]: { rating: number; comment: string } }>({})

  // Состояние для отзывов блюда
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [dishReviews, setDishReviews] = useState<any[]>([])
  const [reviewsDishName, setReviewsDishName] = useState("")
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Состояние для уведомлений
  const [showNotifications, setShowNotifications] = useState(false)

  // 1. Загрузка данных
  useEffect(() => {
    async function loadData() {
      try {
        const [menuData, profileData] = await Promise.all([
          api.student.getMenu(),
          api.student.getProfile()
        ])
        setMenu(menuData)
        setBalance(profileData.balance)
        setAllergies(profileData.allergies || "")

        // Восстанавливаем активный заказ
        const savedOrderId = localStorage.getItem('active_order_id')
        if (savedOrderId) setLastOrderId(Number(savedOrderId))

      } catch (err) {
        console.error("Ошибка загрузки данных")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 2. Выход
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('active_order_id')
    router.push('/')
  }

  // 3. Пополнение
  const handleTopUp = async () => {
    const amountStr = prompt("Введите сумму пополнения (₽):", "500")
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Некорректная сумма");

    try {
      const res = await api.student.topUp(amount);
      setBalance(res.balance !== undefined ? res.balance : (balance + amount));
      alert("Баланс пополнен!");
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
  }

  // 4. Аллергии
  const saveAllergies = async () => {
    try {
      await api.student.updateProfile({ allergies });
      // alert("Аллергии сохранены!"); // Отключаем алерт, чтобы не доставать на onBlur
    } catch (err: any) {
      console.error(err);
      if (err.message) alert("Ошибка сохранения: " + err.message);
    }
  }

  const handleSaveClick = async () => {
    try {
      await api.student.updateProfile({ allergies });
      alert("Аллергии успешно сохранены!");
    } catch (err: any) {
      alert("Ошибка сохранения: " + err.message);
    }
  }

  // 5. Оплата
  const handlePurchase = async (itemId: number, type: "single" | "subscription") => {
    const item = menu.find(i => i.id === itemId);
    if (!item) return;

    if (lastOrderId) return alert("Сначала получите текущий заказ!");
    if (balance < item.price) return alert("Недостаточно средств!");

    setBalance(prev => prev - item.price)

    try {
      const response = await api.student.buy(itemId, type)
      let realOrderId = response.orderId || response.id || response.order_id;

      if (!realOrderId) {
        realOrderId = Math.floor(Math.random() * 9000) + 1000;
      }

      setLastOrderId(realOrderId)
      localStorage.setItem('active_order_id', String(realOrderId))
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (err: any) {
      setBalance(prev => prev + item.price)
      alert("Ошибка оплаты: " + err.message)
    }
  }

  // 6. Получение
  const handleRedeem = async () => {
    if (!lastOrderId) return
    try {
      await api.student.redeem(lastOrderId)
      alert("Получение подтверждено! Приятного аппетита.")
      setLastOrderId(null)
      localStorage.removeItem('active_order_id')
    } catch (err: any) {
      console.error("Ошибка получения:", err)
      const errorMessage = err.message || "Неизвестная ошибка";

      if (errorMessage.includes("Order not found") || errorMessage.includes("not found")) {
        alert("Этот заказ больше не существует (возможно, база была очищена). Он будет удален с экрана.");
        setLastOrderId(null);
        localStorage.removeItem('active_order_id');
      } else {
        alert("Ошибка подтверждения получения: " + errorMessage);
      }
    }
  }

  // 7. Отзывы
  const submitReview = async (itemId: number) => {
    const review = reviews[itemId]
    if (!review || !review.rating) return alert("Поставьте оценку!")
    try {
      await api.student.sendReview({ menu_item_id: itemId, ...review })
      alert("Спасибо за отзыв!")
      setReviews(prev => { const n = { ...prev }; delete n[itemId]; return n; })
    } catch (err) { alert("Ошибка отправки отзыва") }
  }

  // 8. Просмотр отзывов по блюду
  const viewDishReviews = async (itemId: number, dishName: string) => {
    setLoadingReviews(true)
    setReviewsDishName(dishName)
    setShowReviewsModal(true)
    try {
      const data = await api.student.getReviews(itemId)
      setDishReviews(data)
    } catch (err) {
      console.error("Ошибка загрузки отзывов", err)
      setDishReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }


  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-6xl relative">

      {/* МОДАЛЬНОЕ ОКНО УВЕДОМЛЕНИЙ (ЗАГЛУШКА) */}
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
                <p className="text-xs text-slate-400 text-center px-4">Здесь будут сообщения о готовности заказа или изменениях в меню</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary" onClick={() => setShowNotifications(false)}>Понятно</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ОТЗЫВОВ ПО БЛЮДУ */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-[420px] max-h-[80vh] shadow-2xl scale-100 animate-in zoom-in-95 duration-200 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle size={20} className="text-blue-500" />
                Отзывы: {reviewsDishName}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowReviewsModal(false)}>
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="py-4 overflow-y-auto flex-grow">
              {loadingReviews ? (
                <div className="flex items-center justify-center py-8 text-slate-400">Загрузка...</div>
              ) : dishReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 py-8">
                  <div className="bg-slate-100 p-4 rounded-full">
                    <MessageCircle size={32} className="text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Отзывов пока нет</p>
                  <p className="text-xs text-slate-400 text-center px-4">Будьте первым, кто оставит отзыв!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dishReviews.map((review: any) => (
                    <div key={review.id} className="bg-slate-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">{review.username}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={review.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600">{review.comment}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(review.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button className="w-full" variant="secondary" onClick={() => setShowReviewsModal(false)}>Закрыть</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Шапка */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="w-full md:w-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Личный кабинет</h1>
            <p className="text-slate-500 mt-1">Школьное питание</p>
          </div>
          {/* Кнопки для мобильной версии */}
          <div className="flex gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setShowNotifications(true)}>
              <Bell size={24} className="text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={handleLogout}>
              <LogOut size={24} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto items-center">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-4 min-w-[200px]">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Баланс</p>
              <p className="text-2xl font-black text-green-700">{balance} ₽</p>
            </div>
            <Button size="icon" variant="outline" className="bg-white text-green-600" onClick={handleTopUp}><Wallet size={20} /></Button>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Мои Аллергии</p>
              {/* Info Icon with tooltip could go here */}
            </div>

            {/* Allergy List */}
            <div className="flex flex-wrap gap-2 mb-1">
              {allergies.split(',').filter(x => x.trim().length > 0).map((allergy, idx) => (
                <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                  {allergy.trim()}
                  <Button
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-red-200 rounded-full"
                    onClick={() => {
                      const newList = allergies.split(',').filter(x => x.trim() !== allergy.trim()).join(', ');
                      setAllergies(newList);
                      // Auto-save on delete
                      api.student.updateProfile({ allergies: newList })
                        .then(() => console.log("Removed allergy"))
                        .catch(err => alert("Ошибка удаления: " + err.message));
                    }}
                  >
                    <X size={10} />
                  </Button>
                </Badge>
              ))}
              {allergies.trim().length === 0 && <span className="text-xs text-slate-400 italic">Нет аллергий</span>}
            </div>

            {/* Add New Allergy Input */}
            <div className="flex gap-2">
              <Input
                id="allergy-input"
                className="h-8 text-xs md:w-48"
                placeholder="Добавить (напр. Орехи)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (!val) return;
                    if (allergies.toLowerCase().includes(val.toLowerCase())) {
                      alert("Такая аллергия уже есть!");
                      return;
                    }
                    const newList = allergies ? `${allergies}, ${val}` : val;
                    setAllergies(newList);
                    e.currentTarget.value = '';

                    // Auto-save
                    api.student.updateProfile({ allergies: newList })
                      .then(() => alert(`Аллергия "${val}" добавлена и сохранена!`))
                      .catch(err => alert("Ошибка сохранения: " + err.message));
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const input = document.getElementById('allergy-input') as HTMLInputElement;
                  const val = input.value.trim();
                  if (!val) return alert("Введите название аллергии!");
                  if (allergies.toLowerCase().includes(val.toLowerCase())) {
                    return alert("Такая аллергия уже есть!");
                  }

                  const newList = allergies ? `${allergies}, ${val}` : val;
                  setAllergies(newList);
                  input.value = '';

                  api.student.updateProfile({ allergies: newList })
                    .then(() => alert(`Аллергия "${val}" добавлена и сохранена!`))
                    .catch(err => alert("Ошибка сохранения: " + err.message));
                }}
              >
                Добавить
              </Button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Кнопка уведомлений (Десктоп) */}
            <Button variant="outline" size="icon" className="rounded-full border-slate-300 hover:bg-slate-50" onClick={() => setShowNotifications(true)}>
              <Bell size={20} className="text-slate-600" />
            </Button>

            <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50" onClick={handleLogout}>
              <LogOut size={16} /> Выйти
            </Button>
          </div>
        </div>
      </div>

      {lastOrderId && (
        <Card className="border-2 border-orange-400 bg-orange-50 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-400/20 border-r border-dashed border-orange-300 hidden md:block"></div>
          <CardContent className="flex flex-col md:flex-row justify-between items-center py-8 px-8 gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-white p-2 rounded-lg border-2 border-slate-800"><QrCode size={80} /></div>
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Электронный талон</p>
                <p className="text-3xl font-black text-slate-800">ЗАКАЗ #{lastOrderId}</p>
                <p className="text-slate-600">Покажите повару</p>
              </div>
            </div>
            <Button onClick={handleRedeem} size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8">Подтвердить получение</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lunch" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6">
          <TabsTrigger value="breakfast" className="w-32">Завтраки</TabsTrigger>
          <TabsTrigger value="lunch" className="w-32">Обеды</TabsTrigger>
        </TabsList>

        {["breakfast", "lunch"].map((mealType) => (
          <TabsContent key={mealType} value={mealType} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menu.filter(item => item.type === mealType).length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-400">Меню пусто</div>
            ) : (
              menu.filter(item => item.type === mealType).map((item) => {
                // Проверка аллергии
                const userAllergies = allergies.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
                const dishText = (item.name + " " + (item.description || "") + " " + (item.allergens || "")).toLowerCase();
                const hasAllergy = userAllergies.some(allergy => dishText.includes(allergy));

                return (
                  <Card key={item.id} className={`flex flex-col hover:shadow-md transition-shadow ${hasAllergy ? "border-red-400 bg-red-50" : ""}`}>
                    <CardHeader className={`${hasAllergy ? "bg-red-100/50" : "bg-slate-50/50"} pb-2`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {hasAllergy && <Badge variant="destructive" className="mt-1 text-[10px uppercase">⚠️ Аллерген</Badge>}
                        </div>
                        <Badge variant="secondary" className="text-base">{item.price} ₽</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow pt-4 space-y-4">
                      <p className="text-sm text-slate-600 line-clamp-2">{item.description || "Без описания"}</p>
                      {item.allergens && <p className="text-xs text-orange-600 font-medium">Содержит: {item.allergens}</p>}

                      <div className={`bg-slate-50 p-3 rounded-lg border space-y-2 ${hasAllergy ? "bg-white" : ""}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Оценить</p>
                        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={18} className={`cursor-pointer ${(reviews[item.id]?.rating || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} onClick={() => setReviews({ ...reviews, [item.id]: { ...reviews[item.id], rating: star } })} />
                        ))}</div>
                        <Textarea placeholder="Комментарий..." className="text-xs h-[50px] resize-none" onChange={(e) => setReviews({ ...reviews, [item.id]: { ...reviews[item.id], comment: e.target.value } })} />
                        <Button variant="ghost" size="sm" className="w-full h-6 text-xs" onClick={() => submitReview(item.id)}>Отправить</Button>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => handlePurchase(item.id, "single")} disabled={item.available_qty <= 0}>Купить</Button>
                        <Button onClick={() => handlePurchase(item.id, "subscription")} disabled={item.available_qty <= 0} className="bg-blue-600 text-white">Абонемент</Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-blue-600 hover:text-blue-800 gap-1"
                        onClick={() => viewDishReviews(item.id, item.name)}
                      >
                        <MessageCircle size={14} /> Посмотреть отзывы
                      </Button>
                      {item.available_qty <= 5 && <p className="text-center text-[10px] text-red-500 font-bold">Осталось: {item.available_qty}</p>}
                    </CardFooter>
                  </Card>
                )
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
