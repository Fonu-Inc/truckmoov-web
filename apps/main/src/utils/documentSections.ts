import { DocumentSection } from "./wordExport";
import { SlideSection } from "./pptxExport";

// Document sections data for export
export const documentSections: (DocumentSection & SlideSection)[] = [
  {
    number: "1",
    title: "Document Overview",
    content: [
      "FleetPro is an AI-powered fleet management and operations platform designed specifically for African enterprise markets. This document provides a comprehensive technical architecture overview for MTN Nigeria IT Division teams responsible for operating the platform.",
      "Under the Build & Operate model, FleetPro Technologies Ltd builds, maintains, and evolves the platform while MTN Nigeria IT Division operates it for MTN Enterprise Business (EB) customers.",
    ],
    bullets: [
      "Clear ownership boundaries",
      "Regulatory compliance for both parties",
      "Optimal utilization of MTN CPaaS assets",
      "Enterprise-grade SLA delivery",
    ],
  },
  {
    number: "2",
    title: "System Objectives",
    content: [
      "The FleetPro platform is designed to meet the following key objectives for MTN Enterprise Business customers:",
    ],
    bullets: [
      "Enterprise Fleet Visibility: Real-time tracking of all fleet assets with sub-30-second update latency",
      "Reliable Driver Communication: Multi-channel messaging with 99.5% delivery rate via WhatsApp, SMS, and Voice",
      "CPaaS Monetization: Revenue generation through MTN WhatsApp Business API, A2P SMS, and Voice services",
      "IoT SIM Utilization: Optimized connectivity for GPS devices via MTN IoT SIM infrastructure",
      "99.9% Availability: Enterprise-grade uptime with automatic failover and horizontal scaling",
      "Multi-Tenant Scalability: Support for 1000+ concurrent tenants with complete data isolation",
    ],
  },
  {
    number: "3",
    title: "Architecture Principles",
    content: [
      "The FleetPro platform architecture is built on the following core principles:",
    ],
    bullets: [
      "Microservices-Based: Independently deployable services with bounded contexts",
      "Event-Driven: Asynchronous workflows via message queues and webhooks",
      "Multi-Tenant Isolation: Complete data and process isolation per tenant",
      "Cloud-Native: Containerized workloads with Kubernetes orchestration",
      "API-First: All functionality exposed via versioned REST/GraphQL APIs",
      "Telco-Safe: No exposure to MTN core network or subscriber data",
    ],
  },
  {
    number: "4",
    title: "High-Level System Architecture",
    content: [
      "The FleetPro platform consists of multiple interconnected layers: Client Layer (Web Dashboards, Mobile Apps), Gateway Layer (API Gateway, Auth Service), Core Services (Fleet, Dispatch, Tracking, Analytics, Tenant), Messaging Layer (Orchestrator, Queue), MTN CPaaS Integration, IoT Layer, and Data Layer.",
    ],
    bullets: [
      "Web Dashboards: Role-based interfaces for Platform Admin, Fleet Manager, and Supervisor",
      "API Gateway / BFF: Central entry point with authentication, rate limiting, and request routing",
      "Core Backend Services: Microservices handling fleet, dispatch, tracking, and analytics",
      "Messaging Orchestration: Unified layer for WhatsApp, SMS, and Voice with escalation logic",
      "Telematics Ingestion: High-throughput pipeline for GPS device data",
      "MTN CPaaS: Integration with MTN WhatsApp Business API, A2P SMS, and Voice services",
    ],
    diagramId: "high-level-architecture",
  },
  {
    number: "5",
    title: "User Roles & Access Control",
    content: [
      "The platform implements a comprehensive Role-Based Access Control (RBAC) system with JWT authentication and tenant isolation at the database level.",
    ],
    tables: [
      {
        headers: ["Role", "Access Level", "Channels", "Key Permissions"],
        rows: [
          ["Platform Admin", "Full System", "Web Dashboard", "Tenant management, billing, system config"],
          ["Fleet Manager", "Tenant-Scoped", "Web Dashboard", "Fleet CRUD, driver management, analytics"],
          ["Supervisor", "Operational", "Web Dashboard", "Dispatch, live tracking, messaging"],
          ["Driver", "Personal Only", "WhatsApp/SMS/Voice", "View assigned jobs, respond to dispatch"],
        ],
      },
    ],
    bullets: [
      "JWT Tokens: Short-lived access tokens (15min) with refresh token rotation",
      "OAuth 2.0: Standard authorization framework for API access",
      "RBAC: Role-Based Access Control with granular permissions",
      "Tenant Isolation: All queries automatically scoped to user's tenant via Row-Level Security",
    ],
  },
  {
    number: "6",
    title: "Core Application Services",
    content: [
      "The platform is composed of six core microservices, each with well-defined responsibilities:",
    ],
    bullets: [
      "Identity & Tenant Management: User registration, authentication, multi-tenant provisioning, session management",
      "Fleet & Asset Management: Vehicle CRUD, device-vehicle association, driver-vehicle assignment, maintenance scheduling",
      "Dispatch & Operations Engine: Job creation and assignment, route optimization, status tracking, escalation management",
      "Tracking & Telematics Service: Real-time GPS ingestion, geofence management, trip history, driver behavior monitoring",
      "Messaging Orchestration: Multi-channel delivery, fallback and escalation logic, template management, delivery tracking",
      "Analytics & Reporting Service: Fleet utilization metrics, driver performance scoring, cost and fuel analytics",
    ],
  },
  {
    number: "7",
    title: "WhatsApp-First Messaging Architecture",
    content: [
      "The messaging system implements a WhatsApp-first approach with SMS and Voice fallback channels. Messages are routed through a central orchestrator that handles retries, escalations, and audit logging.",
    ],
    tables: [
      {
        headers: ["Channel", "Timeout", "Retry Attempts", "Next Action"],
        rows: [
          ["WhatsApp", "5 minutes", "2", "Escalate to SMS"],
          ["SMS", "3 minutes", "2", "Escalate to Voice"],
          ["Voice (IVR)", "N/A", "3", "Alert Supervisor"],
        ],
      },
    ],
    diagramId: "messaging-architecture",
  },
  {
    number: "8",
    title: "API Sequence — Job Creation & Driver Assignment",
    content: [
      "The job creation and driver assignment flow involves the following sequence: Supervisor creates job via API, Dispatch service selects and assigns the best available driver, Messaging service sends WhatsApp notification, MTN WhatsApp API delivers message and returns confirmation.",
    ],
    bullets: [
      "POST /api/v1/jobs - Create new job",
      "POST /api/v1/jobs/{id}/assign - Assign driver to job",
      "POST /webhooks/messaging/status - Delivery status callback",
      "POST /webhooks/messaging/reply - Driver response callback",
    ],
    diagramId: "job-creation-sequence",
  },
  {
    number: "9",
    title: "API Sequence — Driver Response via WhatsApp",
    content: [
      "When a driver responds via WhatsApp, the platform processes the reply through webhook handlers with proper idempotency and state management.",
    ],
    bullets: [
      "Message Deduplication: External message ID used to prevent duplicate processing",
      "State Machine: Job status transitions validated against allowed state graph",
      "Optimistic Locking: Version field prevents concurrent update conflicts",
      "Audit Log: All state changes recorded with actor, timestamp, and previous state",
    ],
    diagramId: "driver-response-sequence",
  },
  {
    number: "10",
    title: "API Sequence — Telemetry Ingestion & Live Tracking",
    content: [
      "GPS device data flows through the MTN IoT network to the FleetPro ingestion service, where it is normalized, stored, and broadcast to supervisors in real-time.",
    ],
    tables: [
      {
        headers: ["Metric", "Target"],
        rows: [
          ["Ingestion Latency", "< 500ms"],
          ["Map Update Latency", "< 2 seconds"],
          ["Throughput", "10,000 events/second"],
          ["Data Retention", "90 days hot, 2 years cold"],
        ],
      },
    ],
    diagramId: "telemetry-sequence",
  },
  {
    number: "11",
    title: "Telematics & IoT Architecture",
    content: [
      "The IoT architecture connects GPS devices via MTN IoT SIMs to a scalable ingestion pipeline with protocol normalization and device health monitoring.",
    ],
    bullets: [
      "IMEI Validation: Device IMEI registered and validated on first connection",
      "SIM Binding: Device-SIM association enforced for security",
      "Protocol Support: Teltonika, Queclink, Concox native protocols",
      "Device Health: Battery level, signal strength, last seen, firmware version tracking",
    ],
    diagramId: "iot-architecture",
  },
  {
    number: "12",
    title: "Data Architecture",
    content: [
      "The data layer uses a polyglot persistence approach with PostgreSQL for relational data, TimescaleDB for time-series telemetry, Redis for caching, and S3-compatible storage for files.",
    ],
    tables: [
      {
        headers: ["Store", "Technology", "Use Case"],
        rows: [
          ["Relational", "PostgreSQL", "Tenants, users, fleet, jobs"],
          ["Time-Series", "TimescaleDB", "Telemetry, GPS history"],
          ["Cache", "Redis", "Sessions, live positions"],
          ["Object Storage", "S3-Compatible", "Documents, recordings"],
        ],
      },
    ],
    diagramId: "data-architecture",
  },
  {
    number: "13",
    title: "AI & Rules Engine",
    content: [
      "The platform implements a phased approach to automation, starting with rules-based dispatch and escalation (Phase 1), and evolving to AI-assisted routing and prediction (Phase 2).",
    ],
    bullets: [
      "Phase 1 (Rules-Based): Configurable dispatch rules, geofence-triggered alerts, time-based escalations, driver behavior thresholds",
      "Phase 2 (AI-Assisted): Predictive ETA calculation, route optimization, driver fatigue detection, demand forecasting",
    ],
    diagramId: "ai-architecture",
  },
  {
    number: "14",
    title: "API & Integration Layer",
    content: [
      "The platform exposes internal and external APIs with proper authentication, as well as webhook endpoints for enterprise integrations.",
    ],
    tables: [
      {
        headers: ["Category", "Endpoints", "Authentication"],
        rows: [
          ["Internal APIs", "/api/v1/*", "JWT Bearer"],
          ["External APIs", "/external/v1/*", "API Key + HMAC"],
          ["Webhooks (Inbound)", "/webhooks/*", "Signature Verification"],
          ["MTN CPaaS", "Fonu API Gateway", "API Key"],
        ],
      },
    ],
    bullets: [
      "job.created - New job created",
      "job.assigned - Driver assigned to job",
      "job.status_changed - Job status updated",
      "job.completed - Job marked complete",
      "vehicle.geofence_breach - Vehicle entered/exited geofence",
      "driver.behavior_alert - Driving behavior event detected",
    ],
  },
  {
    number: "15",
    title: "Security Architecture",
    content: [
      "The platform implements defense-in-depth security with TLS everywhere, encryption at rest, secret management, comprehensive audit logging, and tenant data isolation via Row-Level Security.",
    ],
    tables: [
      {
        headers: ["Control", "Implementation"],
        rows: [
          ["Transport Security", "TLS 1.3 everywhere, certificate pinning for mobile"],
          ["Encryption at Rest", "AES-256 for databases, S3 SSE for objects"],
          ["Secret Management", "Vault-based secrets with auto-rotation"],
          ["Audit Logging", "All actions logged with correlation IDs"],
          ["Tenant Isolation", "Row-Level Security (RLS) at database level"],
          ["IP Blocking", "Automatic blocking after failed auth attempts"],
        ],
      },
    ],
    diagramId: "security-architecture",
  },
  {
    number: "16",
    title: "Performance & Scalability",
    content: [
      "The platform is designed for horizontal scaling with stateless services, read replicas, and graceful degradation under load.",
    ],
    bullets: [
      "Horizontal Scaling: Stateless services scale via Kubernetes HPA",
      "API Response: p95 < 200ms",
      "Telemetry Ingestion: 10K events/second capacity",
      "Message Delivery: < 5 seconds end-to-end",
      "Circuit Breakers: All external calls protected",
      "Async Retry: Failed deliveries automatically retried",
    ],
  },
  {
    number: "17",
    title: "DevOps & Operations",
    content: [
      "The platform uses modern DevOps practices with CI/CD, containerization, and comprehensive monitoring.",
    ],
    tables: [
      {
        headers: ["Component", "Technology"],
        rows: [
          ["Containerization", "Docker"],
          ["Orchestration", "Kubernetes"],
          ["Service Mesh", "Istio"],
          ["Monitoring", "Prometheus + Grafana"],
          ["Logging", "ELK Stack"],
          ["Alerting", "PagerDuty"],
        ],
      },
    ],
    bullets: [
      "Automated daily backups with 30-day retention",
      "Point-in-time recovery for databases",
      "Cross-region backup replication",
      "RTO: 4 hours, RPO: 1 hour",
    ],
  },
  {
    number: "18",
    title: "Deployment Model (MTN-IT Friendly)",
    content: [
      "The platform is hosted on cloud infrastructure and operated by MTN-IT, with clear separation of concerns for each party.",
    ],
    tables: [
      {
        headers: ["Component", "Hosted By", "Operated By"],
        rows: [
          ["FleetPro Platform", "Cloud Provider", "MTN-IT"],
          ["MTN CPaaS APIs", "MTN Infrastructure", "MTN"],
          ["MTN IoT SIMs", "MTN Network", "MTN"],
          ["GPS Devices", "Customer Premises", "Customer/FleetPro"],
        ],
      },
    ],
    diagramId: "deployment-diagram",
  },
  {
    number: "19",
    title: "Ownership & Responsibility Split",
    content: [
      "Clear delineation of responsibilities between FleetPro and MTN-IT ensures no overlap and regulatory safety.",
    ],
    tables: [
      {
        headers: ["Area", "FleetPro", "MTN-IT"],
        rows: [
          ["Platform Development", "✅ Full ownership", "—"],
          ["IP & Source Code", "✅ Owner", "—"],
          ["Product Roadmap", "✅ Defines", "📋 Consults"],
          ["L2/L3 Support", "✅ Provides", "—"],
          ["Platform Operations", "—", "✅ Operates"],
          ["Security Compliance", "📋 Design", "✅ Enforce"],
          ["SLA Management", "📋 Define", "✅ Deliver"],
          ["CPaaS Integration", "📋 Implement", "✅ Provide APIs"],
          ["Customer Billing", "—", "✅ Manages"],
          ["L1 Support", "—", "✅ Provides"],
        ],
      },
    ],
  },
  {
    number: "20",
    title: "Implementation Phases",
    content: [
      "The implementation is divided into three phases over 12 months:",
    ],
    bullets: [
      "Phase 1 (3 months): Core platform & pilot - Fleet management, real-time tracking, WhatsApp messaging, 5 pilot customers",
      "Phase 2 (4 months): Automation & scale - AI-assisted dispatch, route optimization, full CPaaS integration, 50 customers",
      "Phase 3 (5 months): Enterprise hardening - Advanced analytics, enterprise integrations, multi-region deployment, 200+ customers",
    ],
  },
  {
    number: "21",
    title: "Conclusion",
    content: [
      "This document outlines a comprehensive technical architecture for FleetPro that is specifically designed to integrate safely and effectively within MTN Nigeria's IT infrastructure while maximizing CPaaS asset utilization.",
      "The architecture is safe for MTN-IT with complete isolation from MTN core network, industry-standard security controls, clear operational boundaries, and regulatory-compliant data handling.",
      "This document is suitable for MTN-IT internal circulation and can be attached as a technical annex to partnership agreements without modification.",
    ],
    bullets: [
      "Complete isolation from MTN core network and subscriber data",
      "Industry-standard security controls at every layer",
      "Clear operational boundaries with no ambiguity",
      "Regulatory-compliant data handling and storage",
      "Proven multi-tenant architecture at scale",
      "99.9% availability design with automatic failover",
    ],
  },
];
