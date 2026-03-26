import { Mail, MessageSquare, Phone } from "lucide-react";

export const commIcons: Record<string, React.ReactNode> = {
 whatsapp: <MessageSquare className="h-4 w-4 text-success" />,
 sms: <Phone className="h-4 w-4 text-primary" />,
 email: <Mail className="h-4 w-4 text-warning" />,
 voice: <Phone className="h-4 w-4 text-accent" />,
};