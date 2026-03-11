"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if the current user's email is in the admin list
      if (user && process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").includes(user.email)) {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  return (
    <div>
      <header className="flex justify-between items-center py-6 px-8 bg-gray-900 text-white shadow-md">
        {/* 只有在不是首页的页面才显示返回首页按钮 */}
        {pathname !== '/' && (
          <Link href="/" className="btn-return-home">
            返回首页
          </Link>
        )}
      </header>

      {/* 管理员入口放回账户中心页面 */}
      {!loading && isAdmin && pathname === "/account" && (
        <div className="admin-entry-container text-center mt-6">
          <Link href="/admin" className="btn-admin-entry">
            管理员入口
          </Link>
        </div>
      )}

      {/* 页面内容 */}
      <main>{children}</main>
    </div>
  );
}