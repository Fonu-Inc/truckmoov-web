import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Phone, MessageSquare, MessageCircle, Save, RefreshCw, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommunicationRate {
  id: string;
  communication_type: string;
  rate_ngn: number;
  rate_unit: string;
  description: string | null;
  is_active: boolean;
  updated_at: string;
}

export function CommunicationPricing() {
  const [rates, setRates] = useState<CommunicationRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('communication_rates')
      .select('*')
      .order('communication_type');

    if (error) {
      toast.error('Failed to load communication rates');
      console.error(error);
    } else {
      setRates(data || []);
      const initialEdits: Record<string, number> = {};
      data?.forEach(rate => {
        initialEdits[rate.id] = rate.rate_ngn;
      });
      setEditedRates(initialEdits);
    }
    setLoading(false);
  };

  const handleRateChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedRates(prev => ({ ...prev, [id]: numValue }));
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('communication_rates')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update rate status');
    } else {
      toast.success('Rate status updated');
      fetchRates();
    }
  };

  const handleSaveRates = async () => {
    setSaving(true);
    
    try {
      for (const rate of rates) {
        if (editedRates[rate.id] !== rate.rate_ngn) {
          const { error } = await supabase
            .from('communication_rates')
            .update({ rate_ngn: editedRates[rate.id] })
            .eq('id', rate.id);

          if (error) throw error;
        }
      }
      
      toast.success('All rates updated successfully');
      fetchRates();
    } catch (error) {
      toast.error('Failed to save rates');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'sms':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'whatsapp':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return '';
    }
  };

  const hasChanges = rates.some(rate => editedRates[rate.id] !== rate.rate_ngn);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Communication Pricing
            </CardTitle>
            <CardDescription>
              Configure usage-based billing rates for all communication channels
            </CardDescription>
          </div>
          <Button onClick={handleSaveRates} disabled={saving || !hasChanges}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {rates.map((rate) => (
            <Card key={rate.id} className={`border-2 ${rate.is_active ? 'border-primary/20' : 'border-muted opacity-60'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeBadgeColor(rate.communication_type)}`}>
                      {getIcon(rate.communication_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold capitalize">{rate.communication_type}</h4>
                      <p className="text-xs text-muted-foreground">
                        {rate.rate_unit === 'per_minute' ? 'Per Minute' : 'Per Message'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={rate.is_active}
                    onCheckedChange={(checked) => handleToggleActive(rate.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`rate-${rate.id}`}>Rate (₦)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id={`rate-${rate.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={editedRates[rate.id] || 0}
                      onChange={(e) => handleRateChange(rate.id, e.target.value)}
                      className="pl-8"
                      disabled={!rate.is_active}
                    />
                  </div>
                </div>
                
                {rate.description && (
                  <p className="text-sm text-muted-foreground">{rate.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last updated</span>
                  <span>{new Date(rate.updated_at).toLocaleDateString()}</span>
                </div>

                {editedRates[rate.id] !== rate.rate_ngn && (
                  <Badge variant="outline" className="w-full justify-center bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    Unsaved changes
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Billing Summary</h4>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            {rates.filter(r => r.is_active).map(rate => (
              <div key={rate.id} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">{rate.communication_type}:</span>
                <span className="font-medium">
                  ₦{editedRates[rate.id]?.toLocaleString() || rate.rate_ngn.toLocaleString()} 
                  <span className="text-muted-foreground ml-1">
                    /{rate.rate_unit === 'per_minute' ? 'min' : 'msg'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
