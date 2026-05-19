"use client"

import * as React from "react"
import { getStoredAuthUser, clearAuthSession, type AuthUser, updateProfile, changePassword } from "@/lib/auth"
import { getAccessToken } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import CKEditorCDN from "@/components/CKEditorCDN"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createNote, deleteNote, listNotes, listTags, type Note, updateNote } from "@/lib/notes"
import {
  BellIcon, Loader2Icon, NotebookIcon,
  PencilIcon, PlusIcon, SearchIcon, Trash2Icon,
  StarIcon, ArchiveIcon, SettingsIcon, ClockIcon,
  TypeIcon, PaperclipIcon, ImageIcon, Share2Icon, MoreVerticalIcon, FilesIcon,
  UserIcon, LogOutIcon, SparklesIcon, ArrowRightIcon, Lock, ShieldCheck
} from "lucide-react"


function stripHtml(html: string = "") {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}

// Dynamic tag helper based on content classification
function getNoteTag(title: string, content?: string | null) {
  const cleanContent = stripHtml(content || "")
  const text = `${title} ${cleanContent}`.toLowerCase()
  if (text.includes("học") || text.includes("prisma") || text.includes("nestjs") || text.includes("sách") || text.includes("course") || text.includes("lớp")) {
    return { 
      name: "Học tập", 
      color: "bg-[#e1e0ff] text-[#2f2ebe] dark:bg-purple-950/40 dark:text-purple-300"
    }
  }
  if (text.includes("mua sắm") || text.includes("chợ") || text.includes("cá nhân") || text.includes("gia đình") || text.includes("shopping")) {
    return { 
      name: "Cá nhân", 
      color: "bg-[#86f2e4]/30 text-[#006f66] dark:bg-emerald-950/40 dark:text-emerald-300"
    }
  }
  if (text.includes("meeting") || text.includes("công việc") || text.includes("work") || text.includes("dự án") || text.includes("sprint") || text.includes("họp") || text.includes("deadline")) {
    return { 
      name: "Công việc", 
      color: "bg-[#e1e0ff] text-[#2f2ebe] dark:bg-blue-950/40 dark:text-blue-300"
    }
  }
  if (text.includes("ý tưởng") || text.includes("side project") || text.includes("app") || text.includes("phát triển") || text.includes("idea")) {
    return { 
      name: "Ý tưởng", 
      color: "bg-[#ffdcc5] text-[#703700] dark:bg-amber-950/40 dark:text-amber-300"
    }
  }
  return { 
    name: "Ghi chú", 
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }
}

// Clean date formatting matching the mockup (1h ago, Yesterday, Oct 12)
function formatNoteDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 60) {
    if (diffMins <= 0) return "Vừa xong"
    return `${diffMins}m trước`
  }
  if (diffHours < 24) {
    return `${diffHours}h trước`
  }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return "Hôm qua"
  }
  if (diffDays < 7) {
    return `${diffDays} ngày trước`
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short"
  })
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(null)
  const [notes, setNotes] = React.useState<Note[]>([])
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingNote, setEditingNote] = React.useState<Note | null>(null)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")

  // Modern dashboard state variables
  const [activeTab, setActiveTab] = React.useState<"all" | "favorites" | "trash" | "archive" | "settings">("all")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null)
  const [starredIds, setStarredIds] = React.useState<string[]>([])
  
  // Right Column draft edits
  const [draftTitle, setDraftTitle] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [draftTags, setDraftTags] = React.useState<string[]>([])
  const [draftTagInput, setDraftTagInput] = React.useState("")
  const [apiTags, setApiTags] = React.useState<string[]>([])

  const systemTags = React.useMemo(() => {
    const all = new Set<string>()
    apiTags.forEach(t => all.add(t.toLowerCase()))
    notes.forEach((note) => {
      if (note.tags) {
        note.tags.forEach((t) => all.add(t.toLowerCase()))
      }
    })
    return Array.from(all)
  }, [apiTags, notes])

  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl + K to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const [token, setToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    const activeToken = getAccessToken()
    setToken(activeToken)
    setCurrentUser(getStoredAuthUser())
  }, [])

  // Load Starred ids from local storage
  React.useEffect(() => {
    const stored = localStorage.getItem("starred_note_ids")
    if (stored) {
      try {
        setStarredIds(JSON.parse(stored) as string[])
      } catch {
        // ignore
      }
    }
  }, [])

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem("starred_note_ids", JSON.stringify(next))
      return next
    })
  }

  const loadNotes = React.useCallback(async () => {
    if (!token) {
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để quản lý ghi chú.")
      setNotes([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [data, tagsData] = await Promise.all([
        listNotes(token),
        listTags(token)
      ])
      setNotes(data)
      setApiTags(tagsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ghi chú")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  // Automatically select the first note on mount
  React.useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0])
    }
  }, [notes, selectedNote])

  // Sync draft states when selected note changes
  React.useEffect(() => {
    if (selectedNote) {
      setDraftTitle(selectedNote.title)
      setDraftContent(selectedNote.content ?? "")
      setDraftTags(selectedNote.tags ?? [])
    } else {
      setDraftTitle("")
      setDraftContent("")
      setDraftTags([])
    }
  }, [selectedNote])

  // Filter notes computed based on Tab, Category and Search
  const displayNotes = React.useMemo(() => {
    let list = notes
    if (activeTab === "favorites") {
      list = notes.filter((n) => starredIds.includes(n.id))
    } else if (activeTab === "trash") {
      return [] // Trash list is empty by default
    } else if (activeTab === "archive") {
      list = notes.filter((n) => {
        if (n.tags && n.tags.length > 0) {
          return n.tags.some(t => t.toLowerCase() === "archive" || t.toLowerCase() === "ghi chú")
        }
        return getNoteTag(n.title, n.content).name === "Ghi chú"
      })
    }

    if (activeTab === "all" && selectedCategory !== "All") {
      list = list.filter((n) => {
        const cleanCat = selectedCategory.toLowerCase()
        if (n.tags && n.tags.length > 0) {
          return n.tags.some((t) => {
            const cleanT = t.toLowerCase()
            if (selectedCategory === "Work") return cleanT === "work" || cleanT === "urgent" || cleanT === "công việc" || cleanT === "học tập" || cleanT === "study"
            if (selectedCategory === "Personal") return cleanT === "personal" || cleanT === "cá nhân"
            if (selectedCategory === "Ideas") return cleanT === "ideas" || cleanT === "idea" || cleanT === "ý tưởng"
            if (selectedCategory === "Archive") return cleanT === "archive" || cleanT === "ghi chú"
            return cleanT === cleanCat
          })
        }
        const tag = getNoteTag(n.title, n.content).name.toLowerCase()
        if (selectedCategory === "Work") return tag === "công việc" || tag === "học tập"
        if (selectedCategory === "Personal") return tag === "cá nhân"
        if (selectedCategory === "Ideas") return tag === "ý tưởng"
        if (selectedCategory === "Archive") return tag === "ghi chú"
        return tag === cleanCat
      })
    }

    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter((n) => 
        n.title.toLowerCase().includes(term) ||
        (n.content ?? "").toLowerCase().includes(term) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(term)))
      )
    }

    return list
  }, [notes, activeTab, selectedCategory, search, starredIds])

  function openCreateDialog() {
    setEditingNote(null)
    setTitle("")
    setContent("")
    setTags([])
    setTagInput("")
    setDialogOpen(true)
  }

  function openEditDialog(note: Note) {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content ?? "")
    setTags(note.tags ?? [])
    setTagInput("")
    setDialogOpen(true)
  }

  async function handleSubmitNote(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError("Bạn chưa đăng nhập"); return }
    setIsSaving(true)
    setError(null)
    try {
      if (editingNote) {
        const updated = await updateNote(token, editingNote.id, { title, content, tags })
        setNotes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        if (selectedNote?.id === updated.id) {
          setSelectedNote(updated)
        }
      } else {
        const created = await createNote(token, { title, content, tags })
        setNotes((prev) => [created, ...prev])
        setSelectedNote(created) // auto-select new note
      }
      setDialogOpen(false)
      setTitle("")
      setContent("")
      setTags([])
      setTagInput("")
      setEditingNote(null)
      // Refresh apiTags list in background
      listTags(token).then(setApiTags).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu ghi chú thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteNote(id: string) {
    if (!token) { setError("Bạn chưa đăng nhập"); return }
    try {
      await deleteNote(token, id)
      setNotes((prev) => prev.filter((item) => item.id !== id))
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa ghi chú thất bại")
    }
  }

  async function handleSaveChanges() {
    if (!selectedNote || !token) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateNote(token, selectedNote.id, { 
        title: draftTitle, 
        content: draftContent,
        tags: draftTags
      })
      setNotes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedNote(updated)
      // Refresh apiTags list in background
      listTags(token).then(setApiTags).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thay đổi")
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogout() {
    clearAuthSession()
    window.location.href = "/login"
  }

  const hasChanges = selectedNote && (
    draftTitle !== selectedNote.title || 
    draftContent !== (selectedNote.content ?? "") ||
    JSON.stringify(draftTags) !== JSON.stringify(selectedNote.tags ?? [])
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f9fb] dark:bg-neutral-950 font-sans select-none">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-full w-[280px] bg-[#f2f4f6] dark:bg-neutral-900 py-8 shrink-0 border-r border-[#eceef0] dark:border-neutral-800">
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-bold text-[#4648d4] tracking-tight">ZenNotes</h1>
          <p className="text-xs text-[#464554] dark:text-neutral-400 mt-1">Ahihi đồ ngốc</p>
        </div>
        
        {/* Create Note Button */}
        <div className="px-4 mb-8">
          <button 
            onClick={openCreateDialog}
            className="w-full flex items-center justify-center gap-2 bg-[#4648d4] text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-[#6063ee] transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-md shadow-indigo-100 dark:shadow-none"
          >
            <PlusIcon className="h-4.5 w-4.5" />
            New Note
          </button>
        </div>
        
        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          <div 
            onClick={() => { setActiveTab("all"); setSelectedCategory("All"); }}
            className={`flex items-center gap-3 px-6 py-3 font-medium text-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] ${activeTab === "all" ? "text-[#4648d4] bg-white dark:bg-neutral-800 border-[#4648d4]" : "text-[#464554] dark:text-neutral-400 border-transparent hover:bg-[#eceef0] dark:hover:bg-neutral-850"}`}
          >
            <NotebookIcon className="h-4.5 w-4.5" />
            <span>All Notes</span>
          </div>
          
          <div 
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-3 px-6 py-3 font-medium text-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] ${activeTab === "favorites" ? "text-[#4648d4] bg-white dark:bg-neutral-800 border-[#4648d4]" : "text-[#464554] dark:text-neutral-400 border-transparent hover:bg-[#eceef0] dark:hover:bg-neutral-850"}`}
          >
            <StarIcon className="h-4.5 w-4.5" />
            <span>Favorites</span>
          </div>
          
          <div 
            onClick={() => setActiveTab("trash")}
            className={`flex items-center gap-3 px-6 py-3 font-medium text-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] ${activeTab === "trash" ? "text-[#4648d4] bg-white dark:bg-neutral-800 border-[#4648d4]" : "text-[#464554] dark:text-neutral-400 border-transparent hover:bg-[#eceef0] dark:hover:bg-neutral-850"}`}
          >
            <Trash2Icon className="h-4.5 w-4.5" />
            <span>Trash</span>
          </div>
        </nav>
        
        {/* Sidebar Footer / Library */}
        <div className="mt-auto space-y-1">
          <div className="px-6 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#767586] dark:text-neutral-500">Library</span>
          </div>
          
          <div 
            onClick={() => setActiveTab("archive")}
            className={`flex items-center gap-3 px-6 py-3 font-medium text-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] ${activeTab === "archive" ? "text-[#4648d4] bg-white dark:bg-neutral-800 border-[#4648d4]" : "text-[#464554] dark:text-neutral-400 border-transparent hover:bg-[#eceef0] dark:hover:bg-neutral-850"}`}
          >
            <ArchiveIcon className="h-4.5 w-4.5" />
            <span>Archive</span>
          </div>
          
          <UserMenu user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </aside>

      {/* Main Content Workspace: Settings or Notes List + Editor */}
      {activeTab === "settings" ? (
        <SettingsWorkspace 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          token={token} 
        />
      ) : (
        <>
          {/* Main Middle Column: Note List */}
          <main className="flex-1 flex flex-col bg-[#f7f9fb] dark:bg-neutral-950 min-w-0 h-full overflow-hidden border-r border-[#eceef0] dark:border-neutral-800">
        
        {/* Header Search & Greeting */}
        <header className="p-6 space-y-4 border-b border-[#eceef0] dark:border-neutral-800 bg-[#f7f9fb]/50 dark:bg-neutral-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#191c1e] dark:text-white flex items-center gap-1.5">
                Xin chào, {currentUser?.fullName ?? "bạn"}
                <span className="inline-block animate-wave origin-[70%_70%] select-none"></span>
              </h2>
              <p className="text-xs text-[#464554] dark:text-neutral-400">
                {activeTab === "favorites" ? "Ghi chú yêu thích của bạn" : activeTab === "trash" ? "Thùng rác ghi chú" : activeTab === "archive" ? "Kho lưu trữ ghi chú" : "Hôm nay bạn muốn ghi chú gì?"}
              </p>
            </div>
            
            <Button variant="ghost" size="icon" className="relative rounded-xl md:hidden text-slate-400 hover:text-slate-600">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#4648d4] animate-pulse" />
            </Button>
          </div>

          {/* Search bar input */}
          <div className="relative group">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4648d4] transition-colors h-4 w-4" />
            <input 
              ref={searchInputRef}
              type="text" 
              className="w-full bg-[#f2f4f6] dark:bg-neutral-900 border-none rounded-xl py-3 pl-11 pr-12 focus:ring-2 focus:ring-[#4648d4]/20 outline-hidden font-medium text-sm text-[#191c1e] dark:text-white placeholder:text-[#767586] transition-all"
              placeholder="Tìm kiếm ghi chú của bạn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center gap-0.5">
              <kbd className="h-5 px-1.5 rounded-md border border-slate-200/50 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 text-[10px] font-semibold text-slate-400">Ctrl</kbd>
              <kbd className="h-5 px-1.5 rounded-md border border-slate-200/50 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 text-[10px] font-semibold text-slate-400">K</kbd>
            </div>
          </div>

          {/* Filter Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            <button 
              onClick={() => { setActiveTab("all"); setSelectedCategory("All"); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide cursor-pointer transition-all duration-200 shrink-0 ${selectedCategory === "All" ? "bg-[#4648d4] text-white" : "bg-[#eceef0] dark:bg-neutral-900 text-[#464554] dark:text-neutral-350 hover:bg-[#c0c1ff]/30 dark:hover:bg-neutral-800"}`}
            >
              Tất cả
            </button>
            
            {systemTags.length > 0 ? (
              systemTags.map((tag) => {
                const isActive = selectedCategory.toLowerCase() === tag.toLowerCase()
                return (
                  <button 
                    key={tag}
                    onClick={() => { setActiveTab("all"); setSelectedCategory(tag); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide cursor-pointer transition-all duration-200 shrink-0 ${isActive ? "bg-[#4648d4] text-white" : "bg-[#eceef0] dark:bg-neutral-900 text-[#464554] dark:text-neutral-350 hover:bg-[#c0c1ff]/30 dark:hover:bg-neutral-800"}`}
                  >
                    #{tag}
                  </button>
                )
              })
            ) : (
              (["Work", "Personal", "Ideas"] as const).map((cat) => {
                const isActive = selectedCategory === cat
                return (
                  <button 
                    key={cat}
                    onClick={() => { setActiveTab("all"); setSelectedCategory(cat); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide cursor-pointer transition-all duration-200 shrink-0 ${isActive ? "bg-[#4648d4] text-white" : "bg-[#eceef0] dark:bg-neutral-900 text-[#464554] dark:text-neutral-350 hover:bg-[#c0c1ff]/30 dark:hover:bg-neutral-800"}`}
                  >
                    {cat === "Work" ? "Công việc" : cat === "Personal" ? "Cá nhân" : "Ý tưởng"}
                  </button>
                )
              })
            )}
          </div>
        </header>

        {/* Scrollable Note Cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          
          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-xs font-medium text-red-600 flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="whitespace-pre-line leading-relaxed">{error}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2Icon className="h-6 w-6 animate-spin text-[#4648d4]" />
              <span className="text-xs font-medium tracking-wide">Đang tải ghi chú của bạn...</span>
            </div>
          ) : null}

          {!isLoading && displayNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/30 dark:bg-neutral-900/10 p-6">
              <div className="bg-slate-100 dark:bg-neutral-800 p-4 rounded-2xl text-slate-400 mb-3 shadow-xs">
                <NotebookIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">Không tìm thấy ghi chú nào</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
                {search.trim() ? "Thử đổi từ khóa khác." : "Hãy bắt đầu tạo ghi chú đầu tiên của bạn!"}
              </p>
            </div>
          ) : null}

          {displayNotes.map((note) => {
            const isSelected = selectedNote?.id === note.id
            const dateLabel = formatNoteDate(note.updatedAt)
            const tag = getNoteTag(note.title, note.content)
            const isStarred = starredIds.includes(note.id)

            return (
              <div 
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-6 transition-all duration-200 rounded-xl cursor-pointer group border flex flex-col justify-between ${isSelected ? "bg-[#eceef0] dark:bg-neutral-800/80 border-[#4648d4] shadow-xs" : "bg-white dark:bg-neutral-900/40 border-transparent hover:bg-[#f2f4f6] dark:hover:bg-neutral-900/80"}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-base text-[#191c1e] dark:text-white leading-tight line-clamp-1 flex-1 pr-2">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isStarred && (
                        <StarIcon className="h-3.5 w-3.5 fill-[#4648d4] text-[#4648d4] shrink-0" />
                      )}
                      <span className="text-[11px] text-[#767586] dark:text-neutral-500 shrink-0 font-medium">{dateLabel}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-[#464554] dark:text-neutral-450 line-clamp-2 leading-relaxed">
                    {stripHtml(note.content || "") || <em className="text-slate-400 dark:text-slate-600 font-normal select-none">(Không có nội dung)</em>}
                  </p>
                </div>
                
                <div className="mt-4 flex gap-2 justify-between items-center shrink-0">
                  {note.tags && note.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[70%]">
                      {note.tags.map((t) => (
                        <span 
                          key={t} 
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-[#4648d4] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 shrink-0 line-clamp-1"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      tag.name === "Cá nhân" ? "bg-[#86f2e4]/30 text-[#006f66]" :
                      tag.name === "Ý tưởng" ? "bg-[#ffdcc5] text-[#703700]" :
                      tag.name === "Công việc" || tag.name === "Học tập" ? "bg-[#e1e0ff] text-[#2f2ebe]" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {tag.name}
                    </span>
                  )}
                  
                  {/* Inline Action buttons on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStar(note.id); }}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-[#4648d4]"
                      aria-label="Star note"
                    >
                      <StarIcon className={`h-3.5 w-3.5 ${isStarred ? "fill-[#4648d4] text-[#4648d4]" : ""}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditDialog(note); }}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-700"
                      aria-label="Edit note dialog"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-rose-600"
                      aria-label="Delete note"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Right Column: Content Viewer / Editor */}
      <section className="hidden lg:flex flex-col w-[45%] bg-white dark:bg-neutral-900/10 shrink-0 h-full overflow-hidden">
        
        {/* Editor Toolbar */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#eceef0] dark:border-neutral-800 shrink-0 bg-white dark:bg-transparent">
          <div className="flex gap-4">
            <button className="text-[#464554] dark:text-neutral-400 hover:text-[#4648d4] transition-colors cursor-pointer" aria-label="Text format">
              <TypeIcon className="h-4.5 w-4.5" />
            </button>
            <button className="text-[#464554] dark:text-neutral-400 hover:text-[#4648d4] transition-colors cursor-pointer" aria-label="Attach file">
              <PaperclipIcon className="h-4.5 w-4.5" />
            </button>
            <button className="text-[#464554] dark:text-neutral-400 hover:text-[#4648d4] transition-colors cursor-pointer" aria-label="Insert image">
              <ImageIcon className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="flex gap-4">
            <button className="text-[#464554] dark:text-neutral-400 hover:text-[#4648d4] transition-colors cursor-pointer" aria-label="Share">
              <Share2Icon className="h-4.5 w-4.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[#464554] dark:text-neutral-400 hover:text-[#4648d4] transition-colors cursor-pointer" aria-label="More actions">
                  <MoreVerticalIcon className="h-4.5 w-4.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {selectedNote && (
                  <>
                    <DropdownMenuItem onClick={() => toggleStar(selectedNote.id)} className="cursor-pointer">
                      <StarIcon className="h-3.5 w-3.5 mr-2" />
                      {starredIds.includes(selectedNote.id) ? "Bỏ yêu thích" : "Yêu thích"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(selectedNote)} className="cursor-pointer">
                      <PencilIcon className="h-3.5 w-3.5 mr-2" />
                      Sửa nâng cao
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteNote(selectedNote.id)} className="text-rose-600 focus:text-rose-600 cursor-pointer">
                      <Trash2Icon className="h-3.5 w-3.5 mr-2" />
                      Xóa ghi chú
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden h-full w-full bg-white dark:bg-transparent flex flex-col">
          {!selectedNote ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 select-none">
              <FilesIcon className="h-[64px] w-[64px] text-slate-400" />
              <p className="text-sm font-semibold text-[#191c1e] dark:text-neutral-350">Chọn một ghi chú để xem chi tiết</p>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              
              {/* Note Header Title Input */}
              <div className="p-8 pb-3 border-b border-[#eceef0]/60 dark:border-neutral-800/40 shrink-0">
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    getNoteTag(draftTitle, draftContent).name === "Cá nhân" ? "bg-[#86f2e4]/30 text-[#006f66]" :
                    getNoteTag(draftTitle, draftContent).name === "Ý tưởng" ? "bg-[#ffdcc5] text-[#703700]" :
                    getNoteTag(draftTitle, draftContent).name === "Công việc" || getNoteTag(draftTitle, draftContent).name === "Học tập" ? "bg-[#e1e0ff] text-[#2f2ebe]" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {getNoteTag(draftTitle, draftContent).name}
                  </span>
                  
                  {/* Floating Save indicator or Save Button */}
                  {hasChanges ? (
                    <Button 
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="h-8 rounded-lg bg-[#4648d4] hover:bg-[#6063ee] text-white text-xs font-semibold px-4 flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer active:scale-95 border-none"
                    >
                      {isSaving ? (
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                      ) : (
                        <SparklesIcon className="h-3 w-3" />
                      )}
                      Lưu thay đổi
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Đã đồng bộ
                    </span>
                  )}
                </div>
                
                {/* Borderless Title */}
                <input 
                  type="text"
                  className="w-full bg-transparent border-none text-2xl font-bold text-[#191c1e] dark:text-white outline-hidden p-0 focus:ring-0 placeholder:text-slate-300 placeholder:font-bold"
                  placeholder="Không có tiêu đề"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
                
                       {/* Tag Manager in Right Detail Panel */}
                <div className="mt-4 flex flex-col gap-1.5 shrink-0">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 select-none mr-1">Hashtags:</span>
                    {draftTags.length === 0 ? (
                      <span className="text-xs text-slate-400 dark:text-neutral-500 italic select-none">Chưa chọn tag</span>
                    ) : (
                      draftTags.map((t, idx) => (
                        <span 
                          key={t} 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-[#4648d4] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setDraftTags(draftTags.filter((_, i) => i !== idx))}
                            className="hover:text-rose-500 dark:hover:text-rose-450 bg-transparent border-none p-0 cursor-pointer font-bold leading-none text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Available Tag Pills in Right Panel */}
                  {systemTags.filter(t => !draftTags.includes(t)).length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5 items-center w-full">
                      <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none mr-1">Tag có sẵn:</span>
                      {systemTags.filter(t => !draftTags.includes(t)).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraftTags([...draftTags, t])}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 hover:bg-indigo-50 hover:text-[#4648d4] dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 text-slate-600 dark:text-neutral-350 cursor-pointer transition-colors border-none"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-[9px] text-slate-400 dark:text-neutral-500 font-semibold italic">Đã chọn hết tag có sẵn!</div>
                  )}
                </div>
              </div>
              
              {/* Rich Text Editor */}
              <div className="flex-1 px-8 pb-8 pt-4 overflow-hidden flex flex-col panel-editor-container">
                <CKEditorCDN
                  value={draftContent}
                  onChange={setDraftContent}
                />
              </div>
            </div>
          )}
        </div>
      </section>
        </>
      )}

      {/* Mobile Navigation Shell BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 flex justify-around items-center h-16 border-t border-[#eceef0] dark:border-neutral-800 px-6 z-50">
        <button 
          onClick={() => { setActiveTab("all"); setSelectedCategory("All"); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${activeTab === "all" ? "text-[#4648d4]" : "text-[#464554] dark:text-neutral-400"}`}
        >
          <NotebookIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Notes</span>
        </button>
        
        <button 
          onClick={() => searchInputRef.current?.focus()}
          className="flex flex-col items-center justify-center gap-1 text-[#464554] dark:text-neutral-400 cursor-pointer"
        >
          <SearchIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </button>
        
        {/* Floating Mobile Add Button */}
        <button 
          onClick={openCreateDialog}
          className="flex flex-col items-center justify-center -mt-8 bg-[#4648d4] text-white w-12 h-12 rounded-full shadow-lg hover:bg-[#6063ee] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        
        <button 
          onClick={() => setActiveTab("favorites")}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${activeTab === "favorites" ? "text-[#4648d4]" : "text-[#464554] dark:text-neutral-400"}`}
        >
          <StarIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Starred</span>
        </button>
        
        {/* Trigger settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${activeTab === "settings" ? "text-[#4648d4]" : "text-[#464554] dark:text-neutral-400"}`}
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl">
            <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200">Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-neutral-800" />
            <DropdownMenuItem 
              onClick={() => setActiveTab("settings")} 
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-neutral-800" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors focus:text-rose-600 focus:bg-rose-50 dark:focus:text-rose-450 dark:focus:bg-rose-950/20"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Editor Advanced Popup Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[640px] w-[95vw] p-6 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-[#4648d4]" />
              {editingNote ? "Chỉnh sửa ghi chú" : "Tạo ghi chú mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Nhập tiêu đề và nội dung để lưu trữ ghi chú. Ghi chú sẽ tự động được phân loại dựa trên nội dung bạn viết!
            </DialogDescription>
          </DialogHeader>
          
          <form className="flex-grow flex flex-col overflow-hidden mt-3" onSubmit={handleSubmitNote}>
            {/* Scrollable Form Fields Body */}
            <div className="flex-grow overflow-y-auto pr-1.5 flex flex-col gap-4.5 min-h-0 mb-3">
              <div className="grid gap-1.5 shrink-0">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="note-title">Tiêu đề</label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  className="h-10.5 rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-[#4648d4]/20 focus-visible:border-[#4648d4] transition-all duration-200 placeholder:text-slate-400"
                  placeholder="Ví dụ: Thiết kế giao diện mới"
                />
              </div>

              {/* Tag Manager in Dialog */}
              <div className="grid gap-1.5 shrink-0">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hashtags (Chọn từ danh sách có sẵn dưới đây)</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50/50 dark:bg-neutral-850/40 border border-slate-150 dark:border-neutral-800/80 rounded-xl min-h-[44px] items-center">
                  {tags.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-neutral-500 italic select-none">Chưa chọn tag nào</span>
                  ) : (
                    tags.map((t, idx) => (
                      <span 
                        key={t} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-[#4648d4] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                          className="hover:text-rose-500 dark:hover:text-rose-450 bg-transparent border-none p-0 cursor-pointer font-bold leading-none text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Available Tag Pills Quick Select */}
                {systemTags.filter(t => !tags.includes(t)).length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider mr-1 select-none">Tag có sẵn:</span>
                    {systemTags.filter(t => !tags.includes(t)).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags([...tags, t])}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-neutral-800 hover:bg-indigo-50 hover:text-[#4648d4] dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 text-slate-650 dark:text-neutral-350 cursor-pointer transition-colors border-none"
                      >
                        +{t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1.5 text-[10px] text-slate-400 dark:text-neutral-500 font-semibold italic">Đã chọn hết tất cả tag có sẵn!</div>
                )}
              </div>
              
              <div className="flex-grow min-h-0 flex flex-col gap-1.5 overflow-hidden dialog-editor-container">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nội dung</label>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <CKEditorCDN
                    value={content}
                    onChange={setContent}
                  />
                </div>
              </div>
            </div>
            
            {/* Sticky Footer always pinned at bottom */}
            <DialogFooter className="flex items-center gap-2 justify-end sm:space-x-0 shrink-0 border-t border-slate-100 dark:border-neutral-800/80 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-neutral-850 cursor-pointer">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl px-5 bg-[#4648d4] hover:bg-[#6063ee] text-white text-xs font-semibold shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer border-none">
                {isSaving ? "Đang lưu..." : "Lưu ghi chú"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// User Menu Sidebar bottom component
function UserMenu({ 
  user, 
  activeTab, 
  setActiveTab 
}: { 
  user: AuthUser | null
  activeTab: string
  setActiveTab: (tab: "all" | "favorites" | "trash" | "archive" | "settings") => void
}) {
  const initials = user?.fullName
    ? user.fullName.split(" ").filter(Boolean).slice(-2).map((w) => w[0].toUpperCase()).join("")
    : "?"

  function handleLogout() {
    clearAuthSession()
    window.location.href = "/login"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className={`flex items-center justify-between px-6 py-3 font-semibold text-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] shrink-0 select-none ${activeTab === "settings" ? "text-[#4648d4] bg-white dark:bg-neutral-850 border-[#4648d4]" : "text-[#464554] dark:text-neutral-400 border-transparent hover:bg-[#eceef0] dark:hover:bg-neutral-850"}`}
        >
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-4.5 w-4.5" />
            <span>Settings</span>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-[#4648d4] text-white text-[9px] font-bold select-none">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl">
        <DropdownMenuLabel className="px-2.5 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.fullName ?? "Người dùng"}</span>
            <span className="text-xs text-muted-foreground/80 mt-0.5">{user?.email ?? ""}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-neutral-800" />
        
        <DropdownMenuItem 
          onClick={() => setActiveTab("settings")}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
        >
          <UserIcon className="h-3.5 w-3.5" />
          Hồ sơ cá nhân
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-neutral-800" />
        <DropdownMenuItem
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors focus:text-rose-600 focus:bg-rose-50 dark:focus:text-rose-450 dark:focus:bg-rose-950/20"
          onClick={handleLogout}
        >
          <LogOutIcon className="h-3.5 w-3.5" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SettingsWorkspaceProps {
  currentUser: AuthUser | null
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
  token: string | null
}

function SettingsWorkspace({ currentUser, setCurrentUser, token }: SettingsWorkspaceProps) {
  const [subTab, setSubTab] = React.useState<"profile" | "password">("profile")
  
  // Profile settings state
  const [fullName, setFullName] = React.useState(currentUser?.fullName ?? "")
  const [profileSaving, setProfileSaving] = React.useState(false)
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password settings state
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordSaving, setPasswordSaving] = React.useState(false)
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Sync fullName input with currentUser when loaded
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName)
    }
  }, [currentUser])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const updated = await updateProfile(token, fullName)
      setCurrentUser(updated)
      setProfileMsg({ type: "success", text: "Cập nhật họ tên thành công!" })
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại." })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!oldPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Vui lòng nhập mật khẩu hiện tại!" })
      return
    }
    if (!newPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Vui lòng nhập mật khẩu mới!" })
      return
    }
    if (!confirmPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Vui lòng xác nhận mật khẩu mới!" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không khớp!" })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải từ 6 ký tự trở lên!" })
      return
    }
    if (!token) return
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      await changePassword(token, { oldPassword, newPassword })
      setPasswordMsg({ type: "success", text: "Thay đổi mật khẩu thành công!" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Mật khẩu hiện tại không chính xác." })
    } finally {
      setPasswordSaving(false)
    }
  }

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(" ").filter(Boolean).slice(-2).map((w) => w[0].toUpperCase()).join("")
    : "?"

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f7f9fb] dark:bg-neutral-950 overflow-hidden">
      {/* Settings Header */}
      <header className="p-8 border-b border-[#eceef0] dark:border-neutral-800 bg-[#f7f9fb]/50 dark:bg-neutral-950/50 backdrop-blur-md shrink-0">
        <h1 className="text-2xl font-bold text-[#191c1e] dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-[#4648d4]" />
          Cài đặt hệ thống
        </h1>
        <p className="text-xs text-[#464554] dark:text-neutral-450 mt-1">
          Quản lý thông tin hồ sơ cá nhân và thiết lập mật khẩu bảo mật tài khoản ZenNotes
        </p>
      </header>

      {/* Settings Container Workspace */}
      <div className="flex-1 flex overflow-hidden p-8 max-w-5xl w-full mx-auto gap-8">
        
        {/* Sub-navigation Menu left side */}
        <div className="w-[240px] shrink-0 space-y-1">
          <button 
            onClick={() => setSubTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-150 ${subTab === "profile" ? "bg-[#4648d4] text-white shadow-md shadow-indigo-100 dark:shadow-none" : "text-[#464554] dark:text-neutral-400 hover:bg-[#eceef0] dark:hover:bg-neutral-900"}`}
          >
            <UserIcon className="h-4.5 w-4.5" />
            Thông tin cá nhân
          </button>
          <button 
            onClick={() => setSubTab("password")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-150 ${subTab === "password" ? "bg-[#4648d4] text-white shadow-md shadow-indigo-100 dark:shadow-none" : "text-[#464554] dark:text-neutral-400 hover:bg-[#eceef0] dark:hover:bg-neutral-900"}`}
          >
            <Lock className="h-4.5 w-4.5" />
            Đổi mật khẩu
          </button>
        </div>

        {/* Settings Form panel right side */}
        <div className="flex-1 bg-white dark:bg-neutral-900/40 rounded-2xl border border-slate-100 dark:border-neutral-800 p-8 overflow-y-auto custom-scrollbar shadow-xs">
          
          {subTab === "profile" ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <UserIcon className="h-5 w-5 text-[#4648d4]" />
                  Quản lý hồ sơ cá nhân
                </h3>
                <p className="text-xs text-slate-500">Xem và cập nhật các thông tin cơ bản trên tài khoản của bạn</p>
              </div>

              {profileMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${profileMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"}`}>
                  {profileMsg.type === "success" ? <ShieldCheck className="h-4.5 w-4.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Avatar visual view */}
              <div className="flex items-center gap-4.5 p-4 rounded-xl bg-slate-50/50 dark:bg-neutral-900/20 border border-slate-100/50 dark:border-neutral-800/50">
                <div className="relative group select-none">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-100 dark:shadow-none">
                    {initials}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{currentUser?.fullName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thành viên ZenNotes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="profile-email">Địa chỉ Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    value={currentUser?.email ?? ""}
                    className="h-10.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/30 px-3.5 py-2.5 text-sm text-slate-400 outline-hidden cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400">Địa chỉ email đăng ký tài khoản không thể chỉnh sửa.</p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="profile-name">Họ và tên</label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-transparent px-3.5 py-2.5 text-sm outline-hidden focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all placeholder:text-slate-400"
                    placeholder="Nhập họ tên mới của bạn..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={profileSaving || !fullName.trim()}
                  className="rounded-xl px-5 bg-[#4648d4] hover:bg-[#6063ee] text-white text-xs font-semibold shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer border-none flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {profileSaving && <Loader2Icon className="h-3 w-3 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <Lock className="h-5 w-5 text-[#4648d4]" />
                  Bảo mật tài khoản
                </h3>
                <p className="text-xs text-slate-500">Đổi mật khẩu tài khoản của bạn để duy trì bảo mật cao nhất</p>
              </div>

              {passwordMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${passwordMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"}`}>
                  {passwordMsg.type === "success" ? <ShieldCheck className="h-4.5 w-4.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="old-pass">Mật khẩu hiện tại</label>
                  <input
                    id="old-pass"
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-10.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-transparent px-3.5 py-2.5 text-sm outline-hidden focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="new-pass">Mật khẩu mới</label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-transparent px-3.5 py-2.5 text-sm outline-hidden focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all placeholder:text-slate-400"
                    placeholder="Tối thiểu 6 ký tự..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="confirm-pass">Xác nhận mật khẩu mới</label>
                  <input
                    id="confirm-pass"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-transparent px-3.5 py-2.5 text-sm outline-hidden focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 transition-all placeholder:text-slate-400"
                    placeholder="Nhập lại mật khẩu mới..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={passwordSaving}
                  className="rounded-xl px-5 bg-[#4648d4] hover:bg-[#6063ee] text-white text-xs font-semibold shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer border-none flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {passwordSaving && <Loader2Icon className="h-3 w-3 animate-spin" />}
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}