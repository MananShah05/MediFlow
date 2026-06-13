"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DM_Serif_Display, Inter } from "next/font/google";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Heart, Activity, Check, Users, Sparkles, Loader2, ArrowRight, Lock, Play, X, Volume2, VolumeX, Twitter, Facebook, Instagram, Linkedin, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

export default function RootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = useAuthStore((s) => s.login);
  const registerPatient = useAuthStore((s) => s.registerPatient);

  const redirectParam = searchParams.get("redirect");
  const registerParam = searchParams.get("register");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Opener State
  const [showOpener, setShowOpener] = useState(true);
  const [openerMuted, setOpenerMuted] = useState(true);
  const openerVideoRef = useRef<HTMLVideoElement | null>(null);

  // Skip video opener if already played in this tab session
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("mediflow_opener_seen");
    if (hasSeen === "true") {
      setShowOpener(false);
    }
  }, []);

  const handleDismissOpener = () => {
    setShowOpener(false);
    sessionStorage.setItem("mediflow_opener_seen", "true");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      const rootStyles = getComputedStyle(document.documentElement);

      const resolveColor = (variables: string[], alpha = 1) => {
        const tempEl = document.createElement("div");
        tempEl.style.position = "absolute";
        tempEl.style.visibility = "hidden";
        tempEl.style.width = "1px";
        tempEl.style.height = "1px";
        document.body.appendChild(tempEl);

        let color = `rgba(255, 255, 255, ${alpha})`;

        for (const variable of variables) {
          const value = rootStyles.getPropertyValue(variable).trim();
          if (value) {
            tempEl.style.backgroundColor = `var(${variable})`;
            const computedColor = getComputedStyle(tempEl).backgroundColor;

            if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
              if (alpha < 1) {
                const rgbMatch = computedColor.match(
                  /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
                );
                if (rgbMatch) {
                  color = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
                } else {
                  color = computedColor;
                }
              } else {
                color = computedColor;
              }
              break;
            }
          }
        }

        document.body.removeChild(tempEl);
        return color;
      };

      return {
        backgroundTop: resolveColor(["--color-bg-base", "--background"], 1),
        backgroundBottom: resolveColor(["--color-bg-surface", "--muted", "--background"], 0.95),
        wavePalette: [
          {
            offset: 0,
            amplitude: 70,
            frequency: 0.003,
            color: resolveColor(["--color-primary-500", "--primary"], 0.8),
            opacity: 0.45,
          },
          {
            offset: Math.PI / 2,
            amplitude: 90,
            frequency: 0.0026,
            color: resolveColor(["--color-role-admin", "--accent", "--primary"], 0.7),
            opacity: 0.35,
          },
          {
            offset: Math.PI,
            amplitude: 60,
            frequency: 0.0034,
            color: resolveColor(["--color-bg-subtle", "--secondary", "--foreground"], 0.65),
            opacity: 0.3,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 80,
            frequency: 0.0022,
            color: resolveColor(["--color-text-inverse", "--primary-foreground", "--foreground"], 0.25),
            opacity: 0.25,
          },
          {
            offset: Math.PI * 2,
            amplitude: 55,
            frequency: 0.004,
            color: resolveColor(["--color-text-primary", "--foreground"], 0.2),
            opacity: 0.2,
          },
        ],
      };
    };

    let themeColors = computeThemeColors();

    const handleThemeMutation = () => {
      themeColors = computeThemeColors();
    };

    const observer = new MutationObserver(handleThemeMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: any) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
            wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
            (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  const [portal, setPortal] = useState<"patient" | "staff">("patient");
  const [staffRole, setStaffRole] = useState<"doctor" | "nurse" | "admin">("doctor");
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (registerParam === "true") {
      setPortal("patient");
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [registerParam]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState<"male" | "female" | "other" | "prefer_not_to_say">("male");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    setAuthError(null);

    try {
      await login(loginEmail, loginPassword);
      const user = useAuthStore.getState().user;
      if (user) {
        if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
          router.replace(redirectParam);
          return;
        }

        const role = user.role;
        if (role === "patient") router.replace("/p/dashboard");
        else if (role === "doctor") router.replace("/d/dashboard");
        else if (role === "nurse") router.replace("/n/dashboard");
        else if (role === "admin") router.replace("/a/dashboard");
        else if (role === "super_admin") router.replace("/sa/dashboard");
        else router.replace("/login");
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regDob || !regEmail || !regPassword || !regConfirmPassword) {
      setAuthError("All required fields must be filled.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      await registerPatient({
        fullName: regName,
        dateOfBirth: regDob,
        gender: regGender,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        tenantSlug: "cityhospital",
      });

      if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
        router.replace(redirectParam);
        return;
      }

      router.replace("/p/dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Failed to create patient account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-[#0A0A0A] relative overflow-hidden flex flex-col",
        sans.variable,
        serif.variable
      )}
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* === CINEMATIC VIDEO OPENER === */}
      <AnimatePresence>
        {showOpener && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: "blur(8px)",
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-50 bg-[#0A0B10] flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none"
          >
            {/* Background Video */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <video
                ref={openerVideoRef}
                src="/hero-video.mp4"
                autoPlay
                muted={openerMuted}
                playsInline
                onEnded={handleDismissOpener}
                className="w-full h-full object-cover opacity-60"
              />
              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10] via-transparent to-[#0A0B10]/80 z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#0A0B10_90%)] z-10 pointer-events-none" />
            </div>

            {/* Opener Header */}
            <div className="relative z-20 flex justify-between items-center w-full">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7DD3C0] to-[#4A90D9] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#7DD3C0]/20">
                  M
                </div>
                <span
                  className="font-semibold text-lg tracking-tight text-white/90"
                  style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                >
                  MediFLOW
                </span>
              </div>

              {/* Skip Button */}
              <button
                onClick={handleDismissOpener}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <span>Skip Intro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Center Cinematic Content */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Launch Label */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7DD3C0]/20 to-[#4A90D9]/20 border border-[#7DD3C0]/20 text-[#7DD3C0] text-[10px] uppercase font-bold tracking-widest">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>Launch Presentation</span>
                </div>

                {/* Main Heading */}
                <h1
                  className="text-4xl sm:text-6xl text-white tracking-tight leading-tight mt-2 font-medium"
                  style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                >
                  The Operating System for{" "}
                  <span className="bg-gradient-to-r from-[#7DD3C0] via-[#8AB4F8] to-[#4A90D9] bg-clip-text text-transparent font-medium">
                    Modern Healthcare
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
                  Witness the next-generation clinical management suite. Unifying EHR, real-time vitals, and billing ledger in one beautiful workspace.
                </p>

                {/* Enter CTA */}
                <button
                  onClick={handleDismissOpener}
                  className="mt-8 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#7DD3C0] to-[#4A90D9] text-[#0A0B10] font-bold text-sm hover:shadow-[0_0_30px_rgba(125,211,192,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Enter Portal
                </button>
              </motion.div>
            </div>

            {/* Opener Footer */}
            <div className="relative z-20 flex justify-between items-center w-full">
              {/* Sound Controls */}
              <button
                onClick={() => setOpenerMuted(!openerMuted)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 text-white/80 hover:text-white text-xs font-medium backdrop-blur-md transition-all duration-200"
              >
                {openerMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-[#7DD3C0]" />
                    <span>Unmute Cinematic Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#4A90D9] animate-bounce" />
                    <span>Mute Audio</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase hidden sm:block">
                MediFLOW 2.0 • Press Enter to Skip
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === HERO SECTION === */}
      <div className="relative bg-slate-50 dark:bg-[#0F1117] text-slate-900 dark:text-white overflow-hidden min-h-screen flex flex-col justify-between">
        {/* Glowing waves canvas background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Diffuse glow overlays for blending */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#4A90D9]/10 blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#7DD3C0]/5 blur-[120px]" />
        </div>

        {/* Header */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7DD3C0] to-[#4A90D9] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#7DD3C0]/20">
              M
            </div>
            <span
              className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white/90"
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              MediFLOW
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
              Platform
            </a>
            <a href="#compliance" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
              Security
            </a>
            <a href="#statistics" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
              Impact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => {
                setPortal("patient");
                setActiveTab("login");
                const el = document.getElementById("auth-card");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setPortal("patient");
                setActiveTab("register");
                const el = document.getElementById("auth-card");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-shrink-0 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-[#0F1117] dark:hover:bg-white/90 px-5 py-2 rounded-full transition-all duration-200 shadow-md dark:shadow-lg dark:shadow-white/10"
            >
              Get Started
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex-1 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            {/* Left: branding and values */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 text-left flex flex-col items-start"
            >
              {/* Badge */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/80 dark:bg-transparent border border-teal-200 dark:border-[#7DD3C0]/20 text-teal-800 dark:text-[#7DD3C0] mb-6 bg-none dark:bg-gradient-to-r dark:from-[#7DD3C0]/20 dark:to-[#4A90D9]/20 text-xs font-medium"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>MediFLOW 2.0 — Intelligent Care Platform</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.1] tracking-tight font-medium"
                style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
              >
                The operating system
                <br />
                for{" "}
                <span className="bg-gradient-to-r from-teal-700 via-blue-600 to-indigo-600 dark:from-[#7DD3C0] dark:via-[#8AB4F8] dark:to-[#4A90D9] bg-clip-text text-transparent font-medium">
                  modern healthcare
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-light"
              >
                A multi-tenant clinical management suite designed for the pace of modern hospitals.
                Unify EHR, vitals, billing, and compliance on one elegant ledger.
              </motion.p>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    const el = document.getElementById("features");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-10 px-6 rounded-full border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:hover:border-white/25 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5 font-medium text-xs transition-all duration-200 flex items-center gap-2"
                >
                  Explore Capabilities
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setShowOpener(true);
                    setOpenerMuted(false);
                  }}
                  className="h-10 px-6 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-[#0F1117] dark:hover:bg-white/90 font-medium text-xs transition-all duration-200 flex items-center gap-2 shadow-md dark:shadow-lg dark:shadow-white/10"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Launch Video
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={statsVariants}
                className="mt-12 grid grid-cols-3 gap-6 w-full max-w-md border-t border-slate-200 dark:border-white/[0.06] pt-8"
              >
                {[
                  { value: "99.99%", label: "Uptime SLA" },
                  { value: "12k+", label: "Clinicians" },
                  { value: "10M+", label: "Encounters" },
                ].map((stat) => (
                  <motion.div key={stat.label} variants={itemVariants}>
                    <p
                      className="text-2xl sm:text-3xl text-slate-900 dark:text-white/90 tracking-tight font-medium"
                      style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Auth Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5 w-full flex justify-center lg:justify-end"
            >
              <div id="auth-card" className="w-full max-w-md relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7DD3C0]/10 via-transparent to-[#4A90D9]/10 rounded-3xl blur-3xl pointer-events-none" />
                <div className="relative bg-surface border border-[#E5E7EB] dark:border-border rounded-2xl p-6 sm:p-8 shadow-2xl dark:shadow-none flex flex-col gap-5 text-slate-900 dark:text-white">
                  {/* Portal selector */}
                  <div className="flex bg-[#F9FAFB] dark:bg-bg-base p-1 rounded-xl border border-[#E5E7EB] dark:border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setPortal("patient");
                        setActiveTab("login");
                        setAuthError(null);
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                        portal === "patient"
                          ? "bg-surface text-[#0F1117] dark:text-white shadow-sm border border-[#E5E7EB] dark:border-border"
                          : "text-[#6B7280] hover:text-[#0F1117] dark:text-[#94A8C7] dark:hover:text-white"
                      )}
                    >
                      Patient Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPortal("staff");
                        setActiveTab("login");
                        setAuthError(null);
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                        portal === "staff"
                          ? "bg-surface text-[#0F1117] dark:text-white shadow-sm border border-[#E5E7EB] dark:border-border"
                          : "text-[#6B7280] hover:text-[#0F1117] dark:text-[#94A8C7] dark:hover:text-white"
                      )}
                    >
                      Staff Portal
                    </button>
                  </div>

                  {/* Sub tabs */}
                  {portal === "patient" ? (
                    <div className="flex bg-[#F9FAFB] dark:bg-bg-base p-[3px] rounded-lg border border-[#E5E7EB] dark:border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("login");
                          setAuthError(null);
                        }}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                          activeTab === "login"
                            ? "bg-surface text-[#0F1117] dark:text-white shadow-sm"
                            : "text-[#6B7280] hover:text-[#0F1117] dark:text-[#94A8C7] dark:hover:text-white"
                        )}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("register");
                          setAuthError(null);
                        }}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                          activeTab === "register"
                            ? "bg-surface text-[#0F1117] dark:text-white shadow-sm"
                            : "text-[#6B7280] hover:text-[#0F1117] dark:text-[#94A8C7] dark:hover:text-white"
                        )}
                      >
                        Create Account
                      </button>
                    </div>
                  ) : (
                    <div className="flex bg-[#F9FAFB] dark:bg-bg-base p-[3px] rounded-lg border border-[#E5E7EB] dark:border-border">
                      {(["doctor", "nurse", "admin"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setStaffRole(role);
                            setAuthError(null);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 capitalize",
                            staffRole === role
                              ? "bg-surface text-[#0F1117] dark:text-white shadow-sm"
                              : "text-[#6B7280] hover:text-[#0F1117] dark:text-[#94A8C7] dark:hover:text-white"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}

                  {authError && (
                    <div className="bg-danger-bg border border-danger-border text-danger-text text-xs rounded-lg p-3 flex items-start gap-2" role="alert">
                      <span className="font-bold mt-0.5">⚠️</span>
                      <span>{authError}</span>
                    </div>
                  )}

                  {portal === "patient" && activeTab === "login" && (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-0.5 text-left">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Patient Sign In</h2>
                        <p className="text-xs text-slate-500 dark:text-[#94A8C7]">View your vitals, appointments, and bills</p>
                      </div>

                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="patient@mediflow.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loading}
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full mt-1 bg-clinical text-text-inverse hover:bg-clinical-hover rounded-lg font-semibold h-10"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing In...
                          </span>
                        ) : (
                          "Sign In to Patient Portal"
                        )}
                      </Button>
                    </form>
                  )}

                  {portal === "patient" && activeTab === "register" && (
                    <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                      <div className="flex flex-col gap-0.5 text-left">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">New Patient Registration</h2>
                        <p className="text-xs text-slate-500 dark:text-[#94A8C7]">Create a quick patient profile for City Hospital</p>
                      </div>

                      <Input
                        label="Full Name *"
                        placeholder="Steve Rogers"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        disabled={loading}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Date of Birth *"
                          type="date"
                          value={regDob}
                          onChange={(e) => setRegDob(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <div className="flex flex-col gap-[6px]">
                          <label className="text-xs font-semibold text-text-secondary">Gender *</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-clinical focus:ring-2 focus:ring-clinical/20 disabled:cursor-not-allowed appearance-none"
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value as any)}
                            disabled={loading}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      <Input
                        label="Email Address *"
                        type="email"
                        placeholder="patient@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        disabled={loading}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Password *"
                          type="password"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <Input
                          label="Confirm Password *"
                          type="password"
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full mt-1 bg-clinical text-text-inverse hover:bg-clinical-hover rounded-lg font-semibold h-10"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Registering...
                          </span>
                        ) : (
                          "Register & Sign In"
                        )}
                      </Button>
                    </form>
                  )}

                  {portal === "staff" && (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-0.5 text-left">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {staffRole === "doctor" && "Doctor Console"}
                          {staffRole === "nurse" && "Nursing Station"}
                          {staffRole === "admin" && "Administrative Portal"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-[#94A8C7]">
                          {staffRole === "doctor" && "Review outpatient schedules and write draft SOAP notes."}
                          {staffRole === "nurse" && "Access bed occupancy grids, drug logs, and log patient vitals."}
                          {staffRole === "admin" && "Configure multi-tenant compliance, manage staff, and audit logs."}
                        </p>
                      </div>

                      <Input
                        label="Hospital Email"
                        type="email"
                        placeholder={
                          staffRole === "doctor"
                            ? "doctor@mediflow.com"
                            : staffRole === "nurse"
                              ? "nurse@mediflow.com"
                              : "admin@mediflow.com"
                        }
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Input
                        label="Security Password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loading}
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full mt-1 bg-clinical text-text-inverse hover:bg-clinical-hover rounded-lg font-semibold h-10"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Authenticating Staff...
                          </span>
                        ) : (
                          `Sign In as ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}`
                        )}
                      </Button>

                      <p className="text-[10px] text-text-secondary leading-normal border-t border-border pt-3 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 flex-shrink-0" />
                        Self-registration is restricted. Staff credentials must be provisioned by the hospital administrator.
                      </p>
                    </form>
                  )}

                  {/* Demo quick-fill */}
                  <div className="border-t border-border pt-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Demo Accounts</span>
                    <div className="flex flex-wrap gap-1.5">
                      {portal === "patient" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail("patient@mediflow.com");
                            setLoginPassword("password123");
                          }}
                          className="px-2.5 py-1 bg-[#7DD3C0]/10 hover:bg-[#7DD3C0]/20 text-teal-700 dark:text-[#7DD3C0] text-[10px] font-bold rounded border border-teal-200 dark:border-[#7DD3C0]/20 transition-colors"
                        >
                          Patient Demo
                        </button>
                      ) : (
                        <>
                          {staffRole === "doctor" && (
                            <button
                              type="button"
                              onClick={() => {
                                setLoginEmail("doctor@mediflow.com");
                                setLoginPassword("password123");
                              }}
                              className="px-2.5 py-1 bg-[#4A90D9]/10 hover:bg-[#4A90D9]/20 text-blue-700 dark:text-[#8AB4F8] text-[10px] font-bold rounded border border-blue-200 dark:border-[#8AB4F8]/20 transition-colors"
                            >
                              Doctor Demo
                            </button>
                          )}
                          {staffRole === "nurse" && (
                            <button
                              type="button"
                              onClick={() => {
                                setLoginEmail("nurse@mediflow.com");
                                setLoginPassword("password123");
                              }}
                              className="px-2.5 py-1 bg-[#F5A623]/10 hover:bg-[#F5A623]/20 text-amber-700 dark:text-[#F5A623] text-[10px] font-bold rounded border border-amber-200 dark:border-[#F5A623]/20 transition-colors"
                            >
                              Nurse Demo
                            </button>
                          )}
                          {staffRole === "admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setLoginEmail("admin@mediflow.com");
                                setLoginPassword("password123");
                              }}
                              className="px-2.5 py-1 bg-[#6B7280]/10 hover:bg-[#6B7280]/20 text-slate-700 dark:text-[#94A8C7] text-[10px] font-bold rounded border border-slate-200 dark:border-[#6B7280]/20 transition-colors"
                            >
                              Admin Demo
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* === FEATURES SECTION === */}
      <div className="w-full bg-[#F9FAFB] dark:bg-bg-base border-t border-[#E5E7EB] dark:border-border" id="features">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
          {/* Section label */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-[#7DD3C0]/10 border border-teal-200 dark:border-[#7DD3C0]/15 text-xs font-semibold text-teal-800 dark:text-[#7DD3C0] mb-4">
              <Activity className="w-3 h-3" />
              <span>Platform Capabilities</span>
            </div>
            <h2
              className="text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight font-medium"
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              Everything you need to run a hospital
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-[#94A8C7] max-w-xl mx-auto">
              From outpatient scheduling to inpatient bed management — all on a compliant, unified platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Activity className="w-5 h-5 text-[#4A90D9]" />,
                title: "Sub-100ms Chart Loading",
                desc: "Instant vitals, SOAP notes, and drug logs powered by Prisma.",
                bg: "bg-[#4A90D9]/5",
              },
              {
                icon: <Shield className="w-5 h-5 text-[#7DD3C0]" />,
                title: "DPDP & HIPAA Compliant",
                desc: "Fully auditable policies with patient-controlled data consent.",
                bg: "bg-[#7DD3C0]/5",
              },
              {
                icon: <Users className="w-5 h-5 text-[#F5A623]" />,
                title: "Unified Portals",
                desc: "Doctor, nurse, admin, and patient views from one identity layer.",
                bg: "bg-[#F5A623]/5",
              },
              {
                icon: <Heart className="w-5 h-5 text-[#E86B6B]" />,
                title: "Bed & Wards Management",
                desc: "Real-time bed census, occupancy tracking, and room configuration.",
                bg: "bg-[#E86B6B]/5",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface rounded-xl border border-[#E5E7EB] dark:border-border p-6 hover:border-slate-300 dark:hover:border-border-strong hover:shadow-md transition-all duration-200 flex flex-col items-start"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-4",
                    item.bg
                  )}
                >
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-[#94A8C7] mt-2 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === FOOTER === */}
      <footer className="bg-[#F9FAFB] dark:bg-bg-base border-t border-[#E5E7EB] dark:border-border">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-[#94A8C7] gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-serif), Georgia, serif" }} className="text-sm font-medium text-slate-900 dark:text-white">
                MediFLOW
              </span>
              <span className="text-slate-400 dark:text-slate-400">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 sm:ml-4">
              <a href="#" className="text-slate-400 dark:text-[#94A8C7] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-slate-400 dark:text-[#94A8C7] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="text-slate-400 dark:text-[#94A8C7] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="text-slate-400 dark:text-[#94A8C7] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="text-slate-400 dark:text-[#94A8C7] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              HIPAA Statement
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
