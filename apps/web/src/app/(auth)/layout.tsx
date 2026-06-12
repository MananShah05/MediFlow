import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background medical grid aura */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A3A52_1px,transparent_1px),linear-gradient(to_bottom,#2A3A52_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-clinical/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-role-patient/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
