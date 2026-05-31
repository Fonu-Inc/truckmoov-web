import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DeviceCatalogEntry } from '@/hooks/useDeviceCatalog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  BookOpen,
  Cpu,
  Wifi,
  Server,
  FileText,
} from 'lucide-react';

interface InstallerGuideProps {
  catalog: DeviceCatalogEntry[];
  loading: boolean;
}

export function InstallerGuide({ catalog, loading }: InstallerGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const supportedCatalog = catalog.filter(c => c.status === 'supported' || c.status === 'deprecated');
  
  const filteredCatalog = supportedCatalog.filter(entry =>
    entry.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByManufacturer = filteredCatalog.reduce((acc, entry) => {
    if (!acc[entry.manufacturer]) {
      acc[entry.manufacturer] = [];
    }
    acc[entry.manufacturer].push(entry);
    return acc;
  }, {} as Record<string, DeviceCatalogEntry[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installer Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Installer Guide
        </CardTitle>
        <CardDescription>
          Model-specific setup instructions from the device catalog
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by manufacturer or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-border"
          />
        </div>

        {Object.keys(groupedByManufacturer).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No device models found in catalog</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(groupedByManufacturer).map(([manufacturer, models]) => (
              <AccordionItem key={manufacturer} value={manufacturer} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{manufacturer}</span>
                    <Badge variant="secondary">{models.length} models</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {models.map(model => (
                      <div 
                        key={model.id}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{model.model}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="uppercase text-xs">
                                {model.protocol_type}
                              </Badge>
                              {model.default_port && (
                                <span className="text-xs text-muted-foreground">
                                  Port: {model.default_port}
                                </span>
                              )}
                              {model.status === 'deprecated' && (
                                <Badge variant="destructive" className="text-xs">
                                  Deprecated
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {model.supports_obd && (
                              <Badge variant="secondary" className="text-xs">OBD</Badge>
                            )}
                            {model.supports_fuel && (
                              <Badge variant="secondary" className="text-xs">Fuel</Badge>
                            )}
                            {model.supports_sos && (
                              <Badge variant="secondary" className="text-xs">SOS</Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                            <span>{model.protocol_type.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>Port {model.default_port || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{model.config_instructions ? 'Instructions' : 'No docs'}</span>
                          </div>
                        </div>

                        {/* Instructions */}
                        {model.config_instructions ? (
                          <div className="p-3 rounded bg-background border text-sm">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Setup Instructions:
                            </p>
                            <div className="whitespace-pre-wrap">
                              {model.config_instructions}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No specific setup instructions. Refer to manufacturer documentation.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}



