import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Driver } from "../api/types";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { Mail, Phone, Star, Truck, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { commIcons } from "../lib/commIcons";

type DriverDetailSheetProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 driver: Driver | null
}

export default function DriverDetailSheet({ open, onOpenChange, driver }: DriverDetailSheetProps) {
 return (
  <Sheet open={open} onOpenChange={onOpenChange}>
   <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-card border-border">
    <SheetHeader className="space-y-4">
     <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
       <AppAvatar value={driver?.name} />
       <div>
        <SheetTitle className="text-xl">{driver?.name}</SheetTitle>
        <div className="flex items-center gap-2 mt-1">
         <StatusBadge status={driver?.status} />
         {/* <div className="flex items-center gap-1 text-warning">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
         </div> */}
        </div>
       </div>
      </div>
     </div>

     {/* Quick Score Summary */}
     {/* <div className="grid grid-cols-3 gap-3 pt-2">
      <Card className="bg-muted/30 border-border/50">
       <CardContent className="p-3 text-center">
        <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
        <p className="text-xl font-bold">{overallBehaviorScore}</p>
        <p className="text-xs text-muted-foreground">Behavior</p>
       </CardContent>
      </Card>
      <Card className={`border-border/50 ${fatigueScore > 5 ? "bg-warning/10" : "bg-muted/30"}`}>
       <CardContent className="p-3 text-center">
        <Brain className="h-5 w-5 mx-auto mb-1 text-primary" />
        <p className="text-xl font-bold">{fatigueScore}/10</p>
        <p className="text-xs text-muted-foreground">Fatigue</p>
       </CardContent>
      </Card>
      <Card className="bg-muted/30 border-border/50">
       <CardContent className="p-3 text-center">
        <Shield className="h-5 w-5 mx-auto mb-1 text-success" />
        <p className="text-xl font-bold">{driverScore?.eventBreakdown.harshBraking ?? 0}</p>
        <p className="text-xs text-muted-foreground">Alerts</p>
       </CardContent>
      </Card>
     </div> */}
    </SheetHeader>

    <Tabs defaultValue="overview" className="mt-6">
     <TabsList className="grid w-full grid-cols-4 bg-muted/50">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      {/* <TabsTrigger value="behavior">Behavior</TabsTrigger>
      <TabsTrigger value="fatigue">Fatigue</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger> */}
     </TabsList>

     <TabsContent value="overview" className="space-y-4 mt-4">
      {/* Contact Information */}
      <Card className="bg-muted/30 border-border/50">
       <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
         <User className="h-4 w-4 text-primary" />
         Contact Information
        </CardTitle>
       </CardHeader>
       <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
         <Phone className="h-4 w-4 text-muted-foreground" />
         <span>{driver?.phone}</span>
        </div>
        {driver?.email && (
         <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{driver?.email}</span>
         </div>
        )}
        <div className="flex items-center gap-2">
         {commIcons[driver?.communicationPreference]}
         <span className="capitalize">Preferred: {driver?.communicationPreference}</span>
        </div>
        {/* <div className="flex items-center gap-2">
         <Truck className="h-4 w-4 text-muted-foreground" />
         <span>{driver.totalTrips} total trips</span>
        </div> */}
       </CardContent>
      </Card>

      {/* License Information */}
      {/* <Card className={`border-border/50 ${licenseWarning ? "bg-warning/10 border-warning/30" : "bg-muted/30"}`}>
       <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
         <CreditCard className="h-4 w-4 text-primary" />
         License Information
         {licenseWarning && <AlertTriangle className="h-4 w-4 text-warning" />}
        </CardTitle>
       </CardHeader>
       <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
         <p className="text-muted-foreground">License Number</p>
         <p className="font-medium">{driver.licenseNumber}</p>
        </div>
        <div>
         <p className="text-muted-foreground">Expiry Date</p>
         <p className={`font-medium ${licenseWarning ? "text-warning" : ""}`}>
          {format(new Date(driver.licenseExpiry), "MMM dd, yyyy")}
         </p>
        </div>
        <div className="col-span-2">
         <p className="text-muted-foreground mb-1">Days Until Expiry</p>
         <div className="flex items-center gap-3">
          <Progress
           value={Math.min(100, (daysUntilExpiry / 365) * 100)}
           className="flex-1 h-2"
          />
          <span className={`text-sm font-medium ${licenseWarning ? "text-warning" : ""}`}>
           {daysUntilExpiry} days
          </span>
         </div>
        </div>
       </CardContent>
      </Card> */}

      {/* Unified Safety Overview */}
      {/* <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20">
       <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
         <Award className="h-4 w-4 text-primary" />
         Safety Overview
        </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <ScoreGauge score={overallBehaviorScore} label="Overall" size="sm" />
          <div>
           <p className="font-medium">Behavior Score</p>
           <p className="text-xs text-muted-foreground flex items-center gap-1">
            {getTrendIcon(driverScore?.trend)}
            {driverScore?.trend || 'stable'}
           </p>
          </div>
         </div>
         <div className="flex items-center gap-3">
          <FatigueGauge score={fatigueScore} />
          <div>
           <p className="font-medium">Fatigue Level</p>
           <p className="text-xs text-muted-foreground">
            {fatigueScore <= 3 ? 'Low risk' : fatigueScore <= 5 ? 'Moderate' : 'High risk'}
           </p>
          </div>
         </div>
        </div>
       </CardContent>
      </Card> */}
     </TabsContent>

     {/* <TabsContent value="behavior" className="space-y-4 mt-4">
      {driverScore ? (
       <>
        <Card className="bg-muted/30 border-border/50">
         <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
           <Activity className="h-4 w-4 text-primary" />
           Driving Behavior Scores
          </CardTitle>
          <CardDescription>
           Based on {driverScore.totalEvents} recorded events
          </CardDescription>
         </CardHeader>
         <CardContent>
          <div className="grid grid-cols-4 gap-3 mb-4">
           <ScoreGauge score={driverScore.brakingScore} label="Braking" />
           <ScoreGauge score={driverScore.accelerationScore} label="Accel" />
           <ScoreGauge score={driverScore.corneringScore} label="Cornering" />
           <ScoreGauge score={driverScore.speedingScore} label="Speed" />
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
           <div className="p-2 rounded-lg bg-destructive/10">
            <p className="font-semibold text-destructive">{driverScore.eventBreakdown.harshBraking}</p>
            <p className="text-muted-foreground">Hard Brake</p>
           </div>
           <div className="p-2 rounded-lg bg-warning/10">
            <p className="font-semibold text-warning">{driverScore.eventBreakdown.harshAcceleration}</p>
            <p className="text-muted-foreground">Hard Accel</p>
           </div>
           <div className="p-2 rounded-lg bg-primary/10">
            <p className="font-semibold text-primary">{driverScore.eventBreakdown.harshCornering}</p>
            <p className="text-muted-foreground">Sharp Turn</p>
           </div>
           <div className="p-2 rounded-lg bg-accent/10">
            <p className="font-semibold text-accent">{driverScore.eventBreakdown.overspeeding}</p>
            <p className="text-muted-foreground">Speeding</p>
           </div>
          </div>
         </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50">
         <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
         </CardHeader>
         <CardContent>
          <ScrollArea className="h-[200px] pr-2">
           <div className="space-y-2">
            {driverEvents.length > 0 ? driverEvents.map((event) => (
             <div key={event.id} className={`p-2 rounded-lg border ${getSeverityColor(event.severity)}`}>
              <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                {getEventIcon(event.eventType)}
                <span className="text-xs font-medium capitalize">
                 {event.eventType.replace(/_/g, ' ')}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">
                 {event.severity}
                </Badge>
               </div>
               <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
               </span>
              </div>
              {event.speed && (
               <p className="text-[10px] mt-1 text-muted-foreground">
                Speed: {event.speed} km/h
               </p>
              )}
             </div>
            )) : (
             <div className="text-center py-6">
              <Shield className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-sm text-muted-foreground">No behavior events recorded</p>
             </div>
            )}
           </div>
          </ScrollArea>
         </CardContent>
        </Card>
       </>
      ) : (
       <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-8 text-center">
         <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
         <p className="font-medium">No Behavior Data</p>
         <p className="text-sm text-muted-foreground">
          Behavior metrics will appear once the driver has telemetry events
         </p>
        </CardContent>
       </Card>
      )}
     </TabsContent> */}

     {/* <TabsContent value="fatigue" className="space-y-4 mt-4">
      <Card className={`border-border/50 ${latestFatigueAlert && Number(latestFatigueAlert.fatigue_score) > 5 ? "bg-warning/10 border-warning/30" : "bg-muted/30"}`}>
       <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
         <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Current Fatigue Status
         </CardTitle>
         <Button
          size="sm"
          variant="outline"
          onClick={handleRunFatigueAnalysis}
          disabled={isRunningAnalysis || isAnalyzing || driverDeviceIds.length === 0}
          className="gap-1.5 h-7 text-xs"
         >
          {isRunningAnalysis || isAnalyzing ? (
           <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing...
           </>
          ) : (
           <>
            <RefreshCw className="h-3 w-3" />
            Run Analysis
           </>
          )}
         </Button>
        </div>
       </CardHeader>
       <CardContent>
        {latestFatigueAlert ? (
         <div className="space-y-4">
          <div className="flex items-center gap-4">
           <FatigueGauge score={Number(latestFatigueAlert.fatigue_score)} />
           <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
             <Badge className={riskLevelColors[latestFatigueAlert.risk_level]}>
              {latestFatigueAlert.risk_level} risk
             </Badge>
             <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(latestFatigueAlert.created_at), { addSuffix: true })}
             </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
             <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {latestFatigueAlert.driving_duration_minutes} min driving
             </div>
             <div className="flex items-center gap-1">
              <Coffee className="h-3 w-3" />
              Rest: {latestFatigueAlert.rest_compliance_score}/10
             </div>
            </div>
           </div>
          </div>

          {latestFatigueAlert.recommendations.length > 0 && (
           <>
            <Separator />
            <div>
             <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Shield className="h-3 w-3 text-success" />
              Recommendations
             </p>
             <ul className="space-y-1">
              {latestFatigueAlert.recommendations.slice(0, 3).map((rec, idx) => (
               <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-success mt-0.5">✓</span>
                {rec}
               </li>
              ))}
             </ul>
            </div>
           </>
          )}

          {latestFatigueAlert.ai_analysis && (
           <>
            <Separator />
            <div>
             <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Brain className="h-3 w-3 text-primary" />
              AI Analysis
             </p>
             <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              {latestFatigueAlert.ai_analysis}
             </p>
            </div>
           </>
          )}
         </div>
        ) : (
         <div className="text-center py-6">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No Fatigue Alerts</p>
          <p className="text-sm text-muted-foreground mb-4">
           Run an AI fatigue analysis to assess this driver's condition
          </p>
          <Button
           onClick={handleRunFatigueAnalysis}
           disabled={isRunningAnalysis || isAnalyzing || driverDeviceIds.length === 0}
           className="gap-2"
          >
           {isRunningAnalysis || isAnalyzing ? (
            <>
             <Loader2 className="h-4 w-4 animate-spin" />
             Analyzing...
            </>
           ) : (
            <>
             <Play className="h-4 w-4" />
             Run Fatigue Analysis
            </>
           )}
          </Button>
          {driverDeviceIds.length === 0 && (
           <p className="text-xs text-warning mt-2">
            No device assigned to this driver
           </p>
          )}
         </div>
        )}
       </CardContent>
      </Card>

      {driverFatigueAlerts.length > 1 && (
       <Card className="bg-muted/30 border-border/50">
        <CardHeader className="pb-3">
         <CardTitle className="text-sm font-medium">Fatigue History</CardTitle>
        </CardHeader>
        <CardContent>
         <ScrollArea className="h-[200px] pr-2">
          <div className="space-y-2">
           {driverFatigueAlerts.slice(1).map((alert) => (
            <div key={alert.id} className="p-2 rounded-lg border border-border/50 bg-muted/20">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
               <span className="text-sm font-medium">{alert.fatigue_score}/10</span>
               <Badge variant="outline" className={`text-[10px] h-4 ${riskLevelColors[alert.risk_level]}`}>
                {alert.risk_level}
               </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground">
               {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
              </span>
             </div>
            </div>
           ))}
          </div>
         </ScrollArea>
        </CardContent>
       </Card>
      )}
     </TabsContent> */}

     {/* <TabsContent value="history" className="space-y-4 mt-4">
      <Card className="bg-muted/30 border-border/50">
       <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
         <Route className="h-4 w-4 text-primary" />
         Performance Summary
        </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
         <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold">{driver.totalTrips}</p>
          <p className="text-xs text-muted-foreground">Total Trips</p>
         </div>
         <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-warning">
           <Star className="h-5 w-5 fill-current" />
           <span className="text-2xl font-bold">{driver.rating.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
         </div>
        </div>

        <Separator />

        <div>
         <div className="flex justify-between mb-1">
          <span className="text-sm flex items-center gap-2">
           <Shield className="h-4 w-4 text-success" />
           Safety Score
          </span>
          <span className="text-sm font-medium">{overallBehaviorScore}%</span>
         </div>
         <Progress value={overallBehaviorScore} className="h-2" />
        </div>

        <div>
         <div className="flex justify-between mb-1">
          <span className="text-sm flex items-center gap-2">
           <Coffee className="h-4 w-4 text-primary" />
           Rest Compliance
          </span>
          <span className="text-sm font-medium">
           {latestFatigueAlert?.rest_compliance_score ?? 8}/10
          </span>
         </div>
         <Progress
          value={((latestFatigueAlert?.rest_compliance_score ?? 8) / 10) * 100}
          className="h-2"
         />
        </div>
       </CardContent>
      </Card>

      <Card className="bg-muted/30 border-border/50">
       <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
       </CardHeader>
       <CardContent>
        <ScrollArea className="h-[200px] pr-2">
         <div className="space-y-2">
          {driverEvents.slice(0, 5).map((event) => (
           <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
            <div className={`p-1.5 rounded-full ${getSeverityColor(event.severity)}`}>
             {getEventIcon(event.eventType)}
            </div>
            <div className="flex-1">
             <p className="text-xs font-medium capitalize">
              {event.eventType.replace(/_/g, ' ')}
             </p>
             <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(event.createdAt, { addSuffix: true })}
             </p>
            </div>
            <Badge variant="outline" className="text-[10px] h-4">
             {event.severity}
            </Badge>
           </div>
          ))}
          {driverEvents.length === 0 && (
           <div className="text-center py-6">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
           </div>
          )}
         </div>
        </ScrollArea>
       </CardContent>
      </Card>
     </TabsContent> */}
    </Tabs>
   </SheetContent>
  </Sheet>
 )
}
