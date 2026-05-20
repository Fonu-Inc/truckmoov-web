import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageCircleQuestion,
  X,
  Send,
  Loader2,
  UserRound,
  CircleHelp,
  Headphones,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  MessagesSquare,
  Cpu,
  Signal,
  MessageSquareText,
  Wallet,
  Activity,
  ShieldCheck,
  Plus,
  Image as ImageIcon,
  Paperclip,
  Camera,
  FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useLiveAgentSession } from "@/hooks/useLiveAgentSession";
import { LiveAgentPanel } from "./LiveAgentPanel";

type Msg = { role: "user" | "assistant"; content: string };
type View = "home" | "topic" | "messages";
type Tab = "faqs" | "messages";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface FaqItem {
  question: string;
  answer: string;
}
interface Topic {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
  faqs: FaqItem[];
}

const TOPICS: Topic[] = [
  {
    id: "device",
    label: "Device installation & configuration",
    icon: Cpu,
    blurb: "Setup, IMEI registration, and getting trackers online.",
    faqs: [
      {
        question: "Device not showing online",
        answer:
          "1. Verify the SIM card is active and inserted correctly.\n2. Confirm the device has clear sky view for GPS lock.\n3. Check power wiring (red to constant 12V, black to ground).\n4. In Devices → select the IMEI → run **Test connectivity**. If still offline, escalate to a live agent." },
      {
        question: "How do I configure a new tracker?",
        answer:
          "Go to **Devices → Add Device**, enter the IMEI, select the model from the catalog, and assign a SIM. The platform sends the configuration SMS automatically. Status moves to **CONFIGURED** once acknowledged." },
      {
        question: "Where do I find the device IMEI?",
        answer:
          "The IMEI (15 digits) is printed on the sticker attached to the tracker housing and on the original packaging. You can also retrieve it by sending the SMS command `IMEI123456` to the SIM number." },
    ] },
  {
    id: "sim",
    label: "SIM connectivity",
    icon: Signal,
    blurb: "IoT SIM activation, data sessions, and APN issues.",
    faqs: [
      {
        question: "SIM stuck on 'Pending activation'",
        answer:
          "Activations usually complete within 15 minutes. If it has been longer, open **SIMs → select ICCID → Resync status**. Persistent failures indicate a KYC mismatch — submit the documents in **Compliance**." },
      {
        question: "No data session on the device",
        answer:
          "Confirm the APN is set to `mtnplatform.iot`. Check signal strength on the device dashboard — anything below 8/30 indicates poor coverage. Power-cycle the tracker and wait 90 seconds." },
      {
        question: "How do I check my SIM data usage?",
        answer:
          "Go to **SIMs → Analytics**. You'll see per-SIM data, SMS, and session counts for the last 30 days, plus alerts when usage exceeds your tier threshold." },
    ] },
  {
    id: "whatsapp",
    label: "WhatsApp & SMS",
    icon: MessageSquareText,
    blurb: "Templates, sender IDs, and driver communications.",
    faqs: [
      {
        question: "WhatsApp template not delivering",
        answer:
          "Templates must be **APPROVED** by Meta before sending. Check **Settings → WhatsApp Templates** for status. Also confirm the recipient has opted in within the last 24 hours, otherwise only utility templates are allowed." },
      {
        question: "How do I request a new SMS sender ID?",
        answer:
          "Open **Settings → Sender IDs → Request new**. Provide the sender name (max 11 chars, alphanumeric) and a use case. Approval typically takes 1–3 business days." },
      {
        question: "Driver isn't receiving job offer messages",
        answer:
          "Verify the driver's phone number includes the country code. Check **Communications → Inbox** for the delivery status. If marked as **failed**, the number may be on a do-not-disturb list." },
    ] },
  {
    id: "billing",
    label: "Billing & subscriptions",
    icon: Wallet,
    blurb: "Wallet top-ups, plans, invoices, and rates.",
    faqs: [
      {
        question: "My wallet top-up didn't reflect",
        answer:
          "MTN MoMo top-ups normally settle within 60 seconds. If it has been longer, check **Wallet → Transactions** for the reference. Keep the MoMo reference handy and escalate to a live agent if missing after 10 minutes." },
      {
        question: "How do I upgrade my subscription tier?",
        answer:
          "Visit **Settings → Subscription**. Pick the new tier (Basic / Standard / Advanced / Premium) and confirm. The upgrade is prorated against your current cycle." },
      {
        question: "Where do I download invoices?",
        answer:
          "**Billing → Invoices** lists all past statements. Click any row to download the PDF. Invoices are also emailed automatically to the billing contact on file." },
    ] },
  {
    id: "system",
    label: "System status & reports",
    icon: Activity,
    blurb: "Live platform health and reporting questions.",
    faqs: [
      {
        question: "Is there an outage right now?",
        answer:
          "Open **Help & Support → System Status** for live indicators across telemetry ingestion, WhatsApp delivery, SMS gateway, and billing. All-green means no known incidents." },
      {
        question: "How do I export a report?",
        answer:
          "Most reports (fleet, fuel, driver behavior, sustainability) include a **Receipt CSV** action in the top-right of the page. PDFs are available where applicable." },
    ] },
  {
    id: "account",
    label: "Account & access",
    icon: ShieldCheck,
    blurb: "Sign-in, password resets, and team permissions.",
    faqs: [
      {
        question: "I can't sign in",
        answer:
          "Double-check your email and password. Use **Forgot password** on the sign-in screen to reset. If your account is locked or you don't see the reset email, escalate to a live agent." },
      {
        question: "How do I invite a teammate?",
        answer:
          "Go to **Settings → Team → Invite member**, enter their email and role. They'll receive an email invitation valid for 7 days." },
    ] },
];

interface SupportChatWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SupportChatWidget({ open: controlledOpen, onOpenChange }: SupportChatWidgetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const user = useAuthStore((s) => s.user);
  const firstName = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "there";
    return name.split(/\s+/)[0];
  }, [user?.name]);

  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<Tab>("faqs");
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const { session: liveSession, joinQueue } = useLiveAgentSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTopic = TOPICS.find((t) => t.id === activeTopicId) ?? null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, view, tab]);

  useEffect(() => {
    if (open && tab === "messages") setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, tab]);

  const openTopic = (id: string) => {
    setActiveTopicId(id);
    setOpenFaqIdx(null);
    setView("topic");
  };

  const goHome = () => {
    setView("home");
    setActiveTopicId(null);
    setOpenFaqIdx(null);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    if (next === "faqs") goHome();
    else setView("messages");
  };

  const seedMessagesIfEmpty = () => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi ${firstName}! 👋 Ask me anything about FleetPro — devices, SIMs, billing, drivers, you name it. If you'd rather speak with a human, tap **Talk to a live agent** below.` },
      ]);
    }
  };

  const escalate = async () => {
    setTab("messages");
    setView("messages");
    seedMessagesIfEmpty();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    await joinQueue({
      topic: "Live agent handoff from chat widget",
      contextSummary: lastUser?.content?.slice(0, 500) || undefined,
    });
  };

  const askAiAbout = (question: string, topicLabel: string) => {
    setTab("messages");
    setView("messages");
    seedMessagesIfEmpty();
    setTimeout(() => {
      const text = `I need more help with: "${question}" (topic: ${topicLabel})`;
      setInput("");
      void sendMessage(text);
    }, 0);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && assistantSoFar.length > chunk.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }) });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("Rate limited", { description: "Too many messages, slow down a moment." });
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted", { description: "Please contact support." });
        } else {
          toast.error("Chat unavailable", { description: "Please try again." });
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ I'm having trouble responding right now. Please try again in a moment, or click **Talk to a live agent** to escalate." },
        ]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }
    } catch (e) {
      console.error("chat error", e);
      toast.error("Couldn't reach support chat");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Network error. Please check your connection and try again, or click **Talk to a live agent**." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const MAX = 20 * 1024 * 1024; // 20MB
    const accepted: File[] = [];
    for (const f of incoming) {
      if (f.size > MAX) {
        toast.error(`${f.name} is over 20MB`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length === 0) return;
    setAttachments((prev) => [...prev, ...accepted].slice(0, 10));
    setAttachOpen(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const insertQuickPrompt = (text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    setAttachOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    const atts = attachments;
    if (!text.trim() && atts.length === 0) return;
    setInput("");
    setAttachments([]);
    let composed = text;
    if (atts.length > 0) {
      const list = atts.map((a) => `📎 ${a.name}`).join("\n");
      composed = text ? `${text}\n\n${list}` : list;
    }
    void sendMessage(composed);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating icon-only bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className={cn(
            "fixed bottom-6 right-6 z-50 group",
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-[0_20px_45px_-12px_hsl(var(--primary)/0.55),inset_0_-3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)]",
            "ring-1 ring-primary/40",
            "hover:-translate-y-0.5 hover:shadow-[0_26px_55px_-12px_hsl(var(--primary)/0.65)]",
            "active:translate-y-0 transition-all duration-300"
          )}
        >
          <MessageCircleQuestion className="fill-primary-foreground text-primary w-[35px] h-[35px]" strokeWidth={2} />
          <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background shadow-sm" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col",
            "bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6",
            "sm:w-[400px] h-[min(620px,calc(100vh-2rem))] sm:max-h-[calc(100vh-3rem)]",
            "rounded-3xl overflow-hidden",
            "bg-background backdrop-blur-xl",
            "border border-border",
            "shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)]",
            "animate-in slide-in-from-bottom-4 fade-in duration-300"
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 px-4 py-3.5 bg-foreground text-background overflow-hidden shrink-0">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.3),transparent_60%)] opacity-40 bg-transparent"
            />
            <div className="relative flex items-center gap-2 min-w-0">
              {view === "topic" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goHome}
                  aria-label="Back"
                  className="h-8 w-8 text-background hover:bg-background/15 hover:text-background rounded-full -ml-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]">
                <MessageCircleQuestion className="fill-primary-foreground bg-zinc-50/0 text-primary w-[25px] h-[30px] border-0" strokeWidth={2} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-foreground animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight tracking-tight truncate">
                  {view === "topic" && activeTopic ? activeTopic.label : "FleetPro Support"}
                </p>
                <p className="text-[11px] text-background/70 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  AI assistant · always online
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="relative h-8 w-8 text-background hover:bg-background/15 hover:text-background shrink-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex flex-col bg-muted/30">
            {/* HOME view */}
            {view === "home" && tab === "faqs" && (
              <ScrollArea className="flex-1">
                <div className="px-5 pt-6 pb-4">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    <CircleHelp className="h-3 w-3" />
                    Help center
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight leading-tight mt-2">Hi {firstName} 👋</h2>
                  <h3 className="text-xl font-semibold text-muted-foreground mt-0.5">How can I help you?</h3>
                </div>
                <div className="px-3 pb-4">
                  <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Topics
                    </div>
                    <ul className="divide-y divide-border/60">
                      {TOPICS.map((t) => {
                        const Icon = t.icon;
                        return (
                          <li key={t.id}>
                            <button
                              onClick={() => openTopic(t.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors group"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium leading-tight">{t.label}</span>
                                <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {t.blurb}
                                </span>
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* TOPIC view */}
            {view === "topic" && tab === "faqs" && activeTopic && (
              <ScrollArea className="flex-1">
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
                      <activeTopic.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{activeTopic.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{activeTopic.blurb}</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-4">
                  <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <HelpCircle className="h-3 w-3" />
                      Frequently asked
                    </div>
                    <ul className="divide-y divide-border/60">
                      {activeTopic.faqs.map((faq, idx) => {
                        const isOpen = openFaqIdx === idx;
                        return (
                          <li key={idx}>
                            <button
                              onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
                            >
                              <span className="flex-1 text-sm font-medium leading-snug">{faq.question}</span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                                  isOpen && "rotate-90"
                                )}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 -mt-1">
                                <div className="rounded-xl bg-muted/60 border border-border/40 px-3.5 py-3 text-[13px] leading-relaxed text-foreground/90">
                                  {renderContent(faq.answer)}
                                </div>
                                <button
                                  onClick={() => askAiAbout(faq.question, activeTopic.label)}
                                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80 hover:text-foreground"
                                >
                                  <CircleHelp className="h-3 w-3" />
                                  Still stuck? Ask the AI
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* MESSAGES view */}
            {tab === "messages" && liveSession && (
              <LiveAgentPanel />
            )}

            {tab === "messages" && !liveSession && (
              <>
                <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8 px-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3 shadow-sm">
                          <CircleHelp className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold">Hi {firstName}, how can I help?</p>
                        <p className="text-[12px] text-muted-foreground mt-1">
                          Ask anything about FleetPro — or escalate to a live agent below.
                        </p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ring-1",
                            m.role === "user"
                              ? "bg-muted ring-border text-foreground"
                              : "bg-primary text-primary-foreground ring-primary/30"
                          )}
                        >
                          {m.role === "user" ? (
                            <UserRound className="h-3.5 w-3.5" />
                          ) : (
                            <CircleHelp className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed shadow-sm",
                            m.role === "user"
                              ? "bg-foreground text-background rounded-tr-sm"
                              : "bg-card text-foreground rounded-tl-sm border border-border/60"
                          )}
                        >
                          {renderContent(m.content)}
                        </div>
                      </div>
                    ))}
                    {isStreaming && messages[messages.length - 1]?.role === "user" && (
                      <div className="flex gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 mt-0.5 ring-1 ring-primary/30">
                          <CircleHelp className="h-3.5 w-3.5" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-card border border-border/60 px-3.5 py-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick actions */}
                <div className="px-4 py-2.5 border-t border-border/60 bg-background/80 backdrop-blur-sm shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={escalate}
                    className="w-full gap-2 text-xs h-8 hover:bg-primary/10 hover:text-foreground hover:border-primary/40"
                    disabled={isStreaming}
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    Talk to a live agent
                  </Button>
                </div>

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div className="px-3 pt-2.5 pb-1 border-t border-border/60 bg-background shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, idx) => {
                        const isImage = file.type.startsWith("image/");
                        const url = isImage ? URL.createObjectURL(file) : null;
                        return (
                          <div
                            key={idx}
                            className="relative group flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 pl-1.5 pr-7 py-1.5 max-w-[180px]"
                          >
                            {isImage && url ? (
                              <img src={url} alt={file.name} className="h-8 w-8 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-foreground">
                                <FileText className="h-4 w-4" />
                              </span>
                            )}
                            <span className="text-[11px] font-medium truncate min-w-0">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              aria-label="Remove attachment"
                              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesPicked(e.target.files);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    handleFilesPicked(e.target.files);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesPicked(e.target.files);
                    e.target.value = "";
                  }}
                />

                {/* Input */}
                <form
                  onSubmit={submitForm}
                  className="flex items-center gap-2 p-3 border-t border-border/60 bg-background shrink-0"
                >
                  <Popover open={attachOpen} onOpenChange={setAttachOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isStreaming}
                        aria-label="Add attachment"
                        className="shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                      >
                        <Plus className={cn("h-4 w-4 transition-transform", attachOpen && "rotate-45")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      collisionPadding={12}
                      className="w-[208px] p-1.5 rounded-xl shadow-xl border-border"
                    >
                      <div className="px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Attach
                      </div>
                      <div className="grid gap-0.5">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <ImageIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <Camera className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Take a photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">File</span>
                        </button>
                      </div>
                      <div className="my-1 h-px bg-border/60" />
                      <div className="px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Quick actions
                      </div>
                      <div className="grid gap-0.5">
                        <button
                          type="button"
                          onClick={() => insertQuickPrompt("I'd like to share my device IMEI: ")}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <Cpu className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Share device IMEI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => insertQuickPrompt("Please check my account status.")}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Check account status</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachOpen(false);
                            escalate();
                          }}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <Headphones className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Talk to a live agent</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    disabled={isStreaming}
                    className="flex-1 rounded-full border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                    className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-md"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Bottom tab bar */}
          <div className="grid grid-cols-2 border-t border-border bg-background shrink-0">
            <button
              onClick={() => switchTab("faqs")}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                tab === "faqs" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HelpCircle className={cn("h-4 w-4", tab === "faqs" && "text-primary")} />
              FAQs
            </button>
            <button
              onClick={() => {
                switchTab("messages");
                seedMessagesIfEmpty();
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                tab === "messages" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessagesSquare className={cn("h-4 w-4", tab === "messages" && "text-primary")} />
              Messages
            </button>
          </div>
        </div>
      )}
    </>
  );
}
