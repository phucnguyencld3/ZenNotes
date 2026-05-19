"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { 
  SparklesIcon, 
  MailIcon, 
  LockIcon, 
  ArrowLeftIcon, 
  SendIcon, 
  Loader2Icon, 
  CheckCircle2Icon, 
  ShieldCheckIcon,
  AlertCircleIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { verifyEmail, resetPassword, getAccessToken } from "@/lib/auth"

type Step = "verify" | "reset" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()

  React.useEffect(() => {
    const token = getAccessToken()
    if (token) {
      router.push("/")
    }
  }, [router])

  const [step, setStep] = React.useState<Step>("verify")
  const [email, setEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Step 1: Handle Email verification
  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email!")
      return
    }

    setIsSubmitting(true)

    try {
      await verifyEmail(email)
      setStep("reset")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xác minh email thất bại"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Handle Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới!")
      return
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp!")
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword(email, newPassword)
      setStep("success")
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f7f9fb] dark:bg-neutral-950 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Background asymmetric blur touch matching mockup */}
      <div className="hidden lg:block absolute -z-10 top-1/4 left-10 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="hidden lg:block absolute -z-10 bottom-1/4 right-10 w-96 h-96 bg-teal-400/5 dark:bg-teal-400/10 rounded-full blur-3xl"></div>

      {/* TopAppBar */}
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
              <Link className="text-slate-500 dark:text-neutral-400 hover:text-[#4648d4] dark:hover:text-indigo-400 transition-colors duration-200 text-xs font-semibold" href="/">
                Trang chủ
              </Link>
              <a className="text-slate-500 dark:text-neutral-400 hover:text-[#4648d4] dark:hover:text-indigo-400 transition-colors duration-200 text-xs font-semibold" href="#">
                Tính năng
              </a>
            </nav>
            <Link className="text-[#4648d4] dark:text-indigo-400 text-xs font-bold border-b-2 border-[#4648d4] dark:border-indigo-400 pb-1 cursor-pointer" href="/login">
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Card Layout */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none border border-slate-100 dark:border-neutral-800/80 transition-colors text-center">
            
            {step === "verify" && (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-[#4648d4] dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <MailIcon className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl md:text-[26px] font-bold text-slate-800 dark:text-neutral-100 tracking-tight mb-2">
                    Quên mật khẩu?
                  </h1>
                  <p className="text-sm text-slate-400 dark:text-neutral-450 px-2">
                    Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleVerifyEmail}>
                  
                  {/* Email Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500" htmlFor="email">
                      Địa chỉ Email
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
                        className="w-full h-11.5 pl-10.5 pr-4 bg-slate-50 dark:bg-neutral-850/40 border border-slate-100 dark:border-neutral-800/50 rounded-xl focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all text-sm outline-hidden text-slate-800 dark:text-neutral-200 placeholder:text-slate-400"
                        placeholder="example@zennotes.com"
                      />
                    </div>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-red-50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 transition-all">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-150 border-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="h-4.5 w-4.5 animate-spin" />
                          Đang xác minh...
                        </>
                      ) : (
                        <>
                          Tiếp tục
                          <SendIcon className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800 flex justify-center">
                  <Link className="flex items-center gap-2 text-xs font-bold text-[#4648d4] dark:text-indigo-400 hover:underline underline-offset-4 transition-all" href="/login">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </>
            )}

            {step === "reset" && (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-[#4648d4] dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
                    <ShieldCheckIcon className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl md:text-[26px] font-bold text-slate-800 dark:text-neutral-100 tracking-tight mb-2">
                    Đặt lại mật khẩu mới
                  </h1>
                  <p className="text-sm text-slate-400 dark:text-neutral-450 px-2">
                    Nhập mật khẩu mới cho tài khoản: <strong className="text-slate-650 dark:text-neutral-200 font-semibold">{email}</strong>
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleResetPassword}>
                  
                  {/* New Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500" htmlFor="newPassword">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        disabled={isSubmitting}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11.5 pl-10.5 pr-4 bg-slate-50 dark:bg-neutral-850/40 border border-slate-100 dark:border-neutral-800/50 rounded-xl focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all text-sm outline-hidden text-slate-800 dark:text-neutral-200 placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500" htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        disabled={isSubmitting}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11.5 pl-10.5 pr-4 bg-slate-50 dark:bg-neutral-850/40 border border-slate-100 dark:border-neutral-800/50 rounded-xl focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all text-sm outline-hidden text-slate-800 dark:text-neutral-200 placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Password requirement hint */}
                  <div className="p-4 bg-slate-50 dark:bg-neutral-850/20 border-l-4 border-[#4648d4] dark:border-indigo-500 rounded-r-xl text-left">
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Mật khẩu phải chứa ít nhất 6 ký tự để đảm bảo độ bảo mật tốt nhất cho tài khoản của bạn.
                    </p>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-red-50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 transition-all">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-150 border-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="h-4.5 w-4.5 animate-spin" />
                          Đang đặt lại...
                        </>
                      ) : (
                        "Cập nhật mật khẩu"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800 flex justify-center">
                  <button 
                    onClick={() => {
                      setError(null)
                      setStep("verify")
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-all bg-transparent border-none cursor-pointer"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Hủy và quay lại
                  </button>
                </div>
              </>
            )}

            {step === "success" && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-md shadow-green-100 dark:shadow-none animate-in zoom-in-50 duration-500">
                  <CheckCircle2Icon className="h-10 w-10 animate-pulse" />
                </div>
                
                <h1 className="text-2xl md:text-[26px] font-bold text-slate-800 dark:text-neutral-100 tracking-tight mb-3">
                  Thành công!
                </h1>
                
                <p className="text-sm text-slate-500 dark:text-neutral-400 px-4 mb-8 leading-relaxed">
                  Mật khẩu của bạn đã được đặt lại thành công. Bạn đang được tự động chuyển hướng về trang đăng nhập...
                </p>

                <Button 
                  onClick={() => router.push("/login")}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-green-100 dark:shadow-none border-none cursor-pointer"
                >
                  Đăng nhập ngay
                </Button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 transition-colors mt-auto">
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
