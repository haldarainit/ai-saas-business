"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { useState } from "react"
import Link from "next/link"

export default function HeroButtons() {
    const { user } = useAuth()
    const [authModalOpen, setAuthModalOpen] = useState(false)

    return (
        <>
            <div className="flex flex-wrap justify-center gap-3 mt-16">
                {user ? (
                    <Button
                        asChild
                        id="get-started-button"
                        className="flex items-center gap-3 px-5 py-6 h-[60px] bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_15px_rgba(36,101,237,0.5)] relative overflow-hidden group"
                    >
                        <Link href="/get-started">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 dark:opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                            <Zap className="h-5 w-5 text-white relative z-10" />
                            <span className="text-[15px] font-medium relative z-10">Get Started</span>
                        </Link>
                    </Button>
                ) : (
                    <Button
                        onClick={() => setAuthModalOpen(true)}
                        id="join-button"
                        className="flex items-center gap-3 px-5 py-6 h-[60px] bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_15px_rgba(36,101,237,0.5)] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 dark:opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                        <Zap className="h-5 w-5 text-white relative z-10" />
                        <span className="text-[15px] font-medium relative z-10">Join</span>
                    </Button>
                )}
            </div>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
            />
        </>
    )
}
