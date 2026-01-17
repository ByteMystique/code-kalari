"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Github, Upload, Home } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: Upload },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-brand-start transition-colors">
            Sign<span className="text-brand-start">Tube</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                    isActive
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-gradient-to-r from-brand-start/20 to-brand-end/20 rounded-full border border-brand-start/30 pointer-events-none"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <a
            href="https://github.com/Start-Hawk/code-kalari"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all border border-white/10 hover:border-white/30"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
