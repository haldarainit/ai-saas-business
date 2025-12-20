"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ChatInterface, { Attachment } from "./components/ChatInterface"
import CodeViewWorkspace from "./components/CodeViewWorkspace"
import InitialForm from "./components/InitialForm"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import { ActionProvider } from "@/contexts/ActionContext"
import { Button } from "@/components/ui/button"
import { RotateCcw, Plus, FolderOpen, Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"
import Dashboard from "./components/Dashboard"
import ResizableSplitPane from "./components/ResizableSplitPane"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface Message {
  role: "user" | "model"
  content: string
  attachments?: Attachment[]
  error?: boolean
}

interface BusinessDetails {
  businessName: string
  targetAudience: string
  businessDescription: string
  colorScheme: string
  logo: File | null
}

function LandingPageBuilderContent() {
  // Get authenticated user
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentCode, setCurrentCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  // History Management
  interface HistoryEntry {
    code: any;
    timestamp: number;
    source: 'ai' | 'user';
    label?: string;
    version: string;
    messages?: Message[];
    userPrompt?: string;
  }
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Ref to prevent history updates during undo/redo
  const isUndoRedoRef = useRef(false)

  // Track last saved state to avoid unnecessary saves
  const lastSavedStateRef = useRef<{ messages?: string, code?: string, history?: string }>({})
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Key to force Sandpack reload only when needed (Undo/Redo/AI generation)
  const [sandpackKey, setSandpackKey] = useState(0)

  // Auto-repair history index if it gets out of sync
  useEffect(() => {
    if (history.length > 0 && historyIndex >= history.length) {
      console.warn(`⚠️ History index desync detected! Index: ${historyIndex}, Length: ${history.length}. Auto-correcting to ${history.length - 1}`)
      setHistoryIndex(history.length - 1)
    }
  }, [historyIndex, history.length])

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

          console.log("Loading workspace history:", {
            hasHistory: !!data.workspace.history,
            length: data.workspace.history?.length
          })

          // Initialize history with loaded code
          if (data.workspace.history && data.workspace.history.length > 0) {
            setHistory(data.workspace.history)
            setHistoryIndex(data.workspace.history.length - 1)

            // If we have history, set current code to the latest history entry
            const latestEntry = data.workspace.history[data.workspace.history.length - 1]
            setCurrentCode(latestEntry.code)
            if (latestEntry.messages) {
              setMessages(latestEntry.messages)
            }
          } else {
            const initialEntry: HistoryEntry = {
              code,
              timestamp: Date.now(),
              source: 'user', // Assume user for initial load or maybe 'ai' if we tracked it
              label: 'Initial Load',
              version: 'v1.0'
            }
            setHistory([initialEntry])
            setHistoryIndex(0)
          }

          // Initialize last saved state to prevent initial auto-save
          lastSavedStateRef.current = {
            messages: JSON.stringify(data.workspace.messages || []),
            code: JSON.stringify(data.workspace.fileData || {}),
            history: JSON.stringify(data.workspace.history || [])
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

  const addToHistory = (code: any, source: 'ai' | 'user' = 'user', label?: string, userPrompt?: string, currentMessages?: Message[]) => {
    // Determine if we should merge with the previous entry
    // We merge if the current source is 'user' and the last entry was also 'user'
    const currentHistorySlice = history.slice(0, historyIndex + 1)
    const lastEntry = currentHistorySlice[currentHistorySlice.length - 1]
    const shouldMerge = source === 'user' && lastEntry && lastEntry.source === 'user'

    let newHistory: HistoryEntry[] = [];

    if (shouldMerge) {
      // Update the last entry
      const updatedEntry = {
        ...lastEntry,
        code,
        timestamp: Date.now(),
        messages: currentMessages || lastEntry.messages
      }
      newHistory = [...currentHistorySlice]
      newHistory[newHistory.length - 1] = updatedEntry
    } else {
      // Create new entry
      let newVersion = 'v1.0'
      if (lastEntry && lastEntry.version) {
        const [major, minor] = lastEntry.version.replace('v', '').split('.').map(Number)
        newVersion = `v${major}.${minor + 1}`
      }

      const entry: HistoryEntry = {
        code,
        timestamp: Date.now(),
        source,
        label,
        version: newVersion,
        messages: currentMessages,
        userPrompt
      }
      newHistory = [...currentHistorySlice, entry]
    }

    setHistory(newHistory)

    // Only increment index if we added a NEW entry
    if (!shouldMerge) {
      setHistoryIndex(newHistory.length - 1)
    }

    console.log("addToHistory: Saving history to DB", {
      entries: newHistory.length,
      lastVersion: newHistory[newHistory.length - 1].version
    })

    // Save history to DB
    updateWorkspaceMessages(undefined, undefined, newHistory);
  }

  const handleUndo = () => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
    }

    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setCurrentCode(history[newIndex].code)
      setSandpackKey(prev => prev + 1) // Force reload
      toast.success(`Undone to ${history[newIndex].version}`)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 3000)
    }
  }

  const handleRedo = () => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
    }

    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setCurrentCode(history[newIndex].code)
      if (history[newIndex].messages) {
        setMessages(history[newIndex].messages!)
      }
      setSandpackKey(prev => prev + 1) // Force reload
      toast.success(`Redone to ${history[newIndex].version}`)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 3000)
    }
  }

  const handleVersionSelect = (index: number) => {
    if (index === historyIndex) return;
    isUndoRedoRef.current = true;
    setHistoryIndex(index);
    setCurrentCode(history[index].code);
    if (history[index].messages) {
      setMessages(history[index].messages!);
    }
    setSandpackKey(prev => prev + 1);
    toast.success(`Switched to ${history[index].version}`);
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 3000);
  }

  const handleGoToLatest = () => {
    if (history.length > 0 && historyIndex !== history.length - 1) {
      handleVersionSelect(history.length - 1);
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

  const createWorkspace = async (name: string) => {
    if (!user?.id) {
      toast.error("Please log in to create a workspace")
      return null
    }
    try {
      // API gets userId from server-side authentication
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (data.success && data.workspace) {
        setWorkspaceId(data.workspace._id)
        localStorage.setItem("currentWorkspaceId", data.workspace._id)
        return data.workspace._id
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
      toast.error("Failed to create workspace")
    }
    return null
  }

  const updateWorkspaceMessages = useCallback(async (newMessages?: Message[], newCode?: any, newHistory?: HistoryEntry[]) => {
    if (!workspaceId) return

    try {
      const body: any = {}
      let hasChanges = false

      if (newMessages && newMessages.length > 0) {
        const messagesStr = JSON.stringify(newMessages)
        if (lastSavedStateRef.current.messages !== messagesStr) {
          body.messages = newMessages
          lastSavedStateRef.current.messages = messagesStr
          hasChanges = true
        }
      }

      if (newCode?.files && Object.keys(newCode.files).length > 0) {
        const codeStr = JSON.stringify(newCode.files)
        if (lastSavedStateRef.current.code !== codeStr) {
          body.fileData = newCode.files
          lastSavedStateRef.current.code = codeStr
          hasChanges = true
        }
      }

      if (newHistory && newHistory.length > 0) {
        const historyStr = JSON.stringify(newHistory)
        console.log("Checking history update:", {
          currentLength: newHistory.length,
          lastSavedLength: lastSavedStateRef.current.history?.length,
          hasChanges: lastSavedStateRef.current.history !== historyStr
        })
        if (lastSavedStateRef.current.history !== historyStr) {
          body.history = newHistory
          lastSavedStateRef.current.history = historyStr
          hasChanges = true
        }
      }

      if (!hasChanges) {
        return
      }

      console.log("Sending update to workspace:", Object.keys(body))

      await fetch(`/api/workspace/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (error) {
      console.error("Error updating workspace:", error)
    }
  }, [workspaceId])

  const areFilesEqual = (files1: any, files2: any) => {
    if (!files1 || !files2) return false;
    const keys1 = Object.keys(files1);
    const keys2 = Object.keys(files2);
    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!files2[key]) return false;
      const code1 = typeof files1[key] === 'string' ? files1[key] : files1[key].code;
      const code2 = typeof files2[key] === 'string' ? files2[key] : files2[key].code;
      const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
      if (normalize(code1) !== normalize(code2)) return false;
    }
    return true;
  }

  const handleCodeChange = useCallback((files: any) => {
    if (isLoading || isUndoRedoRef.current) return;
    if (currentCode?.files && areFilesEqual(files, currentCode.files)) return;

    const newCode = { files }
    setCurrentCode(newCode)
    updateWorkspaceMessages(messages, newCode)

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
    }

    historyTimeoutRef.current = setTimeout(() => {
      addToHistory(newCode, 'user', 'User Edit', undefined, messages)
    }, 1000)
  }, [historyIndex, messages, updateWorkspaceMessages, history, isLoading, currentCode])

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
        const mergedFiles = { ...currentCode?.files, ...data.files }
        const newCode = { files: mergedFiles }

        const newMessages: Message[] = [
          ...initialMessages,
          { role: "model", content: "I've created your initial landing page! Feel free to ask me to make any changes." },
        ]

        setCurrentCode(newCode)
        addToHistory(newCode, 'ai', 'Initial Generation', initialPrompt, newMessages)
        setSandpackKey(prev => prev + 1)

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

  const handleSendMessage = async (userMessage: string, attachments: Attachment[] = [], messageIndex?: number) => {
    let newMessages: Message[] = [];

    if (messageIndex !== undefined) {
      // Retry existing message
      newMessages = [...messages];
      // Clear error state
      newMessages[messageIndex] = { ...newMessages[messageIndex], error: false };
      setMessages(newMessages);
    } else {
      // New message
      newMessages = [...messages, { role: "user", content: userMessage, attachments }];
      setMessages(newMessages);
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentCode: currentCode,
          businessDetails,
          attachments
        }),
      })

      const data = await response.json()

      if (data.success && data.files) {
        const mergedFiles = { ...currentCode?.files, ...data.files }
        const newCode = { files: mergedFiles }

        // Inject uploaded images/media into the file system for Sandpack
        if (attachments && attachments.length > 0) {
          attachments.forEach(att => {
            // Sanitize filename but keep extension
            const safeName = att.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            // Create a JS module for the asset to allow importing
            // We append .js to the original filename (e.g. image.png -> image.png.js)
            // This allows the user/AI to import it as a module while preserving the original name context
            const filePath = `/src/assets/${safeName}.js`;

            let fileContent = '';
            if (att.content) {
              fileContent = `export default "${att.content}";`;
            } else if (att.url) {
              fileContent = `export default "${att.url}";`;
            }

            if (fileContent) {
              newCode.files[filePath] = { code: fileContent };
            }
          });
        }

        let aiMessage = data.message || "Landing page has been updated!";
        if (data.modifiedFiles && data.modifiedFiles.length > 0) {
          const fileList = data.modifiedFiles.map((f: string) => `\`${f}\``).join(", ");
          aiMessage = ` ${data.message}\n\n Modified: ${fileList}`;
        }

        const updatedMessages: Message[] = [
          ...newMessages,
          { role: "model", content: aiMessage },
        ]

        setCurrentCode(newCode)
        addToHistory(newCode, 'ai', 'AI Update', userMessage, updatedMessages)
        setSandpackKey(prev => prev + 1)

        setMessages(updatedMessages)
        await updateWorkspaceMessages(updatedMessages, { files: newCode.files })
        toast.success(data.message || "Landing page updated successfully!")
      } else {
        toast.error(data.error || "Failed to update landing page")
        // Mark the last user message as error
        const errorMessages = [...newMessages];
        const lastUserIndex = messageIndex !== undefined ? messageIndex : errorMessages.length - 1;
        if (errorMessages[lastUserIndex].role === 'user') {
          errorMessages[lastUserIndex] = { ...errorMessages[lastUserIndex], error: true };
        }
        setMessages([...errorMessages, { role: "model", content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.` }])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred. Please try again.")

      // Mark the last user message as error
      const errorMessages = [...newMessages];
      const lastUserIndex = messageIndex !== undefined ? messageIndex : errorMessages.length - 1;
      if (errorMessages[lastUserIndex].role === 'user') {
        errorMessages[lastUserIndex] = { ...errorMessages[lastUserIndex], error: true };
      }
      setMessages([...errorMessages, { role: "model", content: "Sorry, I encountered an error. Please try again." }])
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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center" suppressHydrationWarning>
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <>
        <StructuredData />
        <div className="min-h-screen bg-black flex flex-col" suppressHydrationWarning>
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
              <p className="text-gray-400 mb-8">
                Please sign in to access the Landing Page Builder and manage your workspaces.
              </p>
              <Link href="/get-started">
                <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                  Sign In / Sign Up
                </Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

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
            userId={user.id}
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
                    onRetry={(index) => {
                      const msg = messages[index];
                      if (msg && msg.role === 'user') {
                        handleSendMessage(msg.content, msg.attachments, index);
                      }
                    }}
                  />

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
                    history={history}
                    onVersionSelect={handleVersionSelect}
                    currentPrompt={history[historyIndex]?.userPrompt}
                    isAtLatest={historyIndex === history.length - 1}
                    onGoToLatest={handleGoToLatest}
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
