import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Shield, Database, Users, Lock } from "lucide-react";

const securityArchitectureDiagram = `graph TD
    A[User] --> B[Frontend App]
    B --> C[Authentication Service]
    C --> D[JWT Access Token]
    D --> E[Backend APIs + Functions]
    E --> F[Authorization - RBAC]
    F --> G[Row Level Security - RLS]
    G --> H[Tenant Isolation]
    G --> I[User Isolation]
    H --> J[(Database Tables)]
    I --> J
    E --> K[Secure File Storage]
    E --> L[(security_audit_logs)]
    E --> M[Threat Protections]
    M --> N[(blocked_ips)]
    M --> O[Security Alerts + Notifications]`;

const rbacDiagram = `graph LR
    subgraph Roles
        PA[Platform Admin]
        TA[Tenant Admin]
        SV[Supervisor]
        DR[Driver]
    end
    
    subgraph Permissions
        P1[Full System Access]
        P2[Tenant Management]
        P3[Fleet Operations]
        P4[View Only]
    end
    
    PA --> P1
    TA --> P2
    TA --> P3
    SV --> P3
    DR --> P4`;

const dataFlowDiagram = `graph TD
    subgraph Client Layer
        WEB[Web Application]
        MOB[Mobile App]
    end
    
    subgraph Auth Layer
        AUTH[Authentication]
        JWT[JWT Tokens]
    end
    
    subgraph API Layer
        API[Edge Functions]
        RLS[RLS Policies]
    end
    
    subgraph Data Layer
        DB[(PostgreSQL)]
        STORE[File Storage]
        LOGS[(Audit Logs)]
    end
    
    WEB --> AUTH
    MOB --> AUTH
    AUTH --> JWT
    JWT --> API
    API --> RLS
    RLS --> DB
    API --> STORE
    API --> LOGS`;

const tenantIsolationDiagram = `graph TD
    subgraph Multi-Tenant Architecture
        REQ[Incoming Request]
        AUTH[Authenticate User]
        TID[Extract tenant_id]
        RLS[Apply RLS Policy]
    end
    
    subgraph Tenant A
        TA_DATA[(Tenant A Data)]
    end
    
    subgraph Tenant B
        TB_DATA[(Tenant B Data)]
    end
    
    subgraph Tenant C
        TC_DATA[(Tenant C Data)]
    end
    
    REQ --> AUTH
    AUTH --> TID
    TID --> RLS
    RLS --> TA_DATA
    RLS --> TB_DATA
    RLS --> TC_DATA`;

export default function Architecture() {
  return (
    <DashboardLayout 
      title="System Architecture" 
      subtitle="Technical diagrams and documentation for pitch decks"
    >
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="rbac" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">RBAC</span>
          </TabsTrigger>
          <TabsTrigger value="data-flow" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Flow</span>
          </TabsTrigger>
          <TabsTrigger value="multi-tenant" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Multi-Tenant</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <MermaidDiagram
            chart={securityArchitectureDiagram}
            title="Security Architecture Overview"
            description="End-to-end security flow from user authentication to data access with RLS policies"
          />
        </TabsContent>

        <TabsContent value="rbac" className="space-y-4">
          <MermaidDiagram
            chart={rbacDiagram}
            title="Role-Based Access Control (RBAC)"
            description="User roles and their corresponding permission levels across the platform"
          />
        </TabsContent>

        <TabsContent value="data-flow" className="space-y-4">
          <MermaidDiagram
            chart={dataFlowDiagram}
            title="Data Flow Architecture"
            description="How data flows through the system from client applications to secure storage"
          />
        </TabsContent>

        <TabsContent value="multi-tenant" className="space-y-4">
          <MermaidDiagram
            chart={tenantIsolationDiagram}
            title="Multi-Tenant Isolation"
            description="How tenant data is isolated using Row Level Security policies"
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}



