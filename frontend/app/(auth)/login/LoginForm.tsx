"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { SparklesIcon, MailIcon, LockIcon, ArrowRightIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { login, saveAuthSession, getAccessToken } from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  
  React.useEffect(() => {
    const token = getAccessToken()
    if (token) {
      router.replace("/")
    }
  }, [router])

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email!")
      return
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu!")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login({ email, password })
      saveAuthSession(result)
      router.replace("/")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f7f9fb] dark:bg-neutral-950 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Visual Decoration (Asymmetric blur touch) matching mockup */}
      <div className="hidden lg:block absolute -z-10 top-1/4 left-10 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="hidden lg:block absolute -z-10 bottom-1/4 right-10 w-96 h-96 bg-teal-400/5 dark:bg-teal-400/10 rounded-full blur-3xl"></div>

      {/* TopAppBar matching mockup */}
      <header className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-neutral-900 transition-colors">
        <div className="flex justify-between items-center w-full px-6 max-w-[1200px] mx-auto h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#4648d4] flex items-center justify-center text-white shadow-md shadow-indigo-150">
              <SparklesIcon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-neutral-100 tracking-tight">
              ZenNotes
            </span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-8 items-center">
              <a className="text-slate-500 dark:text-neutral-400 hover:text-[#4648d4] dark:hover:text-indigo-400 transition-colors duration-200 text-xs font-semibold" href="#">
                Product
              </a>
              <a className="text-slate-500 dark:text-neutral-400 hover:text-[#4648d4] dark:hover:text-indigo-400 transition-colors duration-200 text-xs font-semibold" href="#">
                Resources
              </a>
              <a className="text-slate-500 dark:text-neutral-400 hover:text-[#4648d4] dark:hover:text-indigo-400 transition-colors duration-200 text-xs font-semibold" href="#">
                Pricing
              </a>
            </nav>
            <button className="text-[#4648d4] dark:text-indigo-400 text-xs font-bold border-b-2 border-[#4648d4] dark:border-indigo-400 active:scale-95 transition-transform pb-1 bg-transparent border-t-0 border-x-0 cursor-pointer">
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Login Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none border border-slate-100 dark:border-neutral-800/80 transition-colors">
            
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-[26px] font-bold text-slate-800 dark:text-neutral-100 tracking-tight mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-sm text-slate-400 dark:text-neutral-450">
                Tiếp tục hành trình sáng tạo của bạn
              </p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              
              {/* Email Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11.5 pl-10.5 pr-4 bg-slate-50 dark:bg-neutral-850/40 border border-slate-100 dark:border-neutral-800/50 rounded-xl focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all text-sm outline-hidden text-slate-800 dark:text-neutral-200 placeholder:text-slate-450 placeholder:text-slate-400"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11.5 pl-10.5 pr-4 bg-slate-50 dark:bg-neutral-850/40 border border-slate-100 dark:border-neutral-800/50 rounded-xl focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all text-sm outline-hidden text-slate-800 dark:text-neutral-200 placeholder:text-slate-450 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-red-50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 transition-all">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Button */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-150 border-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="h-4.5 w-4.5 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

            </form>

            {/* Action Links */}
            <div className="mt-8 space-y-4">
              <Link className="block text-xs font-semibold text-[#4648d4] dark:text-indigo-400 hover:opacity-85 transition-opacity" href="/forgot-password">
                Quên mật khẩu?
              </Link>
              <div className="pt-6 border-t border-slate-100 dark:border-neutral-800">
                <p className="text-sm text-slate-455 dark:text-neutral-450">
                  Chưa có tài khoản? 
                  <Link className="text-[#4648d4] dark:text-indigo-400 font-bold hover:underline ml-1 transition-all" href="/register">
                    Đăng ký
                  </Link>
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer matching mockup */}
      <footer className="bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 max-w-[1200px] mx-auto py-10 gap-6">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <div className="text-sm font-bold text-slate-800 dark:text-neutral-200">
              ZenNotes
            </div>
            <div className="text-xs text-slate-400 dark:text-neutral-500">
              © 2024 ZenNotes. Designed for focus.
            </div>
          </div>
          <nav className="flex gap-6">
            <a className="text-xs text-slate-400 hover:text-[#4648d4] dark:text-neutral-500 dark:hover:text-indigo-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="text-xs text-slate-400 hover:text-[#4648d4] dark:text-neutral-500 dark:hover:text-indigo-400 transition-colors" href="#">
              Terms of Service
            </a>
            <a className="text-xs text-slate-400 hover:text-[#4648d4] dark:text-neutral-500 dark:hover:text-indigo-400 transition-colors" href="#">
              Help Center
            </a>
          </nav>
        </div>
      </footer>

    </div>
  )
}
