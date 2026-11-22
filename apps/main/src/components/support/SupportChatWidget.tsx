import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cpu,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  MessageCircleQuestion,
  MessageSquareText,
  MessagesSquare,
  Package,
  Paperclip,
  Plus,
  Rocket,
  Route,
  Send,
  ShieldCheck,
  Signal,
  Wallet,
  X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useLiveAgentSession } from "@/hooks/useLiveAgentSession";
import { cn } from "@/lib/utils";
import { LiveAgentPanel } from "./LiveAgentPanel";

type View = "home" | "topic" | "messages";
type Tab = "faqs" | "messages";

type FaqItem = {
  question: string;
  answer: string;
};
type Topic = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
  faqs: FaqItem[];
};

type PendingAttachment = {
  file: File;
  url: string | null;
};

const TOPICS: Topic[] = [
  {
    id: "activation",
    label: "Getting started & activation",
    icon: Rocket,
    blurb: "Activating your account, KYC, and first setup.",
    faqs: [
      {
        question: "How do I activate my account?",
        answer:
          "After you choose a plan, the activation steps walk you through adding your **IoT Devices** and **IoT SIMs** (one at a time, by CSV bulk import, or by requesting them from the platform) and enabling features.",
      },
      {
        question: "Where do I complete KYC / KYB?",
        answer:
          "Submit your business documents under **Settings → KYC**. If SIM activation is held up by verification, use **Request KYB/KYC Completion** on the **IoT SIMs** page.",
      },
      {
        question: "How do I add my team?",
        answer:
          "Go to **Settings → Users → Invite User**, enter their email and pick a role. They'll get an email invitation.",
      },
    ],
  },
  {
    id: "ordering",
    label: "Ordering devices, SIMs & vehicles",
    icon: Package,
    blurb: "Requesting trackers and SIMs, and adding vehicles.",
    faqs: [
      {
        question: "How do I order tracking devices?",
        answer:
          "On **Devices**, use **Request Device** to order trackers from the platform, or **Request Device Setup** to book an installation. Your requests are tracked on the same page.",
      },
      {
        question: "How do I get IoT SIMs?",
        answer:
          "On **IoT SIMs**, use **Request SIM**. Already have SIMs? **Bulk Import** adds them from a CSV.",
      },
      {
        question: "How do I add a vehicle?",
        answer:
          "Open **Fleets** and use **Add Vehicle**.",
      },
    ],
  },
  {
    id: "device",
    label: "Device installation & configuration",
    icon: Cpu,
    blurb: "Registering trackers and getting them online.",
    faqs: [
      {
        question: "Device not showing online",
        answer:
          "1. Check the SIM is active on **IoT SIMs** and inserted correctly.\n2. Make sure the device has a clear view of the sky for a GPS fix.\n3. Check the power wiring (constant 12V and ground).\n4. Check the device's status and last-seen time on **Devices**. If it's still offline, message us here with the IMEI.",
      },
      {
        question: "How do I add a tracker I already own?",
        answer:
          "Add it from **Devices**: enter the IMEI and pick the manufacturer and model from the catalog.",
      },
      {
        question: "Where do I find the device IMEI?",
        answer:
          "The IMEI (15 digits) is printed on the sticker on the tracker housing and on the original packaging.",
      },
    ],
  },
  {
    id: "sim",
    label: "SIM connectivity",
    icon: Signal,
    blurb: "IoT SIM activation, data bundles, and data sessions.",
    faqs: [
      {
        question: "My SIM isn't activating",
        answer:
          "Check the SIM's status on **IoT SIMs**. If it stays pending, KYB/KYC may be incomplete: use **Request KYB/KYC Completion**, or message us here with the ICCID.",
      },
      {
        question: "No data on the device",
        answer:
          "Confirm the SIM is active on **IoT SIMs** and that its bundle hasn't run out under **M2M IoT Bundles** (use **Top Up Bundle** if it has). Then power-cycle the tracker. Still no data? Send us the ICCID and IMEI.",
      },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp & SMS",
    icon: MessageSquareText,
    blurb: "WhatsApp setup, templates, and driver messages.",
    faqs: [
      {
        question: "WhatsApp template not delivering",
        answer:
          "Templates must be approved by Meta before they can be sent. Check the template's status under **Communications → WhatsApp Setup**. Outside the 24-hour conversation window, WhatsApp only allows approved templates.",
      },
      {
        question: "Driver isn't receiving messages",
        answer:
          "Make sure the driver's phone number includes the country code. Check the delivery status in **Communications → Messaging Center**. If it shows **failed**, message us with the number and the time it was sent.",
      },
    ],
  },
  {
    id: "jobs",
    label: "Jobs & dispatch",
    icon: Route,
    blurb: "Creating jobs and assigning drivers and vehicles.",
    faqs: [
      {
        question: "How do I create a job?",
        answer:
          "Open **Shipments** (shown as **Jobs** or **Dispatch** for some roles) and use **Create Job**.",
      },
      {
        question: "How do I assign a driver and vehicle?",
        answer:
          "From **Shipments**, open the job and assign a driver and vehicle. You pick both yourself; there's no automatic matching.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & subscriptions",
    icon: Wallet,
    blurb: "Wallet top-ups, plans, and invoices.",
    faqs: [
      {
        question: "My wallet top-up didn't reflect",
        answer:
          "Wallet top-ups are paid with MTN Mobile Money from **Wallet & Billing**. If the balance hasn't updated after a few minutes, look for it in **Wallet Transaction History**, then message us here with your MoMo reference.",
      },
      {
        question: "How do I change my plan?",
        answer:
          "**Settings → Subscription** shows your current plan. Use **Upgrade** there to move to a higher plan.",
      },
      {
        question: "Where are my invoices?",
        answer:
          "**Billing → Invoices** lists your subscription invoices.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & access",
    icon: ShieldCheck,
    blurb: "Sign-in, password resets, and team access.",
    faqs: [
      {
        question: "A teammate can't sign in",
        answer:
          "They can use **Forgot password** on the sign-in screen to reset it. If the reset email doesn't arrive, check their account under **Settings → Users**, or message us here with their email.",
      },
      {
        question: "How do I see who changed what?",
        answer:
          "**Settings → Audit Log** records account activity and changes made by your team.",
      },
    ],
  },
];

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

function revokeAll(items: PendingAttachment[]) {
  items.forEach(a => a.url && URL.revokeObjectURL(a.url));
}

type SupportChatWidgetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SupportChatWidget({
  open: controlledOpen, onOpenChange,
}: SupportChatWidgetProps = {}) {
  const [
    internalOpen,
    setInternalOpen,
  ] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange)
      onOpenChange(v);
    else setInternalOpen(v);
  };

  const email = useAuthStore(s => s.user?.email);
  const firstName = useMemo(
    () => {
      const local = email?.split("@")[0]?.split(/[._\-+]/)[0];
      return local ? local[0].toUpperCase() + local.slice(1) : "there";
    },
    [email],
  );

  const [
    view,
    setView,
  ] = useState<View>("home");
  const [
    tab,
    setTab,
  ] = useState<Tab>("faqs");
  const [
    activeTopicId,
    setActiveTopicId,
  ] = useState<string | null>(null);
  const [
    openFaqIdx,
    setOpenFaqIdx,
  ] = useState<number | null>(null);
  const [
    pendingTopicId,
    setPendingTopicId,
  ] = useState<string | null>(null);

  const {
    session, messages, unread, markSeen, isLoading, isJoining, isSending, joinQueue, sendMessage, endSession,
  } = useLiveAgentSession({ open });
  const busy = isJoining || isSending;

  const [
    input,
    setInput,
  ] = useState("");
  const [
    attachments,
    setAttachments,
  ] = useState<PendingAttachment[]>([]);
  const [
    attachOpen,
    setAttachOpen,
  ] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const activeTopic = TOPICS.find(t => t.id === activeTopicId) ?? null;
  const pendingTopic = TOPICS.find(t => t.id === pendingTopicId) ?? null;
  const chatLive = !!session && session.status !== "ended";

  useEffect(
    () => () => revokeAll(attachmentsRef.current),
    [],
  );

  useEffect(
    () => {
      if (open && tab === "messages")
        markSeen();
    },
    [
      open,
      tab,
      markSeen,
    ],
  );

  useEffect(
    () => {
      if (open && tab === "messages") {
        setTimeout(
          () => inputRef.current?.focus(),
          100,
        );
      }
    },
    [
      open,
      tab,
    ],
  );

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
    if (next === "faqs")
      goHome();
    else setView("messages");
  };

  const openWidget = () => {
    setOpen(true);
    if (unread)
      switchTab("messages");
  };

  const askAgentAbout = (question: string, topicId: string) => {
    switchTab("messages");
    if (!chatLive)
      setPendingTopicId(topicId);
    setInput(`About "${question}": `);
    setTimeout(
      () => inputRef.current?.focus(),
      50,
    );
  };

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0)
      return;
    const accepted: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} is over 20MB`);
        continue;
      }
      accepted.push({
        file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      });
    }
    const room = MAX_ATTACHMENTS - attachments.length;
    revokeAll(accepted.slice(Math.max(
      room,
      0,
    )));
    if (room > 0 && accepted.length > 0) {
      setAttachments(prev => [
        ...prev,
        ...accepted.slice(
          0,
          room,
        ),
      ]);
    }
    setAttachOpen(false);
  };

  const removeAttachment = (idx: number) => {
    revokeAll(attachments.slice(
      idx,
      idx + 1,
    ));
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const insertQuickPrompt = (text: string) => {
    setInput(prev => (prev ? `${prev} ${text}` : text));
    setAttachOpen(false);
    setTimeout(
      () => inputRef.current?.focus(),
      50,
    );
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (busy || (!text && attachments.length === 0))
      return;
    const files = attachments.map(a => a.file);
    const ok = chatLive
      ? await sendMessage(
          text,
          files,
        )
      : await joinQueue(
          pendingTopic,
          text,
          files,
        );
    if (!ok)
      return;
    setInput("");
    revokeAll(attachments);
    setAttachments([]);
    setPendingTopicId(null);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={i}
            className="font-semibold"
          >
            {part.slice(
              2,
              -2,
            )}
          </strong>
        );
      }
      return (
        <span
          key={i}
          className="whitespace-pre-wrap"
        >
          {part}
        </span>
      );
    });
  };

  return (
    <>
      {!open && (
        <button
          onClick={openWidget}
          aria-label={unread ? "Open support chat, new reply" : "Open support chat"}
          className={cn(
            "fixed bottom-6 right-6 z-50 group",
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-[0_20px_45px_-12px_hsl(var(--primary)/0.55),inset_0_-3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)]",
            "ring-1 ring-primary/40",
            "hover:-translate-y-0.5 hover:shadow-[0_26px_55px_-12px_hsl(var(--primary)/0.65)]",
            "active:translate-y-0 transition-all duration-300",
          )}
        >
          <MessageCircleQuestion
            className="fill-primary-foreground text-primary w-[35px] h-[35px]"
            strokeWidth={2}
          />
          {unread && (
            <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background shadow-sm" />
          )}
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col",
            "bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6",
            "sm:w-[400px] h-[min(620px,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-3rem)]",
            "rounded-3xl overflow-hidden",
            "bg-background backdrop-blur-xl",
            "border border-border",
            "shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)]",
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
          )}
        >
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
                <MessageCircleQuestion
                  className="fill-primary-foreground bg-transparent text-primary w-[25px] h-[30px] border-0"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight tracking-tight truncate">
                  {view === "topic" && activeTopic ? activeTopic.label : "TruckMoov Support"}
                </p>
                <p className="text-[11px] text-background/70 mt-0.5">
                  Our support team replies in this chat
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

          <div className="flex-1 min-h-0 flex flex-col bg-muted/30">
            {view === "home" && tab === "faqs" && (
              <ScrollArea className="flex-1">
                <div className="px-5 pt-6 pb-4">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    <CircleHelp className="h-3 w-3" />
                    Help center
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight leading-tight mt-2">
                    {`Hi ${firstName} 👋`}
                  </h2>
                  <h3 className="text-xl font-semibold text-muted-foreground mt-0.5">How can we help?</h3>
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
                                  isOpen && "rotate-90",
                                )}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 -mt-1">
                                <div className="rounded-xl bg-muted/60 border border-border/40 px-3.5 py-3 text-[13px] leading-relaxed text-foreground/90">
                                  {renderContent(faq.answer)}
                                </div>
                                <button
                                  onClick={() => askAgentAbout(
                                    faq.question,
                                    activeTopic.id,
                                  )}
                                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80 hover:text-foreground"
                                >
                                  <CircleHelp className="h-3 w-3" />
                                  Still stuck? Message our support team
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

            {tab === "messages" && (
              <>
                {session
                  ? (
                      <LiveAgentPanel
                        session={session}
                        messages={messages}
                        onEnd={() => void endSession()}
                      />
                    )
                  : (
                      <ScrollArea className="flex-1 px-4 py-4">
                        {isLoading
                          ? (
                              <div className="flex justify-center py-10">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              </div>
                            )
                          : (
                              <div className="text-center py-8 px-2">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3 shadow-sm">
                                  <CircleHelp className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold">
                                  {`Hi ${firstName}, how can we help?`}
                                </p>
                                <p className="text-[12px] text-muted-foreground mt-1">
                                  Send a message to start a chat with our support team. We'll reply right here.
                                </p>
                                {pendingTopic && (
                                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium">
                                    {`Topic: ${pendingTopic.label}`}
                                    <button
                                      type="button"
                                      onClick={() => setPendingTopicId(null)}
                                      aria-label="Clear topic"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </p>
                                )}
                              </div>
                            )}
                      </ScrollArea>
                    )}

                {attachments.length > 0 && (
                  <div className="px-3 pt-2.5 pb-1 border-t border-border/60 bg-background shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map(({
                        file, url,
                      }, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="relative group flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 pl-1.5 pr-7 py-1.5 max-w-[180px]"
                        >
                          {url
                            ? (
                                <img
                                  src={url}
                                  alt={file.name}
                                  className="h-8 w-8 rounded-lg object-cover"
                                />
                              )
                            : (
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
                      ))}
                    </div>
                  </div>
                )}

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

                <form
                  onSubmit={e => void submitForm(e)}
                  className="flex items-center gap-2 p-3 border-t border-border/60 bg-background shrink-0"
                >
                  <Popover
                    open={attachOpen}
                    onOpenChange={setAttachOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={busy}
                        aria-label="Add attachment"
                        className="shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                      >
                        <Plus className={cn(
                          "h-4 w-4 transition-transform",
                          attachOpen && "rotate-45",
                        )}
                        />
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
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={chatLive ? "Type a message…" : "Describe your issue to start a chat…"}
                    disabled={busy}
                    className="flex-1 rounded-full border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send message"
                    disabled={(!input.trim() && attachments.length === 0) || busy}
                    className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-md"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-border bg-background shrink-0">
            <button
              onClick={() => switchTab("faqs")}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                tab === "faqs" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HelpCircle className={cn(
                "h-4 w-4",
                tab === "faqs" && "text-primary",
              )}
              />
              FAQs
            </button>
            <button
              onClick={() => switchTab("messages")}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                tab === "messages" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MessagesSquare className={cn(
                "h-4 w-4",
                tab === "messages" && "text-primary",
              )}
              />
              Messages
              {unread && tab !== "messages" && (
                <span className="absolute top-2 left-[calc(50%+6px)] h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
