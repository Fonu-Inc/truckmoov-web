import type { FilterValues } from "@/components/shadcn/table-toolbar";

import {
  formatClockDuration, formatDateTime, formatDayMonthTime,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Clock, Download, FileText, Loader2, Mic, Minus, Pause, Play, Star, ThumbsDown, ThumbsUp,
} from "lucide-react";
import {
  useCallback, useEffect, useState,
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
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { useAuthStore } from "@/stores/authStore";

type Language = "en" | "ha" | "yo" | "ig" | "pcm";

type CallRecording = {
  id: string;
  callId: string;
  driverName: string;
  driverPhone: string;
  timestamp: Date;
  duration: number;
  language: Language;
  recordingUrl?: string;
  transcription?: TranscriptionData;
};

type TranscriptionData = {
  text: string;
  summary: string;
  qualityScore: number;
  sentiment: "positive" | "neutral" | "negative";
  keyTopics: string[];
  issues?: string[];
};

const sentimentIcons = {
  positive: <ThumbsUp className="h-4 w-4 text-success" />,
  neutral: <Minus className="h-4 w-4 text-warning" />,
  negative: <ThumbsDown className="h-4 w-4 text-destructive" />,
};

const sentimentColors = {
  positive: "bg-success/20 text-success",
  neutral: "bg-warning/20 text-warning",
  negative: "bg-destructive/20 text-destructive",
};

export function CallRecordingsManager() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || "";

  const [
    recordings,
    setRecordings,
  ] = useState<CallRecording[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    selectedRecording,
    setSelectedRecording,
  ] = useState<CallRecording | null>(null);
  const [
    isTranscriptDialogOpen,
    setIsTranscriptDialogOpen,
  ] = useState(false);
  const [
    isPlaying,
    setIsPlaying,
  ] = useState<string | null>(null);

  const isTranscribing = false;
  const transcribeCall = async (_url: string, _callId: string, _lang: string): Promise<null> => null;

  // Fetch real recordings from driver_call_logs
  const fetchRecordings = useCallback(
    async () => {
      setRecordings([]);
      setIsLoading(false);
    },
    [tenantId],
  );

  useEffect(
    () => {
      fetchRecordings();
    },
    [fetchRecordings],
  );

  // Stats
  const totalRecordings = recordings.length;
  const transcribedCount = recordings.filter(r => r.transcription).length;
  const avgQuality
    = recordings
      .filter(r => r.transcription)
      .reduce(
        (sum, r) => sum + (r.transcription?.qualityScore || 0),
        0,
      )
      / Math.max(
        1,
        transcribedCount,
      );

  const [
    recSearch,
    setRecSearch,
  ] = useState("");
  const [
    recFilters,
    setRecFilters,
  ] = useState<FilterValues>({});

  const filteredRecordings = recordings.filter((r) => {
    const q = recSearch.trim().toLowerCase();
    if (q && !`${r.driverName} ${r.driverPhone}`.toLowerCase().includes(q))
      return false;
    const dur = recFilters.duration;
    if (dur?.enabled) {
      if (dur.from && r.duration < Number(dur.from))
        return false;
      if (dur.to && r.duration > Number(dur.to))
        return false;
    }
    const dr = recFilters.date;
    if (dr?.enabled) {
      if (dr.dateFrom && r.timestamp < new Date(dr.dateFrom))
        return false;
      if (dr.dateTo && r.timestamp > new Date(dr.dateTo))
        return false;
    }
    return true;
  });

  const handleTranscribe = async (recording: CallRecording) => {
    if (!recording.recordingUrl) {
      toast.error("No recording available to transcribe");
      return;
    }

    const result = await transcribeCall(
      recording.recordingUrl,
      recording.callId,
      recording.language,
    );

    if (result) {
      setRecordings(prev =>
        prev.map(r =>
          r.id === recording.id
            ? {
                ...r,
                transcription: {
                  text: result.transcription,
                  summary: result.summary,
                  qualityScore: result.qualityScore,
                  sentiment: result.sentiment,
                  keyTopics: result.keyTopics,
                  issues: result.issues,
                },
              }
            : r));
    }
  };

  const handleViewTranscript = (recording: CallRecording) => {
    setSelectedRecording(recording);
    setIsTranscriptDialogOpen(true);
  };

  const handlePlayRecording = (recordingId: string) => {
    if (isPlaying === recordingId) {
      setIsPlaying(null);
      toast.info("Playback stopped");
    }
    else {
      setIsPlaying(recordingId);
      toast.info("Playing recording...");
      // Simulate playback ending
      setTimeout(
        setIsPlaying,
        5000,
        null,
      );
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 8)
      return "text-success";
    if (score >= 6)
      return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRecordings}</p>
                <p className="text-xs text-muted-foreground">Total Recordings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transcribedCount}</p>
                <p className="text-xs text-muted-foreground">Transcribed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgQuality.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Quality Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recordings Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Call Recordings
              </CardTitle>
              <CardDescription>
                Review call recordings and AI-powered transcriptions for quality assurance
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Exporting recordings...")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <TableToolbar
            search={recSearch}
            onSearchChange={setRecSearch}
            searchPlaceholder="Search by driver or phone..."
            filterEntity="recordings"
            filterFields={[
              {
                type: "range",
                key: "duration",
                label: "Duration (seconds)",
                placeholderFrom: "Min",
                placeholderTo: "Max",
              },
              {
                type: "daterange", key: "date", label: "Date", placeholderFrom: "From", placeholderTo: "To",
              },
            ]}
            filterValues={recFilters}
            onFiltersApply={setRecFilters}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">Loading recordings...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                : filteredRecordings.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No call recordings found. Recordings will appear here when drivers are called.
                        </TableCell>
                      </TableRow>
                    )
                  : filteredRecordings.map(recording => (
                      <TableRow key={recording.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{recording.driverName}</p>
                            <p className="text-xs text-muted-foreground">
                              {recording.driverPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDayMonthTime(recording.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>{formatClockDuration(recording.duration)}</TableCell>
                        <TableCell>
                          {recording.transcription
                            ? (
                                <div className="flex items-center gap-1">
                                  <Star
                                    className={`h-4 w-4 ${getQualityColor(
                                      recording.transcription.qualityScore,
                                    )}`}
                                  />
                                  <span className={getQualityColor(recording.transcription.qualityScore)}>
                                    {recording.transcription.qualityScore}
                                    /10
                                  </span>
                                </div>
                              )
                            : (
                                <span className="text-muted-foreground">-</span>
                              )}
                        </TableCell>
                        <TableCell>
                          {recording.transcription
                            ? (
                                <Badge className={sentimentColors[recording.transcription.sentiment]}>
                                  <span className="flex items-center gap-1">
                                    {sentimentIcons[recording.transcription.sentiment]}
                                    {recording.transcription.sentiment}
                                  </span>
                                </Badge>
                              )
                            : (
                                <span className="text-muted-foreground">-</span>
                              )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlayRecording(recording.id)}
                              disabled={!recording.recordingUrl}
                            >
                              {isPlaying === recording.id
                                ? (
                                    <Pause className="h-4 w-4" />
                                  )
                                : (
                                    <Play className="h-4 w-4" />
                                  )}
                            </Button>
                            {recording.transcription
                              ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewTranscript(recording)}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )
                              : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTranscribe(recording)}
                                    disabled={isTranscribing || !recording.recordingUrl}
                                  >
                                    {isTranscribing
                                      ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        )
                                      : (
                                          <FileText className="h-4 w-4" />
                                        )}
                                  </Button>
                                )}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!recording.recordingUrl}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog
        open={isTranscriptDialogOpen}
        onOpenChange={setIsTranscriptDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Call Transcription
            </DialogTitle>
            <DialogDescription>
              {selectedRecording && (
                <span>
                  {selectedRecording.driverName}
                  {" "}
                  -
                  {formatDateTime(selectedRecording.timestamp)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRecording?.transcription && (
            <div className="space-y-6">
              {/* Quality Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className={`h-5 w-5 ${getQualityColor(selectedRecording.transcription.qualityScore)}`} />
                      <span className={`text-2xl font-bold ${getQualityColor(selectedRecording.transcription.qualityScore)}`}>
                        {selectedRecording.transcription.qualityScore}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Quality Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Badge className={`${sentimentColors[selectedRecording.transcription.sentiment]} mb-1`}>
                      <span className="flex items-center gap-1">
                        {sentimentIcons[selectedRecording.transcription.sentiment]}
                        {selectedRecording.transcription.sentiment}
                      </span>
                    </Badge>
                    <p className="text-xs text-muted-foreground">Sentiment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{formatClockDuration(selectedRecording.duration)}</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedRecording.transcription.summary}</p>
                </CardContent>
              </Card>

              {/* Key Topics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Key Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecording.transcription.keyTopics.map((topic, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Issues */}
              {selectedRecording.transcription.issues && selectedRecording.transcription.issues.length > 0 && (
                <Card className="border-warning">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      Quality Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedRecording.transcription.issues.map((issue, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Full Transcription */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Full Transcription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedRecording.transcription.text}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
