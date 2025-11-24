"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ChatInterface from "./components/ChatInterface"
import CodeViewWorkspace from "./components/CodeViewWorkspace"
import InitialForm from "./components/InitialForm"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ActionProvider } from "@/contexts/ActionContext"
import { Button } from "@/components/ui/button"
import { RotateCcw, Plus, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import Dashboard from "./components/Dashboard"

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

function LandingPageBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false) // Changed default to false to show Dashboard first
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCode, setCurrentCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  // const [showWorkspaceList, setShowWorkspaceList] = useState(false) // Removed as we have Dashboard now

  // Load workspace from URL params or localStorage
  useEffect(() => {
    const workspaceIdFromUrl = searchParams.get("workspace")
    // const storedWorkspaceId = localStorage.getItem("currentWorkspaceId") // Don't auto-load from local storage to allow dashboard

    if (workspaceIdFromUrl) {
      setWorkspaceId(workspaceIdFromUrl)
      loadWorkspace(workspaceIdFromUrl)
    } else {
      setWorkspaceId(null)
    }
  }, [searchParams])

  const loadWorkspace = async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/${id}`)
      const data = await response.json()

      if (data.workspace) {
        setMessages(data.workspace.messages || [])
        if (Object.keys(data.workspace.fileData || {}).length > 0) {
          setCurrentCode({ files: data.workspace.fileData })
          setShowForm(false)
        }
      }
    } catch (error) {
      console.error("Error loading workspace:", error)
      toast.error("Failed to load workspace")
      setWorkspaceId(null) // Go back to dashboard on error
    }
  }

  const handleNewWorkspace = () => {
    setMessages([])
    setCurrentCode(null)
    setShowForm(true)
    setWorkspaceId(null)
    router.push("/landing-page-builder")
  }

  const handleSwitchWorkspace = (id: string) => {
    setWorkspaceId(id)
    router.push(`/landing-page-builder?workspace=${id}`)
  }

  const handleBackToDashboard = () => {
    setWorkspaceId(null)
    setShowForm(false)
    router.push("/landing-page-builder")
  }

  const CURRENT_USER_ID = "user-123"

  const createWorkspace = async (name: string, userId: string = CURRENT_USER_ID) => {
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId }),
      })

      const data = await response.json()

      if (data.success && data.workspace) {
        setWorkspaceId(data.workspace._id)
        localStorage.setItem("currentWorkspaceId", data.workspace._id)
        return data.workspace._id
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
      toast.error("Failed to create workspace")
    }
    return null
  }

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateWorkspaceMessages = useCallback(async (newMessages: Message[], newCode?: any) => {
    if (!workspaceId) return

    // Debounce to prevent duplicate simultaneous updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const body: any = {}

        // Only include messages if provided
        if (newMessages && newMessages.length > 0) {
          body.messages = newMessages
        }

        // Only include fileData if provided
        if (newCode && newCode.files && Object.keys(newCode.files).length > 0) {
          body.fileData = newCode.files
        }

        // Don't send empty requests
        if (Object.keys(body).length === 0) {
          console.log("Skipping empty update")
          return
        }

        await fetch(`/api/workspace/${workspaceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } catch (error) {
        console.error("Error updating workspace:", error)
      }
    }, 2000) // 2 second debounce to reduce server load
  }, [workspaceId])

  const handleCodeChange = useCallback(async (files: any) => {
    setCurrentCode({ files })
    await updateWorkspaceMessages(messages, { files })
  }, [messages, updateWorkspaceMessages])

  const handleFormSubmit = async (details: BusinessDetails) => {
    setBusinessDetails(details)
    setShowForm(false)

    // Create workspace if not exists
    let wsId = workspaceId
    if (!wsId) {
      wsId = await createWorkspace(details.businessName)
      if (!wsId) return

      // Update URL with new workspace ID without reloading
      const newUrl = `/landing-page-builder?workspace=${wsId}`
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl)
    }

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

      if (data.success && data.files) {
        setCurrentCode({ files: data.files })
        const newMessages: Message[] = [
          ...initialMessages,
          {
            role: "model" as const,
            content: "I've created your initial landing page! Feel free to ask me to make any changes.",
          },
        ]
        setMessages(newMessages)
        await updateWorkspaceMessages(newMessages, { files: data.files })
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
          currentCode: currentCode, // Pass the full currentCode object (with files)
          businessDetails,
        }),
      })

      const data = await response.json()

      if (data.success && data.files) {
        setCurrentCode({ files: data.files })
        const updatedMessages: Message[] = [
          ...newMessages,
          {
            role: "model" as const,
            content: data.message || "Landing page has been updated!",
          },
        ]
        setMessages(updatedMessages)
        await updateWorkspaceMessages(updatedMessages, { files: data.files })
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

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the workspace? This will clear all messages and code.")) {
      return
    }

    setMessages([])
    setCurrentCode(null)
    setShowForm(true)

    if (workspaceId) {
      try {
        await fetch(`/api/workspace/${workspaceId}`, {
          method: "DELETE",
        })
        localStorage.removeItem("currentWorkspaceId")
        setWorkspaceId(null)
        toast.success("Workspace reset successfully")
      } catch (error) {
        console.error("Error resetting workspace:", error)
        toast.error("Failed to reset workspace")
      }
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return
    await handleDeleteWorkspaceById(workspaceId)
  }

  const handleDeleteWorkspaceById = async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Workspace deleted successfully")
        if (workspaceId === id) {
          setWorkspaceId(null)
          setShowForm(false)
          router.push("/landing-page-builder")
        }
      } else {
        toast.error("Failed to delete workspace")
      }
    } catch (error) {
      console.error("Error deleting workspace:", error)
      toast.error("Failed to delete workspace")
    }
  }

  // Render logic
  if (showForm) {
    return (
      <>
        <StructuredData />
        <div className="flex min-h-screen flex-col" suppressHydrationWarning>
          <Navbar />
          <main className="flex-1">
            <InitialForm onSubmit={handleFormSubmit} onCancel={() => setShowForm(false)} />
          </main>
          <Footer />
        </div>
      </>
    )
  }

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-black flex flex-col" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">
          <Dashboard
            userId={CURRENT_USER_ID}
            onSelectWorkspace={handleSwitchWorkspace}
            onCreateNew={handleNewWorkspace}
            onDeleteWorkspace={handleDeleteWorkspaceById}
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <StructuredData />
      <ActionProvider>
        <div className="flex h-screen bg-background overflow-hidden flex-col" suppressHydrationWarning>
          {/* Workspace Header */}
          <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className="text-gray-400 hover:text-white">
                <FolderOpen className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-4 w-px bg-gray-700 mx-2" />
              <h2 className="text-white font-semibold">Landing Page Builder</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Removed dropdown as we have dashboard */}
              <Button
                variant="default"
                size="sm"
                onClick={handleNewWorkspace}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Middle - Chat Interface */}
            <div className="w-[400px] flex-shrink-0 border-r border-border bg-background flex flex-col">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                generatedFiles={isLoading ? currentCode?.files : null}
              />

              {/* Reset Button at bottom of chat */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Workspace
                </Button>
              </div>
            </div>

            {/* Right - Code View Workspace */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
              <CodeViewWorkspace
                workspaceId={workspaceId}
                generatedCode={currentCode}
                isGenerating={isLoading}
                onCodeChange={handleCodeChange}
                onDelete={handleDeleteWorkspace}
              />
            </div>
          </div>
        </div>
      </ActionProvider>
    </>
  )
}

export default function LandingPageBuilder() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageBuilderContent />
    </Suspense>
  )
}
