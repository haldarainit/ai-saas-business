"use client"

import { useState } from "react"
import ChatInterface from "./components/ChatInterface"
import PreviewArea from "./components/PreviewArea"
import InitialForm from "./components/InitialForm"
import FileExplorer from "./components/FileExplorer"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { toast } from "sonner"

interface Message {
  role: "user" | "model"
  content: string
}

interface BusinessDetails {
  businessName: string
  targetAudience: string
  businessDescription: string
  colorScheme: string
  logo: File | null
}

export default function LandingPageBuilder() {
  const [showForm, setShowForm] = useState(true)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCode, setCurrentCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleFormSubmit = async (details: BusinessDetails) => {
    setBusinessDetails(details)
    setShowForm(false)

    // Generate initial landing page based on form data
    const initialPrompt = `Create a landing page for ${details.businessName}. ${details.businessDescription}${details.targetAudience ? ` Target audience: ${details.targetAudience}.` : ""
      } Use ${details.colorScheme} as the primary color scheme.`

    // Add initial message and generate
    const initialMessages: Message[] = [{ role: "user", content: initialPrompt }]
    setMessages(initialMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: initialMessages,
          currentCode: null,
          businessDetails: details,
        }),
      })

      const data = await response.json()

      if (data.success && data.code) {
        setCurrentCode(data.code)
        setMessages([
          ...initialMessages,
          {
            role: "model",
            content: "I've created your initial landing page! Feel free to ask me to make any changes.",
          },
        ])
        toast.success("Landing page generated successfully!")
      } else {
        toast.error(data.error || "Failed to generate landing page")
        setMessages([
          ...initialMessages,
          {
            role: "model",
            content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.`,
          },
        ])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred. Please try again.")
      setMessages([
        ...initialMessages,
        {
          role: "model",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          currentCode: currentCode || null,
          businessDetails,
        }),
      })

      const data = await response.json()

      if (data.success && data.code) {
        setCurrentCode(data.code)
        setMessages([
          ...newMessages,
          {
            role: "model",
            content: data.message || "Landing page has been updated!",
          },
        ])
        toast.success(data.message || "Landing page updated successfully!")
      } else {
        toast.error(data.error || "Failed to update landing page")
        setMessages([
          ...newMessages,
          {
            role: "model",
            content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.`,
          },
        ])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred. Please try again.")
      setMessages([
        ...newMessages,
        {
          role: "model",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (showForm) {
    return (
      <>
        <StructuredData />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <InitialForm onSubmit={handleFormSubmit} />
          </main>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <StructuredData />
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <div className="hidden md:block flex-shrink-0">
          <FileExplorer />
        </div>

        {/* Middle - Chat Interface */}
        <div className="w-[400px] flex-shrink-0 border-r border-border bg-background flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Right - Preview Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <PreviewArea code={currentCode} isLoading={isLoading} />
        </div>
      </div>
    </>
  )
}
