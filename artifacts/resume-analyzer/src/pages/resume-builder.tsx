import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import {
  Send, Bot, User, Download, FileText, Loader2,
  RefreshCw, Lock, Pencil, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const N8N_WEBHOOK =
  "https://ahmed11ali.app.n8n.cloud/webhook/952cdd26-1852-4ba8-9a3c-0bd2c7e85f5e";
const PROXY_URL = "/api/n8n-proxy";

type Role = "assistant" | "user";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function NameEntryScreen({
  onConfirm,
  saving,
}: {
  onConfirm: (name: string) => void;
  saving: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const fn = firstName.trim();
    const ln = lastName.trim();

    if (!fn) { setError("أدخل الاسم الأول"); return; }
    if (!ln) { setError("أدخل اسم الأب"); return; }
    if (/\s/.test(fn)) { setError("الاسم الأول كلمة واحدة فقط"); return; }
    if (/\s/.test(ln)) { setError("اسم الأب كلمة واحدة فقط"); return; }

    setError("");
    onConfirm(`${fn} ${ln}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-8 py-10">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <FileText className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">منشئ السيرة الذاتية</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          أدخل اسمك الثنائي (اسمان فقط) قبل البدء.<br />
          <span className="font-medium text-foreground">لن تتمكن من تغييره لاحقاً بدون دفع.</span>
        </p>
      </div>
      <div className="w-full space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground text-start block">الاسم الأول</label>
            <Input
              placeholder="أحمد"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(""); }}
              dir="rtl"
              className="text-center text-base font-semibold h-12"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground text-start block">اسم الأب</label>
            <Input
              placeholder="عبدالله"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(""); }}
              dir="rtl"
              className="text-center text-base font-semibold h-12"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        {(firstName.trim() || lastName.trim()) && (
          <div className="px-4 py-3 rounded-lg bg-muted/60 border text-sm font-semibold text-foreground">
            {firstName.trim()} {lastName.trim()}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />جارٍ الحفظ...</> : <>تأكيد الاسم والبدء</>}
        </Button>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          يُحفظ الاسم مرة واحدة فقط — لا يمكن تغييره بدون دفع
        </p>
      </div>
    </div>
  );
}

function LockedNameBadge({ name, onChangeRequest }: { name: string; onChangeRequest: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 font-semibold text-sm">
        <Lock className="h-3.5 w-3.5 text-primary" />
        {name}
      </Badge>
      <button
        onClick={onChangeRequest}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        title="تغيير الاسم (يتطلب دفعاً)"
      >
        <Pencil className="h-3 w-3" />
        تغيير
      </button>
    </div>
  );
}

export default function ResumeBuilder() {
  const { userProfile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const [lockedName, setLockedName] = useState<string | null>(userProfile?.resumeName ?? null);
  const [savingName, setSavingName] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [downloadInfo, setDownloadInfo] = useState<{ url: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (userProfile?.resumeName && !lockedName) {
      setLockedName(userProfile.resumeName);
    }
  }, [userProfile?.resumeName]);

  useEffect(() => {
    if (lockedName && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `مرحباً ${lockedName}! 🎯\n\nسأساعدك خطوة بخطوة في بناء سيرتك الذاتية الاحترافية.\n\nابدأ بإخباري عن مجالك الوظيفي أو آخر وظيفة عملت بها.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [lockedName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNameConfirm = async (name: string) => {
    if (!userProfile?.id) return;
    setSavingName(true);
    try {
      await api.users.updateMe({ resumeName: name });
      await refreshProfile();
      setLockedName(name);
    } catch (e: any) {
      console.error("Failed to save resume name", e);
    } finally {
      setSavingName(false);
    }
  };

  const handleNameChangeRequest = () => {
    navigate("/upgrade");
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        session_id: sessionId,
        user_name: lockedName ?? userProfile?.name ?? "",
        message: text,
        history: conversationHistory,
      };

      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ webhook_url: N8N_WEBHOOK, ...payload }),
      });

      if (!res.ok) throw new Error(`خطأ في الاتصال: ${res.status}`);

      const data = await res.json();

      let replyText = "";
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (data?.type === "file" && data?.base64) {
        const blob = base64ToBlob(data.base64, data.mimeType ?? "application/pdf");
        fileUrl = URL.createObjectURL(blob);
        fileName = data.fileName ?? "resume.pdf";
        replyText = "✅ سيرتك الذاتية جاهزة! اضغط على زر التنزيل أدناه.";
      } else {
        const item = Array.isArray(data) ? data[0] : data;
        const inner =
          (item as any)?.output ??
          (item as any)?.json ??
          (item as any)?.message ??
          (item as any)?.reply ??
          (item as any)?.text ??
          item;

        if (typeof inner === "string") {
          replyText = inner;
        } else if (typeof inner === "object" && inner !== null) {
          const obj = inner as Record<string, unknown>;
          replyText =
            (obj.message as string) ??
            (obj.reply as string) ??
            (obj.text as string) ??
            (obj.content as string) ??
            (obj.response as string) ??
            "";

          if (obj.file_url || obj.fileUrl || obj.download_url || obj.pdf_url) {
            fileUrl = (obj.file_url ?? obj.fileUrl ?? obj.download_url ?? obj.pdf_url) as string;
            fileName = (obj.file_name ?? obj.fileName ?? "resume.pdf") as string;
          }
          if (obj.resume && typeof obj.resume === "string") {
            if (obj.resume.startsWith("http")) {
              fileUrl = obj.resume;
              fileName = "resume.pdf";
            } else if (obj.resume.length > 200) {
              const blob = base64ToBlob(obj.resume, "application/pdf");
              fileUrl = URL.createObjectURL(blob);
              fileName = "resume.pdf";
            }
          }
        }

        if (!replyText && !fileUrl) {
          replyText = "لم أتلقَّ رداً واضحاً. حاول مرة أخرى.";
        }
      }

      if (fileUrl) setDownloadInfo({ url: fileUrl, name: fileName ?? "resume.pdf" });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          fileUrl,
          fileName,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content: `⚠️ حدث خطأ: ${err.message ?? "تعذّر الاتصال بـ N8N"}. تأكد أن الـ webhook نشط وأعد المحاولة.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    if (!lockedName) return;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `مرحباً ${lockedName}! 🎯\n\nسأساعدك خطوة بخطوة في بناء سيرتك الذاتية الاحترافية.\n\nابدأ بإخباري عن مجالك الوظيفي أو آخر وظيفة عملت بها.`,
        timestamp: new Date(),
      },
    ]);
    setDownloadInfo(null);
    setInput("");
  };

  if (!lockedName) {
    return (
      <Layout>
        <NameEntryScreen onConfirm={handleNameConfirm} saving={savingName} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-7rem)] max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">منشئ السيرة الذاتية</h1>
              <LockedNameBadge name={lockedName} onChangeRequest={handleNameChangeRequest} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetChat} className="gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            محادثة جديدة
          </Button>
        </div>

        {downloadInfo && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <div className="font-semibold text-green-700 text-sm">سيرتك الذاتية جاهزة!</div>
                <div className="text-xs text-green-600">{downloadInfo.name}</div>
              </div>
            </div>
            <a href={downloadInfo.url} download={downloadInfo.name} target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                <Download className="h-4 w-4" />
                تنزيل
              </Button>
            </a>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-end gap-2 bg-background rounded-xl border shadow-sm p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (Enter للإرسال)"
              className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 min-h-[44px] max-h-[160px] text-sm"
              rows={1}
              disabled={isLoading}
              dir="auto"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-9 w-9 rounded-lg"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            اضغط Enter للإرسال • Shift+Enter لسطر جديد
          </p>
        </div>
      </div>
    </Layout>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 items-start", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border rounded-tl-sm"
        )}
        dir="auto"
      >
        {message.content}
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            download={message.fileName ?? "resume.pdf"}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-green-400 hover:text-green-300 underline text-xs"
          >
            <Download className="h-3 w-3" />
            {message.fileName ?? "تنزيل السيرة الذاتية"}
          </a>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-secondary-foreground" />
      </div>
      <div className="bg-background border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function base64ToBlob(base64: string, type: string): Blob {
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNums)], { type });
}
