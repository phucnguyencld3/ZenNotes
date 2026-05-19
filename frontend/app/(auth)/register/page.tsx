import type { Metadata } from "next"

import { RegisterForm } from "./RegisterForm"

export const metadata: Metadata = {
  title: "Đăng ký",
}

export default function RegisterPage() {
  return <RegisterForm />
}
