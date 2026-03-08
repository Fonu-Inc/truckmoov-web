import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job, Vehicle, Driver } from "@/types";
import { mockVehicles, mockDrivers } from "@/data/mockData";
import { useDriverIVR } from "@/hooks/useDriverIVR";
import { useJobMatching, MatchResult } from "@/hooks/useJobMatching";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Truck, User, MapPin, Star, Clock, CheckCircle, 
  Sparkles, Route, MessageSquare, Phone, PhoneCall, Brain, 
  AlertCircle, ShieldCheck, Lock, ListChecks, Eye, Zap, Info
} from "lucide-react";
import { toast } from "sonner";

interface JobMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onAssign: (vehicleId: string, driverId: string) => void;
}

export function JobMatchingDialog({ open, onOpenChange, job, onAssign }: JobMatchingDialogProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingIVR, setIsSendingIVR] = useState(false);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [manualVehicleId, setManualVehicleId] = useState<string>("");
  const [manualDriverId, setManualDriverId] = useState<string>("");
  
  const { notifyNewJob, notifyUrgent, isLoading: isIVRLoading } = useDriverIVR();
  const { format: formatCurrency } = useCurrency();
  
  // Use the new unified hook with mode control
  const { 
    matches, 
    isMatching, 
    matchProgress, 
    analysis, 
    provider, 
    model, 
    overallConfidence, 
    requiresApproval,
    runMatching, 
    reset,
    error: matchingError,
    // Mode control
    effectiveMode,
    modeDowngraded,
    isSimulationMode,
    isLiveMode,
    // Execution capabilities from server
    canSendOffers,
    canTriggerMessaging,
    canAssign: canAssignFromServer,
    // Role-based permissions
    canRunAIMatching,
    canViewAIResults,
    canRequestLiveMode,
    defaultMode,
    // Stats
    eligibleVehicleCount,
    eligibleDriverCount,
  } = useJobMatching();

  const isManualMode = mode === "manual";

  // Available vehicles and drivers for manual selection
  const availableVehicles = mockVehicles.filter(v => v.status === 'active');
  const availableDrivers = mockDrivers.filter(d => d.status === 'available' || d.status === 'active');

  useEffect(() => {
    if (open && job) {
      setMode(canRunAIMatching ? "ai" : "manual");
      setManualVehicleId("");
      setManualDriverId("");
      setSelectedMatch(null);
      
      if (canRunAIMatching) {
        // Request matching with the role's default mode
        runMatching(job, mockVehicles, mockDrivers, defaultMode);
      }
    } else {
      reset();
      setMode("ai");
    }
  }, [open, job, canRunAIMatching, defaultMode]);

  // LIVE mode: Actual dispatch actions
  const handleAssignViaWhatsApp = async (match: MatchResult) => {
    if (isSimulationMode) {
      toast.error('Simulation mode', {
        description: 'Cannot send offers in simulation mode. Switch to a dispatcher role for live execution.',
      });
      return;
    }

    setSelectedMatch(match);
    setIsSendingWhatsApp(true);

    try {
      // In LIVE mode, this would trigger actual WhatsApp API
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Job assignment sent to ${match.driver.name} via WhatsApp`, {
        description: `Awaiting confirmation for job ${job?.reference}`,
      });

      onAssign(match.vehicle.id, match.driver.id);
      onOpenChange(false);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleAssignViaIVR = async (match: MatchResult, urgent: boolean = false) => {
    if (isSimulationMode) {
      toast.error('Simulation mode', {
        description: 'Cannot trigger IVR calls in simulation mode. Switch to a dispatcher role for live execution.',
      });
      return;
    }

    setSelectedMatch(match);
    setIsSendingIVR(true);

    try {
      const jobDetails = {
        pickup: job!.pickup.address,
        dropoff: job!.delivery.address,
        cargo: job!.cargo.type,
        amount: job!.amount,
        deadline: job!.deadline?.toISOString(),
      };

      const result = urgent
        ? await notifyUrgent(
            match.driver.phone || '+2348012345678',
            jobDetails,
            { driverName: match.driver.name, jobId: job!.id, language: 'en' }
          )
        : await notifyNewJob(
            match.driver.phone || '+2348012345678',
            jobDetails,
            { driverName: match.driver.name, jobId: job!.id, language: 'en' }
          );

      if (result?.success) {
        toast.success(`IVR call initiated to ${match.driver.name}`, {
          description: urgent 
            ? `Urgent notification with retry - Call ID: ${result.callId}`
            : `Awaiting driver response via phone - Call ID: ${result.callId}`,
        });
        onAssign(match.vehicle.id, match.driver.id);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to initiate IVR call');
    } finally {
      setIsSendingIVR(false);
    }
  };

  // Manual assignment (only in LIVE mode)
  const handleManualAssign = (method: 'whatsapp' | 'ivr' | 'urgent') => {
    if (isSimulationMode) {
      toast.error('Simulation mode', {
        description: 'Cannot execute assignments in simulation mode.',
      });
      return;
    }

    if (!manualVehicleId || !manualDriverId) {
      toast.error('Please select both a vehicle and driver');
      return;
    }

    const vehicle = availableVehicles.find(v => v.id === manualVehicleId);
    const driver = availableDrivers.find(d => d.id === manualDriverId);

    if (!vehicle || !driver) return;

    const manualMatch: MatchResult = {
      vehicle,
      driver,
      matchScore: 100,
      confidence: 1,
      estimatedTime: 'Manual assignment',
      distance: 0,
      reasons: ['Manually selected by dispatcher'],
    };

    if (method === 'whatsapp') {
      handleAssignViaWhatsApp(manualMatch);
    } else if (method === 'ivr') {
      handleAssignViaIVR(manualMatch, false);
    } else {
      handleAssignViaIVR(manualMatch, true);
    }
  };

  if (!job) return null;

  const providerInfo = provider ? {
    provider,
    model: model || 'unknown',
    confidence: overallConfidence || 0.75,
    requiresApproval,
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isManualMode ? (
              <ListChecks className="h-5 w-5 text-primary" />
            ) : (
              <Brain className="h-5 w-5 text-primary" />
            )}
            {isManualMode ? 'Manual Dispatch' : 'AI Load Matching'}
            
            {/* Mode Badge */}
            <Badge 
              variant={isSimulationMode ? "secondary" : "default"}
              className={`ml-2 ${isSimulationMode ? 'bg-muted text-muted-foreground' : 'bg-success/20 text-success border-success/30'}`}
            >
              {isSimulationMode ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Simulation
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </>
              )}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {isManualMode ? (
              <>Manually select vehicle and driver for job {job.reference}</>
            ) : (
              <>
                AI-powered matching for job {job.reference}
                {providerInfo && (
                  <Badge variant="outline" className="ml-2 capitalize">
                    {providerInfo.provider} / {providerInfo.model}
                  </Badge>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Simulation Mode Warning */}
          {isSimulationMode && !isManualMode && (
            <Alert className="bg-muted/50 border-muted-foreground/20">
              <Info className="h-4 w-4" />
              <AlertTitle>Simulation Mode</AlertTitle>
              <AlertDescription>
                You are viewing AI matching results in read-only mode. 
                {modeDowngraded 
                  ? ' Your role (Admin) is restricted to simulation only.'
                  : ' Dispatchers can execute assignments in live mode.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Mode Tabs */}
          <Tabs
            value={mode}
            onValueChange={(v) => {
              const nextMode: "ai" | "manual" = v === "manual" ? "manual" : "ai";
              setMode(nextMode);

              if (nextMode === "ai" && job && canRunAIMatching && !isMatching && matches.length === 0) {
                runMatching(job, mockVehicles, mockDrivers, defaultMode);
              }
            }}
          >
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger value="ai" disabled={!canRunAIMatching || !canViewAIResults} className="flex-1">
                <Brain className="h-4 w-4 mr-2" />
                AI
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                <ListChecks className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Error Alert */}
          {matchingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>AI Matching Unavailable</AlertTitle>
              <AlertDescription>
                {matchingError}. You can manually select a vehicle and driver below.
              </AlertDescription>
            </Alert>
          )}

          {/* Job Summary */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{job.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{job.delivery.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(job.amount)}</p>
                  <p className="text-sm text-muted-foreground">{job.cargo.weight} tons</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Selection Mode */}
          {isManualMode && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Manual Selection
                  {isSimulationMode && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Read-only
                    </Badge>
                  )}
                </h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Select Vehicle
                    </Label>
                    <Select value={manualVehicleId} onValueChange={setManualVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vehicle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{v.registrationNumber}</span>
                              <span className="text-muted-foreground">
                                - {v.make} {v.model} ({v.capacity}t)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Select Driver
                    </Label>
                    <Select value={manualDriverId} onValueChange={setManualDriverId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{d.name}</span>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Star className="h-3 w-3 text-warning fill-current" />
                                <span>{d.rating.toFixed(1)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs capitalize">
                                {d.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {manualVehicleId && manualDriverId && (
                  <Alert className="bg-muted/30">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertDescription>
                      Ready to dispatch: {availableVehicles.find(v => v.id === manualVehicleId)?.registrationNumber} with {availableDrivers.find(d => d.id === manualDriverId)?.name}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Matching Progress */}
          {isMatching && !isManualMode && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium">AI analyzing fleet data...</span>
              </div>
              <Progress value={matchProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {matchProgress < 40 && "Processing vehicle locations and capacity..."}
                {matchProgress >= 40 && matchProgress < 70 && "Evaluating driver ratings and availability..."}
                {matchProgress >= 70 && matchProgress < 100 && "AI calculating optimal matches..."}
                {matchProgress === 100 && "Generating AI recommendations..."}
              </p>
            </div>
          )}

          {/* AI Analysis */}
          {!isMatching && !isManualMode && analysis && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{analysis}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confidence & Approval Info */}
          {!isMatching && !isManualMode && matches.length > 0 && providerInfo && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={providerInfo.confidence >= 0.8 ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {(providerInfo.confidence * 100).toFixed(0)}% Confidence
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {eligibleVehicleCount} vehicles / {eligibleDriverCount} drivers eligible
                </Badge>
              </div>
              {providerInfo.requiresApproval && isLiveMode && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Dispatcher approval required</span>
                </div>
              )}
            </div>
          )}

          {/* Match Results */}
          {!isMatching && !isManualMode && matches.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Top Matches Found
              </h4>
              
              {matches.map((match, index) => (
                <Card 
                  key={match.vehicle.id} 
                  className={`bg-muted/30 border-border/50 transition-all cursor-pointer hover:border-primary/50 ${
                    selectedMatch?.vehicle.id === match.vehicle.id ? "border-primary ring-1 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          index === 0 ? "bg-gradient-to-br from-primary to-accent" : "bg-muted"
                        }`}>
                          <Truck className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{match.vehicle.make} {match.vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">{match.vehicle.registrationNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          match.matchScore >= 95 ? "bg-success/20 text-success border-success/30" :
                          match.matchScore >= 90 ? "bg-primary/20 text-primary border-primary/30" :
                          "bg-warning/20 text-warning border-warning/30"
                        }`}>
                          {match.matchScore}% Match
                        </Badge>
                        {index === 0 && (
                          <p className="text-xs text-primary mt-1">Recommended</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {match.driver.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{match.driver.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning fill-current" />
                            <span className="text-xs">{match.driver.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Route className="h-4 w-4" />
                        <span>{match.distance} km</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{match.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {match.reasons.map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Matches */}
          {!isMatching && !isManualMode && matches.length === 0 && canRunAIMatching && !matchingError && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No AI Matches Found</p>
              <p className="text-sm text-muted-foreground mb-4">
                AI couldn't find optimal matches. You can select manually.
              </p>
              <Button variant="outline" onClick={() => setMode("manual")}>
                <ListChecks className="h-4 w-4 mr-2" />
                Switch to Manual Selection
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            {/* Manual mode action buttons - ONLY in LIVE mode */}
            {isManualMode && manualVehicleId && manualDriverId && isLiveMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="gradient" 
                  onClick={() => handleManualAssign('whatsapp')}
                  disabled={isSendingWhatsApp || isSendingIVR}
                  className="flex-1"
                >
                  {isSendingWhatsApp ? <>Sending...</> : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleManualAssign('ivr')}
                  disabled={isSendingWhatsApp || isSendingIVR || isIVRLoading}
                  className="flex-1"
                >
                  {isSendingIVR ? <>Calling...</> : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      IVR Call
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleManualAssign('urgent')}
                  disabled={isSendingWhatsApp || isSendingIVR || isIVRLoading}
                  className="flex-1"
                >
                  {isSendingIVR ? <>Calling...</> : (
                    <>
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Urgent Call
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Manual mode - SIMULATION only shows disabled buttons */}
            {isManualMode && manualVehicleId && manualDriverId && isSimulationMode && (
              <Alert className="bg-muted/30">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Simulation mode: Action buttons are disabled. Dispatchers can execute assignments in live mode.
                </AlertDescription>
              </Alert>
            )}

            {/* AI mode action buttons - ONLY in LIVE mode */}
            {!isManualMode && selectedMatch && isLiveMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="gradient" 
                  onClick={() => handleAssignViaWhatsApp(selectedMatch)}
                  disabled={isSendingWhatsApp || isSendingIVR}
                  className="flex-1"
                >
                  {isSendingWhatsApp ? <>Sending...</> : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleAssignViaIVR(selectedMatch, false)}
                  disabled={isSendingWhatsApp || isSendingIVR || isIVRLoading}
                  className="flex-1"
                >
                  {isSendingIVR ? <>Calling...</> : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      IVR Call
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAssignViaIVR(selectedMatch, true)}
                  disabled={isSendingWhatsApp || isSendingIVR || isIVRLoading}
                  className="flex-1"
                >
                  {isSendingIVR ? <>Calling...</> : (
                    <>
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Urgent Call
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* AI mode - SIMULATION only shows disabled message */}
            {!isManualMode && selectedMatch && isSimulationMode && (
              <Alert className="bg-muted/30">
                <Eye className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Preview only. Dispatchers can execute this assignment in live mode.</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {isSimulationMode ? 'Close Preview' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
