import {
  formatClockDuration, formatDateTime, formatDayMonthTime,
} from "@truckmoov/app-core/utils/time-utils";

import {
  AlertCircle, CheckCircle, Clock, Delete, Download, Filter, Globe, Headphones, Loader2, MessageSquare, Mic, MicOff, MoreHorizontal, Pause, Pencil, Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Play, Plus, Search, Settings, Trash2, User, UserPlus, Volume2, XCircle,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";

type Language = "en" | "ha" | "yo" | "ig" | "pcm";

type IVRPrompt = {
  id: string;
  name: string;
  category: "greeting" | "menu" | "confirmation" | "error" | "goodbye";
  translations: Record<Language, string>;
  audioUrls?: Record<Language, string>;
  keyPress?: string;
};

type CallLog = {
  id: string;
  driverName: string;
  driverPhone: string;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "failed" | "ongoing";
  duration: number; // seconds
  language: Language;
  timestamp: Date;
  notes?: string;
};

const LANGUAGES: {
  code: Language; name: string; nativeName: string;
}[] = [
  {
    code: "en", name: "English", nativeName: "English",
  },
  {
    code: "ha", name: "Hausa", nativeName: "Hausa",
  },
  {
    code: "yo", name: "Yoruba", nativeName: "Yorùbá",
  },
  {
    code: "ig", name: "Igbo", nativeName: "Igbo",
  },
  {
    code: "pcm", name: "Nigerian Pidgin", nativeName: "Naija",
  },
];

const CATEGORIES = [
  {
    value: "greeting", label: "Greeting",
  },
  {
    value: "menu", label: "Menu Options",
  },
  {
    value: "confirmation", label: "Confirmation",
  },
  {
    value: "error", label: "Error Messages",
  },
  {
    value: "goodbye", label: "Goodbye",
  },
];

// Demo IVR prompts shown by default
const DEFAULT_PROMPTS: IVRPrompt[] = [
  {
    id: "p1",
    name: "Welcome Greeting",
    category: "greeting",
    translations: {
      en: "Welcome to Fleet Pro driver support. Please listen carefully to the following options.",
      ha: "Barka da zuwa Fleet Pro tallafin direba. Da fatan za a saurari zaɓuɓɓuka masu zuwa.",
      yo: "Káàbọ̀ sí ìrànlọ́wọ́ awakọ̀ Fleet Pro. Jọ̀wọ́ tẹ́tí sílẹ̀ dáadáa.",
      ig: "Nnọọ na nkwado onye ọkwọ ụgbọala Fleet Pro. Biko gee ntị na nhọrọ ndị a.",
      pcm: "Welcome to Fleet Pro driver help. Abeg listen well to di options wey dey come.",
    },
    audioUrls: undefined,
  },
  {
    id: "p2",
    name: "Main Menu",
    category: "menu",
    translations: {
      en: "Press 1 for new job offers, 2 for ongoing trip, 3 for support, or 0 to speak with an agent.",
      ha: "Latsa 1 don sabbin tayin aiki, 2 don tafiya mai gudana, 3 don tallafi, ko 0 don magana da wakili.",
      yo: "Tẹ 1 fún àwọn iṣẹ́ tuntun, 2 fún ìrìnàjò tó ń lọ, 3 fún ìrànlọ́wọ́, tàbí 0 láti bá agbéjọ́rò sọ̀rọ̀.",
      ig: "Pịa 1 maka ọrụ ọhụrụ, 2 maka njem na-aga n'ihu, 3 maka nkwado, ma ọ bụ 0 ka ị kpaa onye nnọchite anya okwu.",
      pcm: "Press 1 for new work, 2 for trip wey dey go, 3 for help, or 0 to talk to person.",
    },
    keyPress: "*",
  },
  {
    id: "p3",
    name: "Job Acceptance Confirmation",
    category: "confirmation",
    translations: {
      en: "You have accepted the job. Pickup details have been sent to your phone via SMS.",
      ha: "Kun karɓi aikin. An aika maka cikakkun bayanan ɗaukar a wayarka.",
      yo: "O ti gba iṣẹ́ náà. A ti rán àwọn àlàyé sí fóònù rẹ.",
      ig: "Ị nakweere ọrụ ahụ. E ziteela gị nkọwa nlele na ekwentị gị.",
      pcm: "You don accept di work. Pickup details don land your phone for SMS.",
    },
    keyPress: "1",
  },
  {
    id: "p4",
    name: "Invalid Input Error",
    category: "error",
    translations: {
      en: "Sorry, that is not a valid option. Please try again.",
      ha: "Yi haƙuri, wannan ba zaɓi mai inganci ba ne. Da fatan a sake gwadawa.",
      yo: "Má bínú, ìyẹn kì í ṣe àṣàyàn tó dára. Jọ̀wọ́ tún ún gbìyànjú.",
      ig: "Ndo, nke ahụ abụghị nhọrọ ziri ezi. Biko nwaa ọzọ.",
      pcm: "Sorry, dat one no correct. Abeg try again.",
    },
  },
  {
    id: "p5",
    name: "Goodbye Message",
    category: "goodbye",
    translations: {
      en: "Thank you for calling Fleet Pro. Drive safe, and have a great day!",
      ha: "Mun gode da kiranka Fleet Pro. Yi tuƙi cikin aminci, kuma ka yi kyakkyawar rana!",
      yo: "A dúpẹ́ pé o pe Fleet Pro. Wa ọkọ̀ pẹ̀lú àbojútó, kí o sì ní ọjọ́ ayọ̀!",
      ig: "Daalụ maka ịkpọ Fleet Pro. Were nlezianya ịnya ụgbọala, nweekwa ụbọchị ọma!",
      pcm: "Thank you for calling Fleet Pro. Drive safe and enjoy your day!",
    },
  },
];

// Demo call logs shown by default
const DEFAULT_CALL_LOGS: CallLog[] = [
  {
    id: "c1",
    driverName: "Chukwuemeka Okafor",
    driverPhone: "+234 801 234 5678",
    direction: "outbound",
    status: "completed",
    duration: 184,
    language: "en",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    notes: "Confirmed pickup for job TM-2847",
  },
  {
    id: "c2",
    driverName: "Adebayo Johnson",
    driverPhone: "+234 802 345 6789",
    direction: "inbound",
    status: "completed",
    duration: 312,
    language: "yo",
    timestamp: new Date(Date.now() - 1000 * 60 * 47),
    notes: "Reported delay due to traffic on Lekki-Epe expressway",
  },
  {
    id: "c3",
    driverName: "Ibrahim Musa",
    driverPhone: "+234 804 567 8901",
    direction: "outbound",
    status: "missed",
    duration: 0,
    language: "ha",
    timestamp: new Date(Date.now() - 1000 * 60 * 95),
  },
  {
    id: "c4",
    driverName: "Oluwaseun Adeleke",
    driverPhone: "+234 803 456 7890",
    direction: "outbound",
    status: "completed",
    duration: 96,
    language: "en",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    notes: "Job offer accepted via IVR",
  },
  {
    id: "c5",
    driverName: "Tunde Bakare",
    driverPhone: "+234 805 678 9012",
    direction: "inbound",
    status: "failed",
    duration: 0,
    language: "pcm",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    notes: "Network failure",
  },
  {
    id: "c6",
    driverName: "Aisha Bello",
    driverPhone: "+234 806 789 0123",
    direction: "outbound",
    status: "completed",
    duration: 421,
    language: "ig",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    notes: "Provided support for waybill upload",
  },
];

const categoryColors: Record<string, string> = {
  greeting: "bg-primary/20 text-primary border-primary/30",
  menu: "bg-success/20 text-success border-success/30",
  confirmation: "bg-warning/20 text-warning border-warning/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
  goodbye: "bg-muted text-muted-foreground border-muted",
};

const statusColors: Record<string, string> = {
  completed: "bg-success/20 text-success",
  missed: "bg-destructive/20 text-destructive",
  failed: "bg-destructive/20 text-destructive",
  ongoing: "bg-primary/20 text-primary",
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-4 w-4" />,
  missed: <PhoneMissed className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  ongoing: <PhoneCall className="h-4 w-4 animate-pulse" />,
};

export function VoiceIVRManager() {
  const [
    prompts,
    setPrompts,
  ] = useState<IVRPrompt[]>(DEFAULT_PROMPTS);
  const [
    callLogs,
    setCallLogs,
  ] = useState<CallLog[]>(DEFAULT_CALL_LOGS);
  const [
    isPromptDialogOpen,
    setIsPromptDialogOpen,
  ] = useState(false);
  const [
    selectedPrompt,
    setSelectedPrompt,
  ] = useState<IVRPrompt | null>(null);
  const [
    activeLanguage,
    setActiveLanguage,
  ] = useState<Language>("en");
  const [
    ivrEnabled,
    setIvrEnabled,
  ] = useState(true);
  const [
    defaultLanguage,
    setDefaultLanguage,
  ] = useState<Language>("en");
  const [
    isCallDialogOpen,
    setIsCallDialogOpen,
  ] = useState(false);
  const [
    callPhoneNumber,
    setCallPhoneNumber,
  ] = useState("");
  const [
    callMessage,
    setCallMessage,
  ] = useState("");
  const [
    selectedCall,
    setSelectedCall,
  ] = useState<CallLog | null>(null);
  const [
    callSearch,
    setCallSearch,
  ] = useState("");
  const [
    callStatusFilter,
    setCallStatusFilter,
  ] = useState<string>("all");
  const [
    callFilters,
    setCallFilters,
  ] = useState<Record<string, any>>({});

  const isCallLoading = false;
  const initiateCall = async (_phone: string, _lang: string): Promise<{ call_id: string } | null> => null;
  const endCall = async (_callId: string): Promise<boolean> => false;

  // Active call (any ongoing call)
  const activeCall = callLogs.find(c => c.status === "ongoing");
  const [
    callMuted,
    setCallMuted,
  ] = useState(false);

  // Tick the active call duration every second
  useEffect(
    () => {
      if (!activeCall)
        return;
      const interval = setInterval(
        () => {
          setCallLogs(prev =>
            prev.map(c =>
              c.status === "ongoing"
                ? {
                    ...c, duration: c.duration + 1,
                  }
                : c));
        },
        1000,
      );
      return () => clearInterval(interval);
    },
    [activeCall?.id],
  );

  const [
    formData,
    setFormData,
  ] = useState<Partial<IVRPrompt>>({
    name: "",
    category: "greeting",
    translations: {
      en: "", ha: "", yo: "", ig: "", pcm: "",
    },
  });

  // Stats
  const totalCalls = callLogs.length;
  const completedCalls = callLogs.filter(c => c.status === "completed").length;
  const missedCalls = callLogs.filter(c => c.status === "missed").length;
  const avgDuration = Math.round(
    callLogs.filter(c => c.duration > 0).reduce(
      (sum, c) => sum + c.duration,
      0,
    )
    / Math.max(
      1,
      completedCalls,
    ),
  );

  const handleOpenCreate = () => {
    setSelectedPrompt(null);
    setFormData({
      name: "",
      category: "greeting",
      translations: {
        en: "", ha: "", yo: "", ig: "", pcm: "",
      },
    });
    setActiveLanguage("en");
    setIsPromptDialogOpen(true);
  };

  const handleOpenEdit = (prompt: IVRPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({ ...prompt });
    setActiveLanguage("en");
    setIsPromptDialogOpen(true);
  };

  const handleSavePrompt = () => {
    if (!formData.name || !formData.translations?.en) {
      toast.error("Please fill in prompt name and English text");
      return;
    }

    if (selectedPrompt) {
      setPrompts(
        prompts.map(p =>
          p.id === selectedPrompt.id
            ? {
                ...p, ...formData,
              } as IVRPrompt
            : p),
      );
      toast.success("IVR prompt updated");
    }
    else {
      const newPrompt: IVRPrompt = {
        id: `${Date.now()}`,
        name: formData.name!,
        category: formData.category as IVRPrompt["category"],
        translations: formData.translations as Record<Language, string>,
        keyPress: formData.keyPress,
      };
      setPrompts([
        ...prompts,
        newPrompt,
      ]);
      toast.success("IVR prompt created");
    }

    setIsPromptDialogOpen(false);
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    toast.success("IVR prompt deleted");
  };

  const updateTranslation = (lang: Language, text: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations, [lang]: text,
      } as Record<Language, string>,
    }));
  };

  const handleInitiateCall = async (phone: string) => {
    const result = await initiateCall(
      phone,
      defaultLanguage,
    );
    if (result?.call_id) {
      // Add to call logs
      const newLog: CallLog = {
        id: result.call_id,
        driverName: "Unknown Driver",
        driverPhone: phone,
        direction: "outbound",
        status: "ongoing",
        duration: 0,
        language: defaultLanguage,
        timestamp: new Date(),
      };
      setCallLogs(prev => [
        newLog,
        ...prev,
      ]);
    }
  };

  const handleMakeCall = async () => {
    if (!callPhoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }
    await handleInitiateCall(callPhoneNumber);
    setIsCallDialogOpen(false);
    setCallPhoneNumber("");
    setCallMessage("");
  };

  const handleEndCall = async (callId: string) => {
    const success = await endCall(callId);
    if (success) {
      setCallLogs(prev =>
        prev.map(log =>
          log.id === callId
            ? {
                ...log, status: "completed" as const,
              }
            : log));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCalls}</p>
                <p className="text-xs text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCalls}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <PhoneMissed className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{missedCalls}</p>
                <p className="text-xs text-muted-foreground">Missed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgDuration ? formatClockDuration(avgDuration) : "-"}</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="call-logs"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          <TabsTrigger value="ivr-prompts">IVR Prompts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent
          value="call-logs"
          className="space-y-4"
        >
          {/* Make Call action — top right, above the Recent Calls container */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCallDialogOpen(true)}
              disabled={isCallLoading}
            >
              {isCallLoading
                ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )
                : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
              Make Call
            </Button>
          </div>

          {/* Active Call modal — visible only while a call is in progress */}
          <Dialog
            open={!!activeCall}
            onOpenChange={(open) => {
              if (!open && activeCall)
                handleEndCall(activeCall.id);
            }}
          >
            <DialogContent className="max-w-md border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className="bg-success/20 text-success border-success/30 gap-1">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    On Call
                  </Badge>
                  {activeCall && (
                    <>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {activeCall.direction === "inbound" ? "Inbound" : "Outbound"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {LANGUAGES.find(l => l.code === activeCall.language)?.name}
                      </Badge>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="sr-only">Active voice call in progress</DialogDescription>
              </DialogHeader>
              {activeCall && (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <div className="relative h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                      <PhoneCall className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-semibold leading-tight">{activeCall.driverName}</p>
                    <p className="text-sm text-muted-foreground">{activeCall.driverPhone}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-mono font-semibold tabular-nums">
                      {formatClockDuration(activeCall.duration || 1)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                      Duration
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => setCallMuted(m => !m)}
                      aria-label={callMuted ? "Unmute" : "Mute"}
                    >
                      {callMuted
                        ? (
                            <MicOff className="h-5 w-5 text-destructive" />
                          )
                        : (
                            <Mic className="h-5 w-5" />
                          )}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-12 rounded-full px-6"
                      onClick={() => handleEndCall(activeCall.id)}
                      disabled={isCallLoading}
                    >
                      <PhoneMissed className="h-5 w-5 mr-2" />
                      End Call
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    Recent Calls
                  </CardTitle>
                  <CardDescription className="mt-1">Latest voice and IVR calls — review duration, outcome, and recordings.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Exporting call logs...")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <TableToolbar
                search={callSearch}
                onSearchChange={setCallSearch}
                searchPlaceholder="Search by driver or phone..."
                status={callStatusFilter}
                onStatusChange={setCallStatusFilter}
                statusOptions={[
                  {
                    value: "completed", label: "Completed",
                  },
                  {
                    value: "missed", label: "Missed",
                  },
                  {
                    value: "failed", label: "Failed",
                  },
                  {
                    value: "ongoing", label: "Ongoing",
                  },
                ]}
                filterEntity="calls"
                filterFields={[
                  {
                    type: "select",
                    key: "direction",
                    label: "Direction",
                    options: [
                      {
                        value: "inbound", label: "Inbound",
                      },
                      {
                        value: "outbound", label: "Outbound",
                      },
                    ],
                  },
                  {
                    type: "range",
                    key: "duration",
                    label: "Duration (seconds)",
                    placeholderFrom: "Min",
                    placeholderTo: "Max",
                  },
                  {
                    type: "date", key: "timeFrom", label: "Time from",
                  },
                  {
                    type: "date", key: "timeTo", label: "Time to",
                  },
                ]}
                filterValues={callFilters}
                onFiltersApply={setCallFilters}
              />
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredCalls = callLogs.filter((c) => {
                  const q = callSearch.trim().toLowerCase();
                  if (q && !`${c.driverName} ${c.driverPhone}`.toLowerCase().includes(q))
                    return false;
                  if (callStatusFilter !== "all" && c.status !== callStatusFilter)
                    return false;
                  const dir = callFilters.direction;
                  if (dir?.enabled && dir.value && c.direction !== dir.value)
                    return false;
                  const dur = callFilters.duration;
                  if (dur?.enabled) {
                    if (dur.from && c.duration < Number(dur.from))
                      return false;
                    if (dur.to && c.duration > Number(dur.to))
                      return false;
                  }
                  const tFrom = callFilters.timeFrom;
                  if (tFrom?.enabled && tFrom.date && c.timestamp < new Date(tFrom.date))
                    return false;
                  const tTo = callFilters.timeTo;
                  if (tTo?.enabled && tTo.date && c.timestamp > new Date(tTo.date))
                    return false;
                  return true;
                });
                return filteredCalls.length === 0
                  ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No call history</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                          Voice calls made to drivers will appear here
                        </p>
                        <Button
                          onClick={() => setIsCallDialogOpen(true)}
                          disabled={isCallLoading}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Make First Call
                        </Button>
                      </div>
                    )
                  : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Driver</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[140px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCalls.map(call => (
                            <TableRow key={call.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{call.driverName}</p>
                                  <p className="text-xs text-muted-foreground">{call.driverPhone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {call.direction === "inbound"
                                  ? (
                                      <div className="flex items-center gap-1 text-success">
                                        <PhoneIncoming className="h-4 w-4" />
                                        <span className="text-sm">Inbound</span>
                                      </div>
                                    )
                                  : (
                                      <div className="flex items-center gap-1 text-primary">
                                        <PhoneOutgoing className="h-4 w-4" />
                                        <span className="text-sm">Outbound</span>
                                      </div>
                                    )}
                              </TableCell>
                              <TableCell>
                                <Badge className={statusColors[call.status]}>
                                  <span className="flex items-center gap-1">
                                    {statusIcons[call.status]}
                                    {call.status}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell>{call.duration ? formatClockDuration(call.duration) : "-"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDayMonthTime(call.timestamp)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {call.notes || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCall(call)}
                                  >
                                    View Details
                                  </Button>
                                  {call.status === "ongoing"
                                    ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleEndCall(call.id)}
                                          disabled={isCallLoading}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      )
                                    : (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleInitiateCall(call.driverPhone)}
                                          disabled={isCallLoading}
                                        >
                                          <Phone className="h-4 w-4 text-success" />
                                        </Button>
                                      )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IVR Prompts Tab */}
        <TabsContent
          value="ivr-prompts"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                {LANGUAGES.length}
                {" "}
                Languages
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                {prompts.length}
                {" "}
                Prompts
              </Badge>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Prompt
            </Button>
          </div>

          {prompts.length === 0
            ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Mic className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No IVR prompts yet</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                      Create voice prompts with multi-language support for your IVR system
                    </p>
                    <Button onClick={handleOpenCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Prompt
                    </Button>
                  </CardContent>
                </Card>
              )
            : (
                <div className="grid gap-4">
                  {CATEGORIES.map((category) => {
                    const categoryPrompts = prompts.filter(p => p.category === category.value);
                    if (categoryPrompts.length === 0)
                      return null;

                    return (
                      <Card key={category.value}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge className={categoryColors[category.value]}>{category.label}</Badge>
                            <span className="text-muted-foreground font-normal">
                              (
                              {categoryPrompts.length}
                              {" "}
                              prompts)
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {categoryPrompts.map(prompt => (
                            <div
                              key={prompt.id}
                              className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{prompt.name}</p>
                                  {prompt.keyPress && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Press
                                      {" "}
                                      {prompt.keyPress}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {prompt.translations.en}
                                </p>
                                <div className="flex gap-1 mt-2">
                                  {LANGUAGES.map(lang => (
                                    <Badge
                                      key={lang.code}
                                      variant="outline"
                                      className={`text-xs ${
                                        prompt.translations[lang.code]
                                          ? "bg-success/10 text-success border-success/30"
                                          : "opacity-50"
                                      }`}
                                    >
                                      {lang.code.toUpperCase()}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toast.info("Playing audio preview...")}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEdit(prompt)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeletePrompt(prompt.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent
          value="settings"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                IVR Configuration
              </CardTitle>
              <CardDescription>Configure voice response system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable IVR System</Label>
                  <p className="text-sm text-muted-foreground">
                    Activate automated voice response for incoming calls
                  </p>
                </div>
                <Switch
                  checked={ivrEnabled}
                  onCheckedChange={setIvrEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={defaultLanguage}
                  onValueChange={v => setDefaultLanguage(v as Language)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem
                        key={lang.code}
                        value={lang.code}
                      >
                        {lang.name}
                        {" "}
                        (
                        {lang.nativeName}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Language used when caller preference is unknown
                </p>
              </div>

              <div className="space-y-4">
                <Label>Language Detection</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-detect from phone number</p>
                      <p className="text-xs text-muted-foreground">
                        Use carrier and region to guess language preference
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Remember caller preference</p>
                      <p className="text-xs text-muted-foreground">
                        Store language choice for future calls
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Language selection menu</p>
                      <p className="text-xs text-muted-foreground">
                        Let callers choose language at start of call
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => toast.success("Settings saved")}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Line</CardTitle>
              <CardDescription>Configure the driver support hotline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Support Number</Label>
                  <Input defaultValue="+234 700 FLEET PRO" />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Hotline</Label>
                  <Input defaultValue="+234 800 123 4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    defaultValue="06:00"
                  />
                  <Input
                    type="time"
                    defaultValue="22:00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Outside these hours, calls will be routed to emergency service
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Prompt Dialog */}
      <Dialog
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPrompt ? "Edit IVR Prompt" : "Create IVR Prompt"}
            </DialogTitle>
            <DialogDescription>
              Create voice prompts in multiple Nigerian languages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prompt Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={e => setFormData({
                    ...formData, name: e.target.value,
                  })}
                  placeholder="e.g., Welcome Greeting"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={v => setFormData({
                    ...formData, category: v as IVRPrompt["category"],
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Key Press (Optional)</Label>
              <Input
                value={formData.keyPress || ""}
                onChange={e => setFormData({
                  ...formData, keyPress: e.target.value,
                })}
                placeholder="e.g., 1, 2, 0"
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                The key that triggers this prompt in the IVR menu
              </p>
            </div>

            <div className="space-y-3">
              <Label>Voice Prompts</Label>
              <Tabs
                value={activeLanguage}
                onValueChange={v => setActiveLanguage(v as Language)}
              >
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  {LANGUAGES.map(lang => (
                    <TabsTrigger
                      key={lang.code}
                      value={lang.code}
                      className="flex-1 min-w-[100px]"
                    >
                      {lang.name}
                      {formData.translations?.[lang.code] && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-success" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LANGUAGES.map(lang => (
                  <TabsContent
                    key={lang.code}
                    value={lang.code}
                    className="mt-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{lang.nativeName}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Mic className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                      </div>
                      <Textarea
                        value={formData.translations?.[lang.code] || ""}
                        onChange={e => updateTranslation(
                          lang.code,
                          e.target.value,
                        )}
                        placeholder={`Enter ${lang.name} voice prompt...`}
                        rows={4}
                      />
                      {lang.code !== "en" && formData.translations?.en && (
                        <p className="text-xs text-muted-foreground">
                          Reference (English):
                          {" "}
                          {formData.translations.en}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPromptDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePrompt}>
              {selectedPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Call Dialog */}
      <Dialog
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Voice Call</DialogTitle>
            <DialogDescription>
              Enter the phone number to call. The active call view will open once connected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="call-phone">Phone Number</Label>
              <Input
                id="call-phone"
                placeholder="+234 801 234 5678"
                value={callPhoneNumber}
                onChange={e => setCallPhoneNumber(e.target.value)}
                autoFocus
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCallDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMakeCall}
              disabled={isCallLoading || !callPhoneNumber}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {isCallLoading
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calling...
                    </>
                  )
                : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Make Call
                    </>
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Details Dialog */}
      <Dialog
        open={!!selectedCall}
        onOpenChange={open => !open && setSelectedCall(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary" />
              Call Details
            </DialogTitle>
            <DialogDescription>
              Full record of the selected call
            </DialogDescription>
          </DialogHeader>

          {selectedCall && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Driver</p>
                <p className="font-semibold text-base">{selectedCall.driverName}</p>
                <p className="text-sm font-mono text-muted-foreground">{selectedCall.driverPhone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Direction</p>
                  <div className="flex items-center gap-1">
                    {selectedCall.direction === "inbound"
                      ? (
                          <>
                            <PhoneIncoming className="h-4 w-4 text-success" />
                            {" "}
                            Inbound
                          </>
                        )
                      : (
                          <>
                            <PhoneOutgoing className="h-4 w-4 text-primary" />
                            {" "}
                            Outbound
                          </>
                        )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge className={statusColors[selectedCall.status]}>
                    <span className="flex items-center gap-1">
                      {statusIcons[selectedCall.status]}
                      {selectedCall.status}
                    </span>
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="font-mono">{selectedCall.duration ? formatClockDuration(selectedCall.duration) : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
                  <p>{formatDateTime(selectedCall.timestamp)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                <p className="text-sm rounded-md border border-border/60 bg-muted/20 p-3 min-h-[60px]">
                  {selectedCall.notes || <span className="text-muted-foreground italic">No notes recorded</span>}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCall(null)}
            >
              Close
            </Button>
            {selectedCall && selectedCall.status !== "ongoing" && (
              <Button
                onClick={() => {
                  handleInitiateCall(selectedCall.driverPhone);
                  setSelectedCall(null);
                }}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Back
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
