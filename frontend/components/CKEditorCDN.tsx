"use client"

import * as React from "react"

interface CKEditorCDNProps {
  value: string
  onChange: (data: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function CKEditorCDN({
  value,
  onChange,
  disabled = false,
  placeholder = "Bắt đầu viết nội dung ghi chú tại đây..."
}: CKEditorCDNProps) {
  const editorRef = React.useRef<HTMLTextAreaElement>(null)
  const editorInstanceRef = React.useRef<any>(null)
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false)

  // 1. Tải CDN script động chỉ chạy phía client
  React.useEffect(() => {
    if ((window as any).ClassicEditor) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js"
    script.async = true
    script.onload = () => setIsScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      // Dọn dẹp script khi component unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // 2. Khởi tạo CKEditor 5 ClassicEditor
  React.useEffect(() => {
    if (!isScriptLoaded || !editorRef.current || editorInstanceRef.current) return

    const ClassicEditor = (window as any).ClassicEditor
    if (!ClassicEditor) return

    ClassicEditor.create(editorRef.current, {
      placeholder: placeholder,
      toolbar: [
        "heading", "|", 
        "bold", "italic", "underline", "strikethrough", "|",
        "bulletedList", "numberedList", "blockQuote", "|",
        "insertTable", "undo", "redo"
      ]
    })
      .then((editor: any) => {
        editorInstanceRef.current = editor
        
        // Gán giá trị ban đầu
        editor.setData(value)

        // Lắng nghe sự kiện thay đổi nội dung
        editor.model.document.on("change:data", () => {
          const data = editor.getData()
          onChange(data)
        })

        // Thiết lập trạng thái ReadOnly nếu có
        editor.enableReadOnlyMode("editor-lock")
        if (!disabled) {
          editor.disableReadOnlyMode("editor-lock")
        }
      })
      .catch((err: any) => {
        console.error("Lỗi khởi tạo CKEditor 5:", err)
      })

    return () => {
      // Hủy editor instance khi unmount để tránh rò rỉ bộ nhớ
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy()
          .then(() => {
            editorInstanceRef.current = null
          })
          .catch((err: any) => console.error("Lỗi hủy CKEditor:", err))
      }
    }
  }, [isScriptLoaded])

  // 3. Đồng bộ hóa dữ liệu ngoài vào Editor khi có thay đổi (chỉ khi giá trị khác biệt lớn)
  React.useEffect(() => {
    const editor = editorInstanceRef.current
    if (editor && value !== editor.getData()) {
      editor.setData(value)
    }
  }, [value])

  // 4. Đồng bộ trạng thái ReadOnly / Disabled
  React.useEffect(() => {
    const editor = editorInstanceRef.current
    if (editor) {
      if (disabled) {
        editor.enableReadOnlyMode("editor-lock")
      } else {
        editor.disableReadOnlyMode("editor-lock")
      }
    }
  }, [disabled])

  return (
    <div className="prose dark:prose-invert max-w-none w-full h-full flex flex-col min-h-[200px]">
      <textarea ref={editorRef} className="hidden" />
      {!isScriptLoaded && (
        <div className="flex items-center justify-center p-8 text-sm text-slate-400 gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Đang tải trình soạn thảo văn bản...
        </div>
      )}
    </div>
  )
}
