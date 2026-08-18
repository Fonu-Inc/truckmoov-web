import {
  CheckCheck, Clock, Mail, MessageSquare, Phone,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

type MessagePreviewProps = {
  message: string;
  subject?: string;
  selectedChannels: string[];
  senderName?: string;
};

// Parse WhatsApp-style formatting to React elements
function parseFormatting(text: string, channel: string): React.ReactNode {
  if (!text)
    return text;

  // For SMS, return plain text (no formatting support)
  if (channel === "sms") {
    return text;
  }

  // For WhatsApp and Email, parse formatting
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combined regex for all formatting patterns
  const formatRegex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(`([^`]+)`)|(\[Image:\s*([^\]]+)\])/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(
        lastIndex,
        match.index,
      ));
    }

    if (match[1]) {
      // Bold: *text*
      parts.push(
        <strong
          key={match.index}
          className="font-bold"
        >
          {match[2]}
        </strong>,
      );
    }
    else if (match[3]) {
      // Italic: _text_
      parts.push(
        <em
          key={match.index}
          className="italic"
        >
          {match[4]}
        </em>,
      );
    }
    else if (match[5]) {
      // Strikethrough: ~text~
      parts.push(
        <span
          key={match.index}
          className="line-through"
        >
          {match[6]}
        </span>,
      );
    }
    else if (match[7]) {
      // Code: `text`
      parts.push(
        <code
          key={match.index}
          className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
        >
          {match[8]}
        </code>,
      );
    }
    else if (match[9]) {
      // Image placeholder: [Image: url]
      parts.push(
        <span
          key={match.index}
          className="block my-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border border-dashed border-border"
        >
          📷 Image:
          {" "}
          {match[10]}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function MessagePreview({
  message, subject, selectedChannels, senderName = "FleetPro",
}: MessagePreviewProps) {
  const previewMessage = message || "Your message will appear here...";
  const personalizedMessage = previewMessage
    .replace(
      "{name}",
      "John",
    )
    .replace(
      "{phone}",
      "+27 82 123 4567",
    );

  // SMS segment calculation (160 chars for GSM-7, 70 for Unicode)
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const segmentSize = hasUnicode ? 70 : 160;
  const smsSegments = Math.ceil((message?.length || 0) / segmentSize) || 1;
  const charsRemaining = segmentSize - ((message?.length || 0) % segmentSize || segmentSize);

  // Character limits
  const whatsappLimit = 4096;
  const smsLimit = 160;
  const emailLimit = 10000;

  const currentTime = new Date().toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit", minute: "2-digit", hour12: false,
    },
  );

  if (selectedChannels.length === 0) {
    return (
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Select channels to see previews</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live Preview</p>
        <Badge
          variant="outline"
          className="text-xs"
        >
          Sample: John
        </Badge>
      </div>

      <Tabs
        defaultValue={selectedChannels[0]}
        className="w-full"
      >
        <TabsList className="w-full bg-muted/50">
          {selectedChannels.includes("whatsapp") && (
            <TabsTrigger
              value="whatsapp"
              className="flex-1 gap-1"
            >
              <WhatsAppIcon className="h-3 w-3" />
              WhatsApp
            </TabsTrigger>
          )}
          {selectedChannels.includes("sms") && (
            <TabsTrigger
              value="sms"
              className="flex-1 gap-1"
            >
              <Phone className="h-3 w-3" />
              SMS
            </TabsTrigger>
          )}
          {selectedChannels.includes("email") && (
            <TabsTrigger
              value="email"
              className="flex-1 gap-1"
            >
              <Mail className="h-3 w-3" />
              Email
            </TabsTrigger>
          )}
        </TabsList>

        {/* WhatsApp Preview */}
        {selectedChannels.includes("whatsapp") && (
          <TabsContent
            value="whatsapp"
            className="mt-3"
          >
            <div className="rounded-lg overflow-hidden border border-border/50">
              {/* WhatsApp Header */}
              <div className="bg-[#075e54] px-3 py-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">
                  TM
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{senderName}</p>
                  <p className="text-white/70 text-xs">Business Account</p>
                </div>
              </div>

              {/* WhatsApp Chat Background */}
              <div
                className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 min-h-[120px]"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
              >
                <div className="max-w-[85%] ml-auto">
                  <div className="bg-[#dcf8c6] dark:bg-[#005c4b] rounded-lg rounded-tr-none p-2 shadow-sm">
                    <p className="text-sm text-[#303030] dark:text-white whitespace-pre-wrap break-words">
                      {parseFormatting(
                        personalizedMessage,
                        "whatsapp",
                      )}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-[#667781] dark:text-white/60">{currentTime}</span>
                      <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Counter */}
              <div className="bg-muted/50 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">WhatsApp Business</span>
                <div className="flex items-center gap-2">
                  <span className={message?.length > whatsappLimit ? "text-destructive" : "text-muted-foreground"}>
                    {message?.length || 0}
                    /
                    {whatsappLimit}
                  </span>
                  {message?.length <= whatsappLimit && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-success/10 text-success border-success/30"
                    >
                      OK
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* SMS Preview */}
        {selectedChannels.includes("sms") && (
          <TabsContent
            value="sms"
            className="mt-3"
          >
            <div className="rounded-lg overflow-hidden border border-border/50">
              {/* SMS Header */}
              <div className="bg-muted px-3 py-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{senderName}</p>
                  <p className="text-xs text-muted-foreground">SMS</p>
                </div>
              </div>

              {/* SMS Message */}
              <div className="bg-background p-3 min-h-[120px]">
                <div className="max-w-[85%]">
                  <div className="bg-muted rounded-lg rounded-tl-none p-3">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {parseFormatting(
                        personalizedMessage,
                        "sms",
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{currentTime}</span>
                  </div>
                </div>
              </div>

              {/* SMS formatting warning */}
              {(message?.includes("*") || message?.includes("_") || message?.includes("~") || message?.includes("`")) && (
                <div className="px-3 py-1.5 bg-warning/10 border-t border-warning/20">
                  <p className="text-xs text-warning flex items-center gap-1">
                    ⚠️ SMS doesn't support text formatting - symbols will appear as-is
                  </p>
                </div>
              )}

              {/* SMS Segment Counter */}
              <div className="bg-muted/50 px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">SMS</span>
                  {hasUnicode && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-warning/10 text-warning border-warning/30"
                    >
                      Unicode
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {message?.length || 0}
                    {" "}
                    chars
                  </span>
                  <span className={smsSegments > 3 ? "text-warning" : "text-muted-foreground"}>
                    {smsSegments}
                    {" "}
                    segment
                    {smsSegments !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {charsRemaining}
                    {" "}
                    left
                  </span>
                </div>
              </div>
            </div>

            {smsSegments > 1 && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                <span>⚠️</span>
                Messages over 160 characters are split into multiple segments and may cost more.
              </p>
            )}
          </TabsContent>
        )}

        {/* Email Preview */}
        {selectedChannels.includes("email") && (
          <TabsContent
            value="email"
            className="mt-3"
          >
            <div className="rounded-lg overflow-hidden border border-border/50">
              {/* Email Header */}
              <div className="bg-muted px-3 py-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">From:</span>
                  <span className="text-sm">
                    {senderName}
                    {" "}
                    &lt;noreply@fleetpro.co.za&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">To:</span>
                  <span className="text-sm">john@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Subject:</span>
                  <span className="text-sm font-medium">{subject || "No subject"}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="bg-background p-4 min-h-[120px] border-t border-border/50">
                <div className="text-sm whitespace-pre-wrap break-words">
                  {parseFormatting(
                    personalizedMessage,
                    "email",
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <p>—</p>
                  <p>{senderName}</p>
                  <p>Fleet Management Platform</p>
                </div>
              </div>

              {/* Email Character Counter */}
              <div className="bg-muted/50 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <span className={message?.length > emailLimit ? "text-destructive" : "text-muted-foreground"}>
                    {message?.length || 0}
                    {" "}
                    characters
                  </span>
                  {!subject && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-warning/10 text-warning border-warning/30"
                    >
                      No subject
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
