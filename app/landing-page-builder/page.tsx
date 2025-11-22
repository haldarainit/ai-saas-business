"use client"

import { useState, useEffect } from "react"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(true)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCode, setCurrentCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [showWorkspaceList, setShowWorkspaceList] = useState(false)

  // Load workspace from URL params or localStorage
  useEffect(() => {
    const workspaceIdFromUrl = searchParams.get("workspace")
    const storedWorkspaceId = localStorage.getItem("currentWorkspaceId")

    if (workspaceIdFromUrl) {
      setWorkspaceId(workspaceIdFromUrl)
      localStorage.setItem("currentWorkspaceId", workspaceIdFromUrl)
      loadWorkspace(workspaceIdFromUrl)
    } else if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId)
      router.push(`/landing-page-builder?workspace=${storedWorkspaceId}`)
      loadWorkspace(storedWorkspaceId)
    }

    // Load workspace list
    loadWorkspaceList()
  }, [])

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
    }
  }

  const loadWorkspaceList = async () => {
    try {
      const userId = "user-123" // Replace with actual user ID
      const response = await fetch(`/api/workspace?userId=${userId}`)
      const data = await response.json()
      if (data.workspaces) {
        setWorkspaces(data.workspaces.slice(0, 5)) // Show last 5 workspaces
      }
    } catch (error) {
      console.error("Error loading workspaces:", error)
    }
  }

  const handleNewWorkspace = () => {
    setMessages([])
    setCurrentCode(null)
    setShowForm(true)
    setWorkspaceId(null)
    localStorage.removeItem("currentWorkspaceId")
    router.push("/landing-page-builder")
    toast.success("Starting new workspace")
  }

  const handleSwitchWorkspace = (id: string) => {
    setWorkspaceId(id)
    localStorage.setItem("currentWorkspaceId", id)
    router.push(`/landing-page-builder?workspace=${id}`)
    loadWorkspace(id)
    setShowWorkspaceList(false)
    toast.success("Workspace loaded")
  }

  const createWorkspace = async (name: string, userId: string = "default-user") => {
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

  const updateWorkspaceMessages = async (newMessages: Message[]) => {
    if (!workspaceId) return

    try {
      await fetch(`/api/workspace/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })
    } catch (error) {
      console.error("Error updating messages:", error)
    }
  }

  const handleFormSubmit = async (details: BusinessDetails) => {
    setBusinessDetails(details)
    setShowForm(false)

    // Create workspace if not exists
    let wsId = workspaceId
    if (!wsId) {
      wsId = await createWorkspace(details.businessName)
      if (!wsId) return
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
        await updateWorkspaceMessages(newMessages)
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
        await updateWorkspaceMessages(updatedMessages)
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

  if (showForm) {
    return (
      <>
        <StructuredData />
        <div className="flex min-h-screen flex-col" suppressHydrationWarning>
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
      <ActionProvider>
        <div className="flex h-screen bg-background overflow-hidden flex-col" suppressHydrationWarning>
          {/* Workspace Header */}
          {!showForm && (
            <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-semibold">Landing Page Builder</h2>
                {workspaceId && (
                  <span className="text-gray-400 text-sm">ID: {workspaceId.slice(0, 8)}...</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWorkspaceList(!showWorkspaceList)}
                    className="gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Workspaces ({workspaces.length})
                  </Button>

                  {showWorkspaceList && workspaces.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-64 z-50">
                      <div className="p-2">
                        <p className="text-gray-400 text-xs uppercase font-semibold mb-2 px-2">Recent Workspaces</p>
                        {workspaces.map((ws) => (
                          <button
                            key={ws._id}
                            onClick={() => handleSwitchWorkspace(ws._id)}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors ${ws._id === workspaceId ? "bg-gray-700" : ""
                              }`}
                          >
                            <div className="text-white text-sm font-medium truncate">{ws.name}</div>
                            <div className="text-gray-400 text-xs">
                              {new Date(ws.updatedAt).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewWorkspace}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  New Workspace
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Middle - Chat Interface */}
            <div className="w-[400px] flex-shrink-0 border-r border-border bg-background flex flex-col">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
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
              {workspaceId ? (
                <CodeViewWorkspace
                  workspaceId={workspaceId}
                  generatedCode={currentCode}
                  isGenerating={isLoading}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading workspace...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ActionProvider>
    </>
  )
}
