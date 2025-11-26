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
import ResizableSplitPane from "./components/ResizableSplitPane"

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
  const [showForm, setShowForm] = useState(false)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCode, setCurrentCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  // History Management
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Debug: Log when currentCode changes
  useEffect(() => {
    console.log("🔄 currentCode changed:", currentCode)
    console.log("Current historyIndex:", historyIndex)
  }, [currentCode, historyIndex])

  // Load workspace from URL params
  useEffect(() => {
    const workspaceIdFromUrl = searchParams.get("workspace")
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
          const code = { files: data.workspace.fileData }
          setCurrentCode(code)
          // Initialize history with loaded code
          setHistory([code])
          setHistoryIndex(0)

          // Initialize last saved state to prevent initial auto-save
          lastSavedStateRef.current = {
            messages: JSON.stringify(data.workspace.messages || []),
            code: JSON.stringify(data.workspace.fileData || {})
          }

          setShowForm(false)
        }
      }
    } catch (error) {
      console.error("Error loading workspace:", error)
      toast.error("Failed to load workspace")
      setWorkspaceId(null)
    }
  }

  const addToHistory = (code: any) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(code)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }

  // Ref to prevent history updates during undo/redo
  const isUndoRedoRef = useRef(false)

  // Key to force Sandpack reload only when needed (Undo/Redo/AI generation)
  const [sandpackKey, setSandpackKey] = useState(0)

  // Auto-repair history index if it gets out of sync
  useEffect(() => {
    if (history.length > 0 && historyIndex >= history.length) {
      console.warn(`⚠️ History index desync detected! Index: ${historyIndex}, Length: ${history.length}. Auto-correcting to ${history.length - 1}`)
      setHistoryIndex(history.length - 1)
    }
  }, [historyIndex, history.length])

  const handleUndo = () => {
    console.log("🔙 UNDO CLICKED")
    console.log("Current historyIndex:", historyIndex)
    console.log("History length:", history.length)
    console.log("Current history:", history)

    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      const newIndex = historyIndex - 1
      console.log("Going to index:", newIndex)
      console.log("Code at that index:", history[newIndex])

      setHistoryIndex(newIndex)
      setCurrentCode(history[newIndex])
      setSandpackKey(prev => prev + 1) // Force reload

      console.log("✅ Undo complete - currentCode should update to:", history[newIndex])
      toast.success("Undone")
      setTimeout(() => {
        isUndoRedoRef.current = false
        console.log("isUndoRedoRef reset to false")
      }, 1000)
    } else {
      console.log("❌ Cannot undo - already at oldest version")
    }
  }

  const handleRedo = () => {
    console.log("🔜 REDO CLICKED")
    console.log("Current historyIndex:", historyIndex)
    console.log("History length:", history.length)
    console.log("Current history:", history)

    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      const newIndex = historyIndex + 1
      console.log("Going to index:", newIndex)
      console.log("Code at that index:", history[newIndex])

      setHistoryIndex(newIndex)
      setCurrentCode(history[newIndex])
      setSandpackKey(prev => prev + 1) // Force reload

      console.log("✅ Redo complete - currentCode should update to:", history[newIndex])
      toast.success("Redone")
      setTimeout(() => {
        isUndoRedoRef.current = false
        console.log("isUndoRedoRef reset to false")
      }, 1000)
    } else {
      console.log("❌ Cannot redo - already at newest version")
    }
  }
  const handleNewWorkspace = () => {
    setMessages([])
    setCurrentCode(null)
    setHistory([])
    setHistoryIndex(-1)
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

  // Track last saved state to avoid unnecessary saves
  const lastSavedStateRef = useRef<{ messages?: string, code?: string }>({})
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateWorkspaceMessages = useCallback(async (newMessages?: Message[], newCode?: any) => {
    if (!workspaceId) return

    try {
      const body: any = {}
      let hasChanges = false

      // Check if messages changed
      if (newMessages && newMessages.length > 0) {
        const messagesStr = JSON.stringify(newMessages)
        if (lastSavedStateRef.current.messages !== messagesStr) {
          console.log("Messages changed, will save")
          body.messages = newMessages
          lastSavedStateRef.current.messages = messagesStr
          hasChanges = true
        } else {
          console.log("Messages unchanged, skipping")
        }
      }

      // Check if code changed
      if (newCode?.files && Object.keys(newCode.files).length > 0) {
        const codeStr = JSON.stringify(newCode.files)
        if (lastSavedStateRef.current.code !== codeStr) {
          console.log("Code changed, will save")
          body.fileData = newCode.files
          lastSavedStateRef.current.code = codeStr
          hasChanges = true
        } else {
          console.log("Code unchanged, skipping save")
        }
      }

      // Only save if there were actual changes
      if (!hasChanges) {
        console.log("No changes detected, skipping API call")
        return
      }

      console.log("Saving to database...")
      await fetch(`/api/workspace/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      console.log("Save complete")
    } catch (error) {
      console.error("Error updating workspace:", error)
    }
  }, [workspaceId])

  const handleCodeChange = useCallback((files: any) => {
    console.log("📝 handleCodeChange called")
    console.log("isUndoRedoRef.current:", isUndoRedoRef.current)

    const newCode = { files }
    setCurrentCode(newCode)

    // Save to workspace (will only actually save if changed)
    console.log("Triggering save check...")
    updateWorkspaceMessages(messages, newCode)

    // Debounce history updates to avoid saving every keystroke
    if (!isUndoRedoRef.current) {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current)
      }

      historyTimeoutRef.current = setTimeout(() => {
        console.log("Adding to history (debounced user edit)")

        setHistory(prev => {
          // Re-calculate safe index based on LATEST state
          // Note: We need to be careful with closures here. 
          // Ideally we'd use a functional update that checks the current history state,
          // but historyIndex is from the outer scope.
          // A safer approach for debouncing is to just update the history state
          // and let the index follow.

          // However, since we're inside a timeout, 'historyIndex' might be stale if not careful.
          // But since we clear timeout on every change, this runs only when typing stops.

          // Actually, for a robust undo/redo, we should snapshot the state *before* changes start?
          // No, standard behavior is: type type type -> pause -> save state.

          // Let's use the ref approach for history index to ensure freshness if needed,
          // or just rely on the fact that while typing, historyIndex shouldn't change from other sources.

          const currentHistory = prev.slice(0, historyIndex + 1)
          const newHistory = [...currentHistory, newCode]
          console.log("New history length:", newHistory.length)
          return newHistory
        })

        setHistoryIndex(prev => {
          const newIndex = prev + 1
          console.log("New historyIndex:", newIndex)
          return newIndex
        })
      }, 1000) // 1 second debounce
    } else {
      console.log("Skipping history add (undo/redo operation)")
    }
  }, [historyIndex, messages, updateWorkspaceMessages, history])

  // Effect to add to history when currentCode changes, BUT only if it's not from undo/redo
  // This is tricky. Let's simplify:
  // We will add to history ONLY when:
  // 1. AI generates code
  // 2. User edits code (via handleCodeChange)

  // We'll modify handleCodeChange to add to history
  // And modify the AI success block to add to history.

  const handleFormSubmit = async (details: BusinessDetails) => {
    setBusinessDetails(details)
    setShowForm(false)

    let wsId = workspaceId
    if (!wsId) {
      wsId = await createWorkspace(details.businessName)
      if (!wsId) return
      const newUrl = `/landing-page-builder?workspace=${wsId}`
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl)
    }

    const initialPrompt = `Create a landing page for ${details.businessName}. ${details.businessDescription}${details.targetAudience ? ` Target audience: ${details.targetAudience}.` : ""} Use ${details.colorScheme} as the primary color scheme.`
    const initialMessages: Message[] = [{ role: "user", content: initialPrompt }]
    setMessages(initialMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: initialMessages,
          currentCode: null,
          businessDetails: details,
        }),
      })

      const data = await response.json()

      if (data.success && data.files) {
        const newCode = { files: data.files }
        setCurrentCode(newCode)
        addToHistory(newCode) // Add to history
        setSandpackKey(prev => prev + 1) // Force reload

        const newMessages: Message[] = [
          ...initialMessages,
          { role: "model", content: "I've created your initial landing page! Feel free to ask me to make any changes." },
        ]
        setMessages(newMessages)
        await updateWorkspaceMessages(newMessages, { files: data.files })
        toast.success("Landing page generated successfully!")
      } else {
        toast.error(data.error || "Failed to generate landing page")
        setMessages([...initialMessages, { role: "model", content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.` }])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred. Please try again.")
      setMessages([...initialMessages, { role: "model", content: "Sorry, I encountered an error. Please try again." }])
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentCode: currentCode,
          businessDetails,
        }),
      })

      const data = await response.json()

      if (data.success && data.files) {
        const newCode = { files: data.files }
        setCurrentCode(newCode)
        addToHistory(newCode) // Add to history
        setSandpackKey(prev => prev + 1) // Force reload

        let aiMessage = data.message || "Landing page has been updated!";
        if (data.modifiedFiles && data.modifiedFiles.length > 0) {
          const fileList = data.modifiedFiles.map((f: string) => `\`${f}\``).join(", ");
          aiMessage = ` ${data.message}\n\n Modified: ${fileList}`;
        }

        const updatedMessages: Message[] = [
          ...newMessages,
          { role: "model", content: aiMessage },
        ]
        setMessages(updatedMessages)
        await updateWorkspaceMessages(updatedMessages, { files: data.files })
        toast.success(data.message || "Landing page updated successfully!")
      } else {
        toast.error(data.error || "Failed to update landing page")
        setMessages([...newMessages, { role: "model", content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.` }])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred. Please try again.")
      setMessages([...newMessages, { role: "model", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRuntimeError = async (error: string) => {
    if (isLoading) return
    console.log("Auto-fixing error:", error)
    toast.error("Runtime error detected. Auto-fixing...")
    const errorMessage = `I detected a runtime error in the application: ${error}. Please fix it.`
    await handleSendMessage(errorMessage)
  }

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the workspace? This will clear all messages and code.")) return
    setMessages([])
    setCurrentCode(null)
    setHistory([])
    setHistoryIndex(-1)
    setShowForm(true)
    if (workspaceId) {
      try {
        await fetch(`/api/workspace/${workspaceId}`, { method: "DELETE" })
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
      const response = await fetch(`/api/workspace/${id}`, { method: "DELETE" })
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
            <ResizableSplitPane
              left={
                <div className="h-full border-r border-border bg-background flex flex-col">
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
              }
              right={
                <div className="h-full flex flex-col min-w-0 bg-slate-50">
                  <CodeViewWorkspace
                    workspaceId={workspaceId}
                    generatedCode={currentCode}
                    isGenerating={isLoading}
                    onCodeChange={handleCodeChange}
                    onDelete={handleDeleteWorkspace}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onRuntimeError={handleRuntimeError}
                    sandpackKey={sandpackKey}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                  />
                </div>
              }
            />
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
