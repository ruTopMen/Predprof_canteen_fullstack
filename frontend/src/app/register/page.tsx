"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Схема регистрации согласно ТЗ (логин, пароль, роль, аллергии)
const registerSchema = z.object({
  username: z.string().min(2, "Минимум 2 символа"),
  password: z.string().min(3, "Пароль слишком короткий"),
  role: z.enum(["student", "cook", "admin"]),
  allergies: z.string().optional(),
})

export default function RegisterPage() {
  const router = useRouter()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", role: "student", allergies: "" },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      // Отправляем запрос на /auth/register
      await api.auth.register(values)
      alert("Регистрация успешна! Теперь можно войти.")
      router.push("/") // Возвращаемся на логин
    } catch (error: any) {
      alert("Ошибка: " + error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Регистрация в системе</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Логин</FormLabel><FormControl><Input placeholder="ivan_777" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Пароль</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Роль</FormLabel><FormControl>
                  <select {...field} className="w-full p-2 border rounded">
                    <option value="student">Ученик</option>
                    <option value="cook">Повар</option>
                    <option value="admin">Админ</option>
                  </select>
                </FormControl></FormItem>
              )} />
              <Button type="submit" className="w-full">Зарегистрироваться</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
