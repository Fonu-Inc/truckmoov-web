import {
  Activity,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cpu,
  FileText,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  MessageCircleQuestion,
  MessageSquareText,
  MessagesSquare,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  Signal,
  UserRound,
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
import { useProfileName } from "@/features/dashboard/hooks/useProfileName";
import { useLiveAgentSession } from "@/hooks/useLiveAgentSession";
import { cn } from "@/lib/utils";

type Msg = {
  role: "user" | "assistant"; content: string;
};
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

const TOPICS: Topic[] = [
  {
    id: "onboarding",
    label: "Getting started & activation",
    icon: ShieldCheck,
    blurb: "Applications, activation links, and the Get Started steps.",
    faqs: [
      {
        question: "How does a new customer join Fleet Pro?",
        answer:
          "Apply on the Fleet Pro landing page: choose **Fleet Provider** (more than 10 vehicles) or **Owner-Operator** (10 or fewer), fill in business details, fleet requirements and documents, then submit. You get an Application ID straight away. MTN reviews it (usually 30–60 minutes) and emails an activation link.",
      },
      {
        question: "What happens after I sign in the first time?",
        answer:
          "You land on **Get Started**, which has 4 steps: **Subscription → Activate System & Provisioning → Installation → Quick Access**. Your vehicles, devices and SIMs only appear in the live catalogue once installation is completed.",
      },
      {
        question: "Do I need to upload KYC documents inside the platform?",
        answer:
          "No. Verification is completed during the application, before you get access. There is no document review step inside the platform.",
      },
    ],
  },
  {
    id: "procurement",
    label: "Ordering devices, SIMs & vehicles",
    icon: Wallet,
    blurb: "Requests, quotations, payment and delivery.",
    faqs: [
      {
        question: "How do I order new hardware?",
        answer:
          "From **My Devices**, **My IoT SIMs** or **My Vehicles**, start a request and pick the manufacturer and model from the approved catalogue. The flow is **Request → Quotation → Payment → Installation → Completed**, and the items join your active catalogue at the end.",
      },
      {
        question: "Where did my quotation go?",
        answer:
          "Quotations are hidden once payment has been made. After paying, you follow the request on the **Payment** and **Installation** steps until it is completed.",
      },
      {
        question: "Where is my installation report?",
        answer:
          "Open the completed request summary on **My Vehicles**, **My Devices** or **My IoT SIMs**. It lists every vehicle, device and SIM installed, with installation photos, and a **Download Report** button.",
      },
    ],
  },
  {
    id: "device",
    label: "Installation & device configuration",
    icon: Cpu,
    blurb: "Installers, configuration, firmware and offline trackers.",
    faqs: [
      {
        question: "Who installs and configures my devices?",
        answer:
          "An approved Fleet Pro installer does both. Installation jobs are **assigned automatically** by the platform, so nobody assigns them by hand. The installer links each device to a vehicle and each SIM to a device, completes a checklist and uploads photo evidence. Customers do not configure devices.",
      },
      {
        question: "Device not showing online",
        answer:
          "1. Confirm the installation job is completed.\n2. Check the vehicle has power and the ignition has been on recently.\n3. Check the device's last heartbeat: **online** means a signal within the last 3 minutes.\n4. Confirm the linked SIM is active with data left.\n5. Allow up to 10 minutes after a fresh installation, then report an issue.",
      },
      {
        question: "How do I update firmware?",
        answer:
          "Open **My Devices → View Details → Firmware**. If a newer version exists you'll see an **Update Firmware** button; otherwise it confirms the device is up to date. The update runs over the air and the device reboots on the new version.",
      },
    ],
  },
  {
    id: "sim",
    label: "IoT SIMs & connectivity",
    icon: Signal,
    blurb: "Activation, data bundles, and locked SIM details.",
    faqs: [
      {
        question: "Why is the SIM phone number greyed out?",
        answer:
          "SIMs supplied by MTN are provisioned by the platform, so the phone number is locked. You can still edit ICCID, IMSI and carrier. If the number is genuinely wrong, report an issue and MTN will correct it.",
      },
      {
        question: "My SIM is not active yet",
        answer:
          "SIMs are activated after MTN approves and fulfils the request and the SIM is fitted during installation. Allow up to 24 hours for carrier provisioning, then report an issue if it is still inactive.",
      },
      {
        question: "How do I check data usage and bundle expiry?",
        answer:
          "Open **My IoT SIMs**. Each SIM shows its bundle, usage and expiry date. You get reminders before expiry and again when it is due. Unpaid bundles can lead to suspension, which stops telemetry for that vehicle.",
      },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp, SMS & campaigns",
    icon: MessageSquareText,
    blurb: "Driver messaging, templates and delivery issues.",
    faqs: [
      {
        question: "How do I send a campaign?",
        answer:
          "**Messaging Center → Campaigns → New Campaign**. Step 1: name, channels and recipients. Step 2: the message, with templates and a live preview. Step 3: review, then **Launch Campaign** (send now or schedule).",
      },
      {
        question: "WhatsApp message not delivering",
        answer:
          "Free-form WhatsApp only works within **24 hours** of the driver's last reply. Outside that window use an approved template. Also check the number includes the country code, the template is approved, and that the driver hasn't replied **STOP** (opted-out numbers are blocked).",
      },
      {
        question: "Driver isn't receiving job offers",
        answer:
          "Job offers cascade **WhatsApp → SMS → voice call**. Check the driver's number and profile status, and review the delivery status per driver. Note that Fleet Pro support itself is not offered over WhatsApp.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing, quotations & payments",
    icon: Wallet,
    blurb: "Charges, quotations, invoices and payment methods.",
    faqs: [
      {
        question: "What am I charged for?",
        answer:
          "Everything is grouped under four headings: **Hardware Devices** (trackers, IoT SIMs, accessories), **Licensing** (platform, vehicle and user licences), **Installation**, and **Subscription & Services**. Quotations and invoices use the same four groups.",
      },
      {
        question: "How do I pay?",
        answer:
          "Open **Billing → Quotations** or **Invoices**, review the breakdown, and pay by MTN MoMo, card or bank transfer. Once paid, installation scheduling continues automatically.",
      },
      {
        question: "My payment didn't reflect",
        answer:
          "MoMo normally settles within 60 seconds. Check **Billing → Payments** for the reference, wait about 5 minutes, then escalate to a live agent with the transaction reference if it is still missing.",
      },
    ],
  },
  {
    id: "jobs",
    label: "Jobs & dispatch",
    icon: Activity,
    blurb: "Recommending drivers, assigning vehicles, live tracking.",
    faqs: [
      {
        question: "Why does it say Recommend instead of Assign?",
        answer:
          "Fleet administrators **recommend** a driver; the **operations manager** assigns the vehicle. Owner-operators assign their own driver and vehicle. A job stays **Unassigned** until both a driver and a vehicle are in place.",
      },
      {
        question: "How do I follow a job?",
        answer:
          "Open the job and use **View Details** for pickup, delivery, stops and schedule, or **Live Tracking** to follow the vehicle. Map alerts include a **Track vehicle** button that jumps straight to the vehicle.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & access",
    icon: ShieldCheck,
    blurb: "Sign-in, roles, and team invitations.",
    faqs: [
      {
        question: "I can't sign in",
        answer:
          "Double-check your email and password, and use **Forgot password** on the sign-in screen. If your account is locked or the reset email doesn't arrive, escalate to a live agent.",
      },
      {
        question: "How do I invite a teammate?",
        answer:
          "**Settings → Team Management → Invite User**, enter their email and role. Invitations are email-only and valid for 7 days.",
      },
      {
        question: "What roles are available?",
        answer:
          "Fleet Admin (full access), Operations Manager (fleet, devices, assigns vehicles), Supervisor (tracking, drivers, recommends drivers), Dispatcher, Finance/Viewer (read-only), and Installer (separate installer portal for installation jobs).",
      },
    ],
  },
];

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

  // The session carries no name; fleetflow reads `user.name` here.
  const profileName = useProfileName();
  const firstName = useMemo(
    () => {
      if (!profileName)
        return "there";
      return profileName.split(/\s+/)[0];
    },
    [profileName],
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

  const {
    session: liveSession, joinQueue,
  } = useLiveAgentSession();
  const [
    messages,
    setMessages,
  ] = useState<Msg[]>([]);
  const [
    input,
    setInput,
  ] = useState("");
  const [
    attachments,
    setAttachments,
  ] = useState<File[]>([]);
  const [
    attachOpen,
    setAttachOpen,
  ] = useState(false);
  const [
    isStreaming,
    setIsStreaming,
  ] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTopic = TOPICS.find(t => t.id === activeTopicId) ?? null;

  useEffect(
    () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    },
    [
      messages,
      isStreaming,
      view,
      tab,
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

  const seedMessagesIfEmpty = () => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi ${firstName}! 👋 Contact a live agent for help with FleetPro.`,
        },
      ]);
    }
  };

  const escalate = async () => {
    setTab("messages");
    setView("messages");
    seedMessagesIfEmpty();
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    await joinQueue({
      topic: "Live agent handoff from chat widget",
      contextSummary: lastUser?.content?.slice(
        0,
        500,
      ) || undefined,
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming)
      return;
    setIsStreaming(true);
    setMessages(prev => [
      ...prev,
      {
        role: "user", content: text.trim(),
      },
    ]);
    try {
      await joinQueue({
        topic: "Support request", contextSummary: text.trim().slice(
          0,
          500,
        ),
      });
    }
    finally {
      setIsStreaming(false);
    }
  };

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0)
      return;
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
    if (accepted.length === 0)
      return;
    setAttachments(prev => [
      ...prev,
      ...accepted,
    ].slice(
      0,
      10,
    ));
    setAttachOpen(false);
  };

  const removeAttachment = (idx: number) => {
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

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    const atts = attachments;
    if (!text.trim() && atts.length === 0)
      return;
    setInput("");
    setAttachments([]);
    let composed = text;
    if (atts.length > 0) {
      const list = atts.map(a => `📎 ${a.name}`).join("\n");
      composed = text ? `${text}\n\n${list}` : list;
    }
    void sendMessage(composed);
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
            "active:translate-y-0 transition-all duration-300",
          )}
        >
          <MessageCircleQuestion
            className="fill-primary-foreground text-primary w-[35px] h-[35px]"
            strokeWidth={2}
          />
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
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
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
                <MessageCircleQuestion
                  className="fill-primary-foreground bg-zinc-50/0 text-primary w-[25px] h-[30px] border-0"
                  strokeWidth={2}
                />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-foreground animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight tracking-tight truncate">
                  {view === "topic" && activeTopic ? activeTopic.label : "FleetPro Support"}
                </p>
                <p className="text-[11px] text-background/70 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Help topics & live support
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
                  <h2 className="text-2xl font-bold tracking-tight leading-tight mt-2">
                    Hi
                    {firstName}
                    {" "}
                    👋
                  </h2>
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
                                  isOpen && "rotate-90",
                                )}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 -mt-1">
                                <div className="rounded-xl bg-muted/60 border border-border/40 px-3.5 py-3 text-[13px] leading-relaxed text-foreground/90">
                                  {renderContent(faq.answer)}
                                </div>

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

            {/* MESSAGES view
                ponytail: fleetflow renders <LiveAgentPanel /> here once
                joinQueue opens a live session. Admin's useLiveAgentSession is a
                stub whose session is always null, so that branch can never
                render — port LiveAgentPanel when a live-agent API exists. */}

            {tab === "messages" && !liveSession && (
              <>
                <ScrollArea
                  className="flex-1 px-4 py-4"
                  ref={scrollRef as any}
                >
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8 px-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3 shadow-sm">
                          <CircleHelp className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold">
                          Hi
                          {firstName}
                          , how can I help?
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-1">
                          Contact a live agent for help with FleetPro.
                        </p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-2.5",
                          m.role === "user" && "flex-row-reverse",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ring-1",
                            m.role === "user"
                              ? "bg-muted ring-border text-foreground"
                              : "bg-primary text-primary-foreground ring-primary/30",
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
                              : "bg-card text-foreground rounded-tl-sm border border-border/60",
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
                              <img
                                src={url}
                                alt={file.name}
                                className="h-8 w-8 rounded-lg object-cover"
                              />
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
                  <Popover
                    open={attachOpen}
                    onOpenChange={setAttachOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isStreaming}
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
                    onChange={e => setInput(e.target.value)}
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
              onClick={() => {
                switchTab("messages");
                seedMessagesIfEmpty();
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                tab === "messages" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MessagesSquare className={cn(
                "h-4 w-4",
                tab === "messages" && "text-primary",
              )}
              />
              Messages
            </button>
          </div>
        </div>
      )}
    </>
  );
}
