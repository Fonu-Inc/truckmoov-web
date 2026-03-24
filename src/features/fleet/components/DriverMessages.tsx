import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { cn } from "@/lib/utils";
import { MessageSquare, Phone, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import MessageItem from "./MessageItem";
import CallItem from "./CallItem";

export default function DriverMessages() {
 const [activeTab, setActiveTab] = useState("messages");
 const stats = useMemo(() => [
  {
   value: 0,
   label: "Today's Messages"
  },
  {
   value: 0,
   label: "Today's Calls"
  },
  {
   value: 0,
   label: "Sent",
   className: "text-success"
  },
  {
   value: 0,
   label: "Failed",
   className: "text-destructive"
  },
 ], [])

 return (
  <Card className="bg-card/50 border-border/50">
   <CardHeader>
    <div className="flex items-center justify-between">
     <CardTitle className="flex items-center gap-2">
      <MessageSquare className="h-5 w-5 text-primary" />
      Driver Communications
     </CardTitle>
     <TooltipWrapper content="Refresh communications">
      <Button variant="ghost" size="icon">
       <RefreshCw className="h-4 w-4" />
      </Button>
     </TooltipWrapper>
    </div>
   </CardHeader>
   <CardContent className="space-y-4">
    {/* Stats */}
    <div className="grid grid-cols-4 gap-4">
     {stats.map(stat => (
      <div className="text-center p-3 bg-muted/50 rounded-lg">
       <p className={
        cn(
         "text-2xl font-bold",
         stat.className ?? ""
        )
       }>{stat.value}</p>
       <p className="text-xs text-muted-foreground">{stat.label}</p>
      </div>
     ))}
    </div>

    {/* Search */}
    <div className="relative">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
     <Input
      placeholder="Search by driver name, phone, or content..."
      className="pl-10"
     />
    </div>

    {/* Tabs */}
    {/* <Tabs value={activeTab} onValueChange={setActiveTab}>
     <TabsList className="w-full">
      <TabsTrigger value="messages" className="flex-1">
       <MessageSquare className="h-4 w-4 mr-2" />
       Messages ({filteredMessages.length})
      </TabsTrigger>
      <TabsTrigger value="calls" className="flex-1">
       <Phone className="h-4 w-4 mr-2" />
       Calls ({filteredCalls.length})
      </TabsTrigger>
     </TabsList>

     <TabsContent value="messages" className="mt-4">
      <ScrollArea className="h-[400px]">
       <div className="space-y-2">
        {filteredMessages.length === 0 ? (
         <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No messages found</p>
         </div>
        ) : (
         filteredMessages.map((message) => (
          <MessageItem key={message.id} message={message} />
         ))
        )}
       </div>
      </ScrollArea>
     </TabsContent>

     <TabsContent value="calls" className="mt-4">
      <ScrollArea className="h-[400px]">
       <div className="space-y-2">
        {filteredCalls.length === 0 ? (
         <div className="text-center py-8 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No call logs found</p>
         </div>
        ) : (
         filteredCalls.map((call) => (
          <CallItem key={call.id} call={call} />
         ))
        )}
       </div>
      </ScrollArea>
     </TabsContent>
    </Tabs> */}
   </CardContent>
  </Card>
 )
}
