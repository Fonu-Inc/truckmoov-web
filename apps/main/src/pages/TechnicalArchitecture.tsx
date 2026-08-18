import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import { Button } from "@/components/shadcn/button";
import { 
  FileText, Shield, Database, Users, Server, MessageSquare, 
  Radio, Cpu, Lock, Layers, Cloud, GitBranch, FileIcon, Presentation, Loader2
} from "lucide-react";
import { 
  highLevelArchitectureDiagram,
  whatsappMessagingDiagram,
  messagingSequenceDiagram,
  jobCreationSequenceDiagram,
  driverResponseSequenceDiagram,
  telemetrySequenceDiagram,
  iotArchitectureDiagram,
  securityArchitectureDiagram,
  deploymentDiagram,
  dataArchitectureDiagram,
  aiArchitectureDiagram
} from "@/data/architectureDiagrams";
import { generateWordDocument, getAllDiagramImages } from "@/utils/wordExport";
import { generatePowerPoint } from "@/utils/pptxExport";
import { documentSections } from "@/utils/documentSections";
import { toast } from "sonner";

export default function TechnicalArchitecture() {
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPPT, setIsExportingPPT] = useState(false);

  const handleExportWord = async () => {
    setIsExportingWord(true);
    toast.info("Generating Word document...");
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const diagramImages = await getAllDiagramImages();
      await generateWordDocument(documentSections, diagramImages);
      toast.success("Word document downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Word document.");
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportPPT = async () => {
    setIsExportingPPT(true);
    toast.info("Generating PowerPoint...");
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await generatePowerPoint(documentSections);
      toast.success("PowerPoint downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PowerPoint.");
    } finally {
      setIsExportingPPT(false);
    }
  };

  return (
    <DashboardLayout 
      title="Technical Architecture Document" 
      subtitle="FleetPro Platform - MTN Nigeria IT Division Technical Annex"
    >
      <div className="space-y-8 print:space-y-4">
        <Card className="border-primary/20 print:border-none print:shadow-none">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">FleetPro Technical Architecture & Implementation Document</CardTitle>
                  <p className="text-muted-foreground mt-1">Build & Operate Model for MTN Enterprise Business</p>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button onClick={handleExportWord} variant="outline" disabled={isExportingWord}>
                  {isExportingWord ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileIcon className="h-4 w-4 mr-2" />}
                  Export Word
                </Button>
                <Button onClick={handleExportPPT} disabled={isExportingPPT}>
                  {isExportingPPT ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Presentation className="h-4 w-4 mr-2" />}
                  Export PowerPoint
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Document Version</p>
                <p className="font-semibold">1.0.0</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Classification</p>
                <p className="font-semibold">MTN-IT Confidential</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Target Audience</p>
                <p className="font-semibold">IT Division</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="font-semibold">{formatDate(new Date())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Document Overview */}
        <DocumentSection 
          number="1" 
          title="Document Overview" 
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4>Product: FleetPro</h4>
            <p>
              FleetPro is an AI-powered fleet management and operations platform designed specifically 
              for African enterprise markets. This document provides a comprehensive technical architecture 
              overview for MTN Nigeria IT Division teams responsible for operating the platform.
            </p>
            
            <h4>Build & Operate Deployment Model</h4>
            <p>
              Under the Build & Operate model, FleetPro Technologies Ltd builds, maintains, and evolves 
              the platform while MTN Nigeria IT Division operates it for MTN Enterprise Business (EB) customers. 
              This model ensures:
            </p>
            <ul>
              <li>Clear ownership boundaries</li>
              <li>Regulatory compliance for both parties</li>
              <li>Optimal utilization of MTN CPaaS assets</li>
              <li>Enterprise-grade SLA delivery</li>
            </ul>

            <h4>Target Consumers</h4>
            <p>
              MTN Enterprise Business customers including logistics companies, transport operators, 
              fuel distributors, and any enterprise requiring fleet visibility and driver communication.
            </p>
          </div>
        </DocumentSection>

        {/* Section 2: System Objectives */}
        <DocumentSection 
          number="2" 
          title="System Objectives" 
          icon={<Layers className="h-5 w-5" />}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <ObjectiveCard 
              title="Enterprise Fleet Visibility"
              description="Real-time tracking of all fleet assets with sub-30-second update latency"
            />
            <ObjectiveCard 
              title="Reliable Driver Communication"
              description="Multi-channel messaging with 99.5% delivery rate via WhatsApp, SMS, and Voice"
            />
            <ObjectiveCard 
              title="CPaaS Monetization"
              description="Revenue generation through MTN WhatsApp Business API, A2P SMS, and Voice services"
            />
            <ObjectiveCard 
              title="IoT SIM Utilization"
              description="Optimized connectivity for GPS devices via MTN IoT SIM infrastructure"
            />
            <ObjectiveCard 
              title="99.9% Availability"
              description="Enterprise-grade uptime with automatic failover and horizontal scaling"
            />
            <ObjectiveCard 
              title="Multi-Tenant Scalability"
              description="Support for 1000+ concurrent tenants with complete data isolation"
            />
          </div>
        </DocumentSection>

        {/* Section 3: Architecture Principles */}
        <DocumentSection 
          number="3" 
          title="Architecture Principles" 
          icon={<GitBranch className="h-5 w-5" />}
        >
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Microservices-Based", desc: "Independently deployable services with bounded contexts" },
              { title: "Event-Driven", desc: "Asynchronous workflows via message queues and webhooks" },
              { title: "Multi-Tenant Isolation", desc: "Complete data and process isolation per tenant" },
              { title: "Cloud-Native", desc: "Containerized workloads with Kubernetes orchestration" },
              { title: "API-First", desc: "All functionality exposed via versioned REST/GraphQL APIs" },
              { title: "Telco-Safe", desc: "No exposure to MTN core network or subscriber data" },
            ].map((principle, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{principle.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{principle.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DocumentSection>

        {/* Section 4: High-Level System Architecture */}
        <DocumentSection 
          number="4" 
          title="High-Level System Architecture" 
          icon={<Server className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={highLevelArchitectureDiagram}
            title="Logical Architecture Overview"
            description="Complete system architecture showing all major components and integration points"
          />
          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Component Descriptions</h4>
            <ul>
              <li><strong>Web Dashboards:</strong> Role-based interfaces for Platform Admin, Fleet Manager, and Supervisor</li>
              <li><strong>API Gateway / BFF:</strong> Central entry point with authentication, rate limiting, and request routing</li>
              <li><strong>Core Backend Services:</strong> Microservices handling fleet, dispatch, tracking, and analytics</li>
              <li><strong>Messaging Orchestration:</strong> Unified layer for WhatsApp, SMS, and Voice with escalation logic</li>
              <li><strong>Telematics Ingestion:</strong> High-throughput pipeline for GPS device data</li>
              <li><strong>MTN CPaaS:</strong> Integration with MTN WhatsApp Business API, A2P SMS, and Voice services</li>
              <li><strong>MTN IoT:</strong> Connectivity layer for GPS devices via MTN IoT SIM cards</li>
            </ul>
          </div>
        </DocumentSection>

        {/* Section 5: User Roles & Access Control */}
        <DocumentSection 
          number="5" 
          title="User Roles & Access Control" 
          icon={<Users className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Access Level</th>
                    <th className="text-left p-2">Channels</th>
                    <th className="text-left p-2">Key Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><Badge>Platform Admin</Badge></td>
                    <td className="p-2">Full System</td>
                    <td className="p-2">Web Dashboard</td>
                    <td className="p-2">Tenant management, billing, system config</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><Badge variant="secondary">Fleet Manager</Badge></td>
                    <td className="p-2">Tenant-Scoped</td>
                    <td className="p-2">Web Dashboard</td>
                    <td className="p-2">Fleet CRUD, driver management, analytics</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><Badge variant="outline">Supervisor</Badge></td>
                    <td className="p-2">Operational</td>
                    <td className="p-2">Web Dashboard</td>
                    <td className="p-2">Dispatch, live tracking, messaging</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><Badge variant="outline">Driver</Badge></td>
                    <td className="p-2">Personal Only</td>
                    <td className="p-2">WhatsApp/SMS/Voice</td>
                    <td className="p-2">View assigned jobs, respond to dispatch</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
              <h4>Authentication & Authorization</h4>
              <ul>
                <li><strong>JWT Tokens:</strong> Short-lived access tokens (15min) with refresh token rotation</li>
                <li><strong>OAuth 2.0:</strong> Standard authorization framework for API access</li>
                <li><strong>RBAC:</strong> Role-Based Access Control with granular permissions</li>
                <li><strong>Tenant Isolation:</strong> All queries automatically scoped to user's tenant</li>
              </ul>
            </div>
          </div>
        </DocumentSection>

        {/* Section 6: Core Application Services */}
        <DocumentSection 
          number="6" 
          title="Core Application Services" 
          icon={<Cpu className="h-5 w-5" />}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <ServiceCard 
              title="Identity & Tenant Management"
              items={[
                "User registration and authentication",
                "Multi-tenant provisioning",
                "Role and permission management",
                "Session management and audit logging"
              ]}
            />
            <ServiceCard 
              title="Fleet & Asset Management"
              items={[
                "Vehicle CRUD operations",
                "Device-vehicle association",
                "Driver-vehicle assignment",
                "Maintenance scheduling"
              ]}
            />
            <ServiceCard 
              title="Dispatch & Operations Engine"
              items={[
                "Job creation and assignment",
                "Route optimization",
                "Status tracking and updates",
                "Escalation management"
              ]}
            />
            <ServiceCard 
              title="Tracking & Telematics Service"
              items={[
                "Real-time GPS ingestion",
                "Geofence management",
                "Trip history and playback",
                "Driver behavior monitoring"
              ]}
            />
            <ServiceCard 
              title="Messaging Orchestration"
              items={[
                "Multi-channel delivery (WhatsApp, SMS, Voice)",
                "Fallback and escalation logic",
                "Template management",
                "Delivery status tracking"
              ]}
            />
            <ServiceCard 
              title="Analytics & Reporting Service"
              items={[
                "Fleet utilization metrics",
                "Driver performance scoring",
                "Cost and fuel analytics",
                "Custom report generation"
              ]}
            />
          </div>
        </DocumentSection>

        {/* Section 7: WhatsApp-First Messaging Architecture */}
        <DocumentSection 
          number="7" 
          title="WhatsApp-First Messaging Architecture" 
          icon={<MessageSquare className="h-5 w-5" />}
        >
          <div className="space-y-6">
            <MermaidDiagram
              chart={whatsappMessagingDiagram}
              title="Messaging Orchestration Architecture"
              description="Multi-channel messaging system with WhatsApp as primary, SMS and Voice as fallbacks"
            />
            
            <MermaidDiagram
              chart={messagingSequenceDiagram}
              title="Message Escalation Sequence"
              description="Dispatch event flow with timeout-based fallback from WhatsApp → SMS → Voice"
            />

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Escalation Logic</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Channel</th>
                    <th className="text-left p-2">Timeout</th>
                    <th className="text-left p-2">Retry Attempts</th>
                    <th className="text-left p-2">Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">WhatsApp</td>
                    <td className="p-2">5 minutes</td>
                    <td className="p-2">2</td>
                    <td className="p-2">Escalate to SMS</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">SMS</td>
                    <td className="p-2">3 minutes</td>
                    <td className="p-2">2</td>
                    <td className="p-2">Escalate to Voice</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Voice (IVR)</td>
                    <td className="p-2">N/A</td>
                    <td className="p-2">3</td>
                    <td className="p-2">Alert Supervisor</td>
                  </tr>
                </tbody>
              </table>

              <h4>Message Audit Trail</h4>
              <p>All messaging events are logged with:</p>
              <ul>
                <li>Timestamp (sent, delivered, read, responded)</li>
                <li>Channel used</li>
                <li>Delivery status and error codes</li>
                <li>Driver response content</li>
                <li>Correlation ID for end-to-end tracing</li>
              </ul>
            </div>
          </div>
        </DocumentSection>

        {/* Section 8: Job Creation & Driver Assignment Sequence */}
        <DocumentSection 
          number="8" 
          title="API Sequence — Job Creation & Driver Assignment" 
          icon={<Server className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={jobCreationSequenceDiagram}
            title="Job Creation & Assignment Flow"
            description="Complete API sequence from job creation to driver notification"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>API Endpoints</h4>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs">
              <p><strong>POST /api/v1/jobs</strong> - Create new job</p>
              <p><strong>POST /api/v1/jobs/{'{id}'}/assign</strong> - Assign driver to job</p>
              <p><strong>POST /webhooks/messaging/status</strong> - Delivery status callback</p>
              <p><strong>POST /webhooks/messaging/reply</strong> - Driver response callback</p>
            </div>
          </div>
        </DocumentSection>

        {/* Section 9: Driver Response Sequence */}
        <DocumentSection 
          number="9" 
          title="API Sequence — Driver Response via WhatsApp" 
          icon={<MessageSquare className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={driverResponseSequenceDiagram}
            title="Driver Response Processing Flow"
            description="WhatsApp reply processing with state management and audit logging"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Idempotency & State Management</h4>
            <ul>
              <li><strong>Message Deduplication:</strong> External message ID used to prevent duplicate processing</li>
              <li><strong>State Machine:</strong> Job status transitions validated against allowed state graph</li>
              <li><strong>Optimistic Locking:</strong> Version field prevents concurrent update conflicts</li>
              <li><strong>Audit Log:</strong> All state changes recorded with actor, timestamp, and previous state</li>
            </ul>
          </div>
        </DocumentSection>

        {/* Section 10: Telemetry Ingestion Sequence */}
        <DocumentSection 
          number="10" 
          title="API Sequence — Telemetry Ingestion & Live Tracking" 
          icon={<Radio className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={telemetrySequenceDiagram}
            title="Telemetry Ingestion Pipeline"
            description="GPS data flow from device to supervisor live map"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Telemetry Pipeline Specifications</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  <th className="text-left p-2">Target</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Ingestion Latency</td><td className="p-2">&lt; 500ms</td></tr>
                <tr className="border-b"><td className="p-2">Map Update Latency</td><td className="p-2">&lt; 2 seconds</td></tr>
                <tr className="border-b"><td className="p-2">Throughput</td><td className="p-2">10,000 events/second</td></tr>
                <tr className="border-b"><td className="p-2">Data Retention</td><td className="p-2">90 days hot, 2 years cold</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentSection>

        {/* Section 11: Telematics & IoT Architecture */}
        <DocumentSection 
          number="11" 
          title="Telematics & IoT Architecture" 
          icon={<Radio className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={iotArchitectureDiagram}
            title="IoT & Telematics Architecture"
            description="End-to-end GPS device connectivity and data processing pipeline"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Device Authentication</h4>
            <ul>
              <li><strong>IMEI Validation:</strong> Device IMEI registered and validated on first connection</li>
              <li><strong>SIM Binding:</strong> Device-SIM association enforced for security</li>
              <li><strong>Protocol Support:</strong> Teltonika, Queclink, Concox native protocols</li>
            </ul>

            <h4>Device Health Monitoring</h4>
            <ul>
              <li>Battery level and charging status</li>
              <li>Signal strength (GSM/LTE)</li>
              <li>Last seen timestamp</li>
              <li>Firmware version tracking</li>
            </ul>
          </div>
        </DocumentSection>

        {/* Section 12: Data Architecture */}
        <DocumentSection 
          number="12" 
          title="Data Architecture" 
          icon={<Database className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={dataArchitectureDiagram}
            title="Data Layer Architecture"
            description="Database systems and entity relationships"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Storage Tiers</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Store</th>
                  <th className="text-left p-2">Technology</th>
                  <th className="text-left p-2">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Relational</td><td className="p-2">PostgreSQL</td><td className="p-2">Tenants, users, fleet, jobs</td></tr>
                <tr className="border-b"><td className="p-2">Time-Series</td><td className="p-2">TimescaleDB</td><td className="p-2">Telemetry, GPS history</td></tr>
                <tr className="border-b"><td className="p-2">Cache</td><td className="p-2">Redis</td><td className="p-2">Sessions, live positions</td></tr>
                <tr className="border-b"><td className="p-2">Object Storage</td><td className="p-2">S3-Compatible</td><td className="p-2">Documents, recordings</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentSection>

        {/* Section 13: AI & Rules Engine */}
        <DocumentSection 
          number="13" 
          title="AI & Rules Engine" 
          icon={<Cpu className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={aiArchitectureDiagram}
            title="AI & Automation Architecture"
            description="Rules engine and AI integration points"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Implementation Phases</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Phase 1: Rules-Based</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Configurable dispatch rules</li>
                    <li>Geofence-triggered alerts</li>
                    <li>Time-based escalations</li>
                    <li>Driver behavior thresholds</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Phase 2: AI-Assisted</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Predictive ETA calculation</li>
                    <li>Route optimization</li>
                    <li>Driver fatigue detection</li>
                    <li>Demand forecasting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </DocumentSection>

        {/* Section 14: API & Integration Layer */}
        <DocumentSection 
          number="14" 
          title="API & Integration Layer" 
          icon={<Server className="h-5 w-5" />}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4>API Categories</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Endpoints</th>
                  <th className="text-left p-2">Authentication</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Internal APIs</td><td className="p-2">/api/v1/*</td><td className="p-2">JWT Bearer</td></tr>
                <tr className="border-b"><td className="p-2">External APIs</td><td className="p-2">/external/v1/*</td><td className="p-2">API Key + HMAC</td></tr>
                <tr className="border-b"><td className="p-2">Webhooks (Inbound)</td><td className="p-2">/webhooks/*</td><td className="p-2">Signature Verification</td></tr>
                <tr className="border-b"><td className="p-2">MTN CPaaS</td><td className="p-2">Fonu API Gateway</td><td className="p-2">API Key</td></tr>
              </tbody>
            </table>

            <h4>Enterprise Webhook Events</h4>
            <ul>
              <li><code>job.created</code> - New job created</li>
              <li><code>job.assigned</code> - Driver assigned to job</li>
              <li><code>job.status_changed</code> - Job status updated</li>
              <li><code>job.completed</code> - Job marked complete</li>
              <li><code>vehicle.geofence_breach</code> - Vehicle entered/exited geofence</li>
              <li><code>driver.behavior_alert</code> - Driving behavior event detected</li>
            </ul>
          </div>
        </DocumentSection>

        {/* Section 15: Security Architecture */}
        <DocumentSection 
          number="15" 
          title="Security Architecture" 
          icon={<Shield className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={securityArchitectureDiagram}
            title="Security Architecture Overview"
            description="End-to-end security controls and data protection"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Security Controls</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Control</th>
                  <th className="text-left p-2">Implementation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Transport Security</td><td className="p-2">TLS 1.3 everywhere, certificate pinning for mobile</td></tr>
                <tr className="border-b"><td className="p-2">Encryption at Rest</td><td className="p-2">AES-256 for databases, S3 SSE for objects</td></tr>
                <tr className="border-b"><td className="p-2">Secret Management</td><td className="p-2">Vault-based secrets with auto-rotation</td></tr>
                <tr className="border-b"><td className="p-2">Audit Logging</td><td className="p-2">All actions logged with correlation IDs</td></tr>
                <tr className="border-b"><td className="p-2">Tenant Isolation</td><td className="p-2">Row-Level Security (RLS) at database level</td></tr>
                <tr className="border-b"><td className="p-2">IP Blocking</td><td className="p-2">Automatic blocking after failed auth attempts</td></tr>
              </tbody>
            </table>

            <h4>Security Boundaries</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">
              <strong>Critical:</strong> FleetPro does NOT have access to MTN core network, subscriber data, 
              or billing systems. All communication flows through MTN CPaaS APIs only.
            </p>
          </div>
        </DocumentSection>

        {/* Section 16: Performance & Scalability */}
        <DocumentSection 
          number="16" 
          title="Performance & Scalability" 
          icon={<Layers className="h-5 w-5" />}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Horizontal Scaling</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• Stateless services scale via Kubernetes HPA</p>
                <p>• Database read replicas for query distribution</p>
                <p>• Redis cluster for cache scaling</p>
                <p>• Message queue partitioning</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Targets</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• API Response: p95 &lt; 200ms</p>
                <p>• Telemetry Ingestion: 10K events/sec</p>
                <p>• Message Delivery: &lt; 5 seconds</p>
                <p>• Map Update: &lt; 2 seconds</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Graceful Degradation</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• Circuit breakers on all external calls</p>
                <p>• Message queue buffering during outages</p>
                <p>• Cached fallback for read operations</p>
                <p>• Async retry for failed deliveries</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Load Testing</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• Regular load tests at 2x expected peak</p>
                <p>• Chaos engineering for resilience</p>
                <p>• Automated performance regression tests</p>
                <p>• Real-time APM monitoring</p>
              </CardContent>
            </Card>
          </div>
        </DocumentSection>

        {/* Section 17: DevOps & Operations */}
        <DocumentSection 
          number="17" 
          title="DevOps & Operations" 
          icon={<GitBranch className="h-5 w-5" />}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4>CI/CD Pipeline</h4>
            <div className="bg-muted/50 p-3 rounded-lg font-mono text-xs">
              Code Push → Lint/Test → Build → Security Scan → Deploy Staging → Integration Tests → Deploy Production
            </div>

            <h4>Infrastructure</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Component</th>
                  <th className="text-left p-2">Technology</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Containerization</td><td className="p-2">Docker</td></tr>
                <tr className="border-b"><td className="p-2">Orchestration</td><td className="p-2">Kubernetes</td></tr>
                <tr className="border-b"><td className="p-2">Service Mesh</td><td className="p-2">Istio</td></tr>
                <tr className="border-b"><td className="p-2">Monitoring</td><td className="p-2">Prometheus + Grafana</td></tr>
                <tr className="border-b"><td className="p-2">Logging</td><td className="p-2">ELK Stack</td></tr>
                <tr className="border-b"><td className="p-2">Alerting</td><td className="p-2">PagerDuty</td></tr>
              </tbody>
            </table>

            <h4>Backup & Disaster Recovery</h4>
            <ul>
              <li>Automated daily backups with 30-day retention</li>
              <li>Point-in-time recovery for databases</li>
              <li>Cross-region backup replication</li>
              <li>RTO: 4 hours, RPO: 1 hour</li>
            </ul>
          </div>
        </DocumentSection>

        {/* Section 18: Deployment Model */}
        <DocumentSection 
          number="18" 
          title="Deployment Model (MTN-IT Friendly)" 
          icon={<Cloud className="h-5 w-5" />}
        >
          <MermaidDiagram
            chart={deploymentDiagram}
            title="Deployment Architecture"
            description="Infrastructure deployment and MTN integration points"
          />

          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <h4>Deployment Responsibilities</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Component</th>
                  <th className="text-left p-2">Hosted By</th>
                  <th className="text-left p-2">Operated By</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">FleetPro Platform</td><td className="p-2">Cloud Provider</td><td className="p-2">MTN-IT</td></tr>
                <tr className="border-b"><td className="p-2">MTN CPaaS APIs</td><td className="p-2">MTN Infrastructure</td><td className="p-2">MTN</td></tr>
                <tr className="border-b"><td className="p-2">MTN IoT SIMs</td><td className="p-2">MTN Network</td><td className="p-2">MTN</td></tr>
                <tr className="border-b"><td className="p-2">GPS Devices</td><td className="p-2">Customer Premises</td><td className="p-2">Customer/FleetPro</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentSection>

        {/* Section 19: Ownership & Responsibility Split */}
        <DocumentSection 
          number="19" 
          title="Ownership & Responsibility Split" 
          icon={<Users className="h-5 w-5" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Area</th>
                  <th className="text-left p-3">FleetPro</th>
                  <th className="text-left p-3">MTN-IT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-3 font-medium">Platform Development</td><td className="p-3">✅ Full ownership</td><td className="p-3">—</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">IP & Source Code</td><td className="p-3">✅ Owner</td><td className="p-3">—</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Product Roadmap</td><td className="p-3">✅ Defines</td><td className="p-3">📋 Consults</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">L2/L3 Support</td><td className="p-3">✅ Provides</td><td className="p-3">—</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Platform Operations</td><td className="p-3">—</td><td className="p-3">✅ Operates</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Security Compliance</td><td className="p-3">📋 Design</td><td className="p-3">✅ Enforce</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">SLA Management</td><td className="p-3">📋 Define</td><td className="p-3">✅ Deliver</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">CPaaS Integration</td><td className="p-3">📋 Implement</td><td className="p-3">✅ Provide APIs</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Customer Billing</td><td className="p-3">—</td><td className="p-3">✅ Manages</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">L1 Support</td><td className="p-3">—</td><td className="p-3">✅ Provides</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentSection>

        {/* Section 20: Implementation Phases */}
        <DocumentSection 
          number="20" 
          title="Implementation Phases" 
          icon={<Layers className="h-5 w-5" />}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-primary/10 border-primary/30">
              <CardHeader className="pb-2">
                <Badge className="w-fit mb-2">Phase 1</Badge>
                <CardTitle className="text-sm">Core Platform & Pilot</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>Duration: 3 months</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Core fleet management</li>
                  <li>Real-time tracking</li>
                  <li>WhatsApp messaging</li>
                  <li>5 pilot customers</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-secondary/10 border-secondary/30">
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit mb-2">Phase 2</Badge>
                <CardTitle className="text-sm">Automation & Scale</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>Duration: 4 months</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>AI-assisted dispatch</li>
                  <li>Route optimization</li>
                  <li>Full CPaaS integration</li>
                  <li>50 customers</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-2">Phase 3</Badge>
                <CardTitle className="text-sm">Enterprise Hardening</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>Duration: 5 months</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Advanced analytics</li>
                  <li>Enterprise integrations</li>
                  <li>Multi-region deployment</li>
                  <li>200+ customers</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </DocumentSection>

        {/* Section 21: Conclusion */}
        <DocumentSection 
          number="21" 
          title="Conclusion" 
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              This document outlines a comprehensive technical architecture for FleetPro that is 
              specifically designed to integrate safely and effectively within MTN Nigeria's IT 
              infrastructure while maximizing CPaaS asset utilization.
            </p>

            <h4>Why This Architecture is Safe for MTN-IT</h4>
            <ul>
              <li>Complete isolation from MTN core network and subscriber data</li>
              <li>Industry-standard security controls at every layer</li>
              <li>Clear operational boundaries with no ambiguity</li>
              <li>Regulatory-compliant data handling and storage</li>
            </ul>

            <h4>Why Build & Operate is Optimal</h4>
            <ul>
              <li>MTN focuses on operations and customer relationships</li>
              <li>FleetPro focuses on product innovation and development</li>
              <li>Clear SLA ownership and escalation paths</li>
              <li>Faster time-to-market for new features</li>
            </ul>

            <h4>Why FleetPro is Enterprise-Ready</h4>
            <ul>
              <li>Proven multi-tenant architecture at scale</li>
              <li>99.9% availability design with automatic failover</li>
              <li>Comprehensive audit logging and compliance</li>
              <li>Integration-ready with enterprise systems</li>
            </ul>

            <div className="bg-primary/10 p-4 rounded-lg mt-4 border border-primary/30">
              <p className="text-sm font-medium">
                This document is suitable for MTN-IT internal circulation and can be attached as a 
                technical annex to partnership agreements without modification.
              </p>
            </div>
          </div>
        </DocumentSection>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function DocumentSection({ 
  number, 
  title, 
  icon, 
  children 
}: { 
  number: string; 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 print:break-inside-avoid">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-xl font-semibold">
          <span className="text-muted-foreground mr-2">{number}.</span>
          {title}
        </h2>
      </div>
      <Card className="print:border-none print:shadow-none">
        <CardContent className="pt-4">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function ObjectiveCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function ServiceCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-xs space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
