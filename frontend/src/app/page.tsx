"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/services/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

// 1. Описываем правила валидации (Схема)
// Напарник ждет 'username', поэтому используем его вместо email
const loginSchema = z.object({
  username: z.string().min(2, "Логин должен быть не короче 2 символов"),
  password: z.string().min(3, "Пароль слишком короткий"),
})

export default function LoginPage() {
  const router = useRouter()

  // 2. Инициализируем форму с дефолтными значениями
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  // 3. Функция отправки данных на бэкенд напарника (порт 5000)
  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      // Вызываем метод логина, который мы прописали в api.ts
      const user = await api.auth.login(values)
      
      console.log("Успешный вход! Токен сохранен.")

      // 4. Перенаправляем пользователя в зависимости от роли из БД
      if (user.role === 'admin') {
        router.push("/admin")
      } else if (user.role === 'cook') {
        router.push("/cook")
      } else {
        router.push("/student")
      }
      
    } catch (error: any) {
      // Выводим "Invalid credentials" или другую ошибку от бэка
      alert("Ошибка входа: " + error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-[380px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Школьная столовая</CardTitle>
          <CardDescription className="text-center">
            Введите логин и пароль для доступа
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Поле Логин */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Логин</FormLabel>
                    <FormControl>
                      <Input placeholder="Напр: student_123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Поле Пароль */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2">
                Войти в кабинет
              </Button>
            </form>
          </Form>
        </CardContent>

        {/* Секция регистрации по твоему запросу */}
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground italic">
                Новичок?
              </span>
            </div>
          </div>
          
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full">
              Зарегистрироваться
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
