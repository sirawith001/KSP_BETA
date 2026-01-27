"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({
    wardname: "",
    warduser: "",
    wardpass: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!form.wardname || !form.warduser || !form.wardpass) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "สมัครสมาชิกสำเร็จ!");
        router.push("/");
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { key: "wardname", label: "ชื่อวอร์ด (wardname)", type: "text", placeholder: "กรอกชื่อวอร์ด" },
    { key: "warduser", label: "ชื่อผู้ใช้ (warduser)", type: "text", placeholder: "กรอกชื่อผู้ใช้" },
    { key: "wardpass", label: "รหัสผ่าน (wardpass)", type: "password", placeholder: "กรอกรหัสผ่าน" },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#1a0000] to-black py-20 px-4">

      <div className="relative z-10 w-full max-w-md">
        <div className="relative p-8 rounded-3xl backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-red-500/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-3xl"></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl shadow-lg mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                สมัครสมาชิก
              </h1>
              <p className="text-gray-400">สร้างบัญชีสำหรับเข้าใช้งานระบบ</p>
            </div>

            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {field.label}
                  </label>
                  <div className="relative group">
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [field.key]: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") submit();
                      }}
                      className="w-full px-4 py-3 bg-black/30 border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 group-hover:border-red-500/50"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={submit}
                disabled={isLoading}
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" fill="none"
                        />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      กำลังสร้างบัญชี...
                    </>
                  ) : (
                    "สร้างบัญชี"
                  )}
                </span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/" className="text-red-400 hover:text-red-300 font-semibold hover:underline">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          การสมัครหมายถึงคุณยอมรับ{" "}
          <Link href="/terms" className="text-red-400 hover:text-red-300 hover:underline">
            เงื่อนไขการใช้งาน
          </Link>
        </p>
      </div>
    </div>
  );
}
