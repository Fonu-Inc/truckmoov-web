// High-Level System Architecture
export const highLevelArchitectureDiagram = `graph TB
    subgraph Clients
        WEB[Web Dashboards]
        MOBILE[Mobile Apps]
    end

    subgraph Gateway Layer
        APIGW[API Gateway / BFF]
        AUTH[Auth Service]
    end

    subgraph Core Services
        FLEET[Fleet Service]
        DISPATCH[Dispatch Engine]
        TRACK[Tracking Service]
        ANALYTICS[Analytics Service]
        TENANT[Tenant Service]
    end

    subgraph Messaging Layer
        MSGORCH[Messaging Orchestrator]
        QUEUE[Message Queue]
    end

    subgraph MTN CPaaS
        WHATSAPP[WhatsApp API]
        SMS[A2P SMS]
        VOICE[Voice/SIP]
    end

    subgraph IoT Layer
        INGEST[Telemetry Ingestion]
        MTNIOT[MTN IoT SIM]
        GPS[GPS Devices]
    end

    subgraph Data Layer
        PGDB[(PostgreSQL)]
        TSDB[(TimescaleDB)]
        REDIS[(Redis Cache)]
        S3[(Object Storage)]
    end

    WEB --> APIGW
    MOBILE --> APIGW
    APIGW --> AUTH
    APIGW --> FLEET
    APIGW --> DISPATCH
    APIGW --> TRACK
    APIGW --> ANALYTICS
    APIGW --> TENANT

    DISPATCH --> MSGORCH
    MSGORCH --> QUEUE
    QUEUE --> WHATSAPP
    QUEUE --> SMS
    QUEUE --> VOICE

    GPS --> MTNIOT
    MTNIOT --> INGEST
    INGEST --> TRACK

    FLEET --> PGDB
    DISPATCH --> PGDB
    TENANT --> PGDB
    TRACK --> TSDB
    ANALYTICS --> TSDB
    AUTH --> REDIS
    TRACK --> REDIS`;

// WhatsApp Messaging Architecture
export const whatsappMessagingDiagram = `graph LR
    subgraph Platform
        DISPATCH[Dispatch Engine]
        MSGORCH[Messaging Orchestrator]
        QUEUE[Message Queue]
        RETRY[Retry Handler]
    end

    subgraph MTN CPaaS
        WHATSAPP[WhatsApp Business API]
        SMS[A2P SMS Gateway]
        VOICE[Voice IVR]
    end

    subgraph Driver
        PHONE[Driver Phone]
    end

    DISPATCH --> MSGORCH
    MSGORCH --> QUEUE
    QUEUE --> WHATSAPP
    WHATSAPP -->|Timeout| RETRY
    RETRY --> SMS
    SMS -->|Timeout| RETRY
    RETRY --> VOICE
    
    WHATSAPP --> PHONE
    SMS --> PHONE
    VOICE --> PHONE`;

// Messaging Sequence Diagram
export const messagingSequenceDiagram = `sequenceDiagram
    participant D as Dispatch Engine
    participant M as Messaging Orchestrator
    participant Q as Message Queue
    participant W as MTN WhatsApp API
    participant S as MTN SMS API
    participant V as MTN Voice API
    participant DR as Driver Phone

    D->>M: Send Job Notification
    M->>Q: Queue WhatsApp Message
    Q->>W: POST /messages
    W->>DR: WhatsApp Message
    
    alt No Response in 5 min
        M->>Q: Queue SMS Fallback
        Q->>S: POST /sms
        S->>DR: SMS Message
        
        alt No Response in 3 min
            M->>Q: Queue Voice Call
            Q->>V: POST /calls
            V->>DR: IVR Call
        end
    end
    
    DR-->>W: Driver Reply
    W-->>M: Webhook Callback
    M->>D: Update Job Status`;

// Job Creation Sequence
export const jobCreationSequenceDiagram = `sequenceDiagram
    participant SUP as Supervisor
    participant API as API Gateway
    participant JOB as Job Service
    participant DIS as Dispatch Service
    participant MSG as Messaging Service
    participant MTN as MTN WhatsApp API
    participant DR as Driver

    SUP->>API: POST /api/v1/jobs
    API->>JOB: Create Job
    JOB->>JOB: Validate & Save
    JOB-->>API: Job Created
    API-->>SUP: 201 Created

    SUP->>API: POST /api/v1/jobs/id/assign
    API->>DIS: Assign Driver
    DIS->>DIS: Select Best Driver
    DIS->>MSG: Send Notification
    MSG->>MTN: POST /messages
    MTN->>DR: WhatsApp Notification
    MTN-->>MSG: Message ID
    MSG-->>DIS: Notification Sent
    DIS-->>API: Assignment Complete
    API-->>SUP: 200 OK`;

// Driver Response Sequence
export const driverResponseSequenceDiagram = `sequenceDiagram
    participant DR as Driver
    participant MTN as MTN WhatsApp API
    participant WH as Webhook Handler
    participant MSG as Messaging Service
    participant JOB as Job Service
    participant AUD as Audit Log
    participant SUP as Supervisor UI

    DR->>MTN: Reply: ACCEPT
    MTN->>WH: POST /webhooks/whatsapp
    WH->>WH: Verify Signature
    WH->>MSG: Process Reply
    MSG->>MSG: Deduplicate Message
    MSG->>JOB: Update Job Status
    JOB->>JOB: Validate State Transition
    JOB->>AUD: Log Status Change
    JOB-->>MSG: Status Updated
    MSG->>SUP: WebSocket: Job Accepted
    MSG-->>WH: 200 OK
    WH-->>MTN: 200 OK`;

// Telemetry Ingestion Sequence
export const telemetrySequenceDiagram = `sequenceDiagram
    participant GPS as GPS Device
    participant SIM as MTN IoT SIM
    participant ING as Ingestion Service
    participant NORM as Normalizer
    participant TS as TimescaleDB
    participant CACHE as Redis
    participant WS as WebSocket Server
    participant UI as Supervisor Map

    GPS->>SIM: Raw Telemetry
    SIM->>ING: TCP/UDP Packet
    ING->>ING: IMEI Authentication
    ING->>NORM: Parse Protocol
    NORM->>NORM: Normalize Data
    NORM->>TS: Store Telemetry
    NORM->>CACHE: Update Live Position
    CACHE->>WS: Position Update
    WS->>UI: Push via WebSocket
    UI->>UI: Update Map Marker`;

// IoT Architecture
export const iotArchitectureDiagram = `graph TB
    subgraph Vehicles
        GPS1[GPS Device 1]
        GPS2[GPS Device 2]
        GPSN[GPS Device N]
    end

    subgraph MTN Network
        SIM1[IoT SIM]
        SIM2[IoT SIM]
        SIMN[IoT SIM]
        MTNCORE[MTN IoT Core]
    end

    subgraph FleetPro Platform
        LB[Load Balancer]
        ING1[Ingestion Pod 1]
        ING2[Ingestion Pod 2]
        INGN[Ingestion Pod N]
        KAFKA[Message Broker]
        PROC[Telemetry Processor]
        TSDB[(TimescaleDB)]
        REDIS[(Redis)]
    end

    subgraph Monitoring
        HEALTH[Device Health Monitor]
        ALERT[Alert Engine]
    end

    GPS1 --> SIM1
    GPS2 --> SIM2
    GPSN --> SIMN
    SIM1 --> MTNCORE
    SIM2 --> MTNCORE
    SIMN --> MTNCORE
    
    MTNCORE --> LB
    LB --> ING1
    LB --> ING2
    LB --> INGN
    
    ING1 --> KAFKA
    ING2 --> KAFKA
    INGN --> KAFKA
    
    KAFKA --> PROC
    PROC --> TSDB
    PROC --> REDIS
    PROC --> HEALTH
    HEALTH --> ALERT`;

// Security Architecture
export const securityArchitectureDiagram = `graph TD
    subgraph Public Zone
        USER[Users]
        DEVICE[GPS Devices]
    end

    subgraph DMZ
        WAF[Web Application Firewall]
        APIGW[API Gateway]
        LB[Load Balancer]
    end

    subgraph Application Zone
        AUTH[Auth Service]
        RBAC[RBAC Engine]
        SERVICES[Microservices]
    end

    subgraph Data Zone
        RLS[Row Level Security]
        ENCRYPT[Encryption Layer]
        DB[(Databases)]
    end

    subgraph Security Services
        VAULT[Secret Manager]
        AUDIT[(Audit Logs)]
        IDS[Intrusion Detection]
        BLOCK[(IP Blocklist)]
    end

    USER --> WAF
    WAF --> APIGW
    DEVICE --> LB
    LB --> APIGW
    
    APIGW --> AUTH
    AUTH --> RBAC
    AUTH --> VAULT
    RBAC --> SERVICES
    
    SERVICES --> RLS
    RLS --> ENCRYPT
    ENCRYPT --> DB
    
    APIGW --> AUDIT
    SERVICES --> AUDIT
    WAF --> IDS
    IDS --> BLOCK`;

// Deployment Architecture
export const deploymentDiagram = `graph TB
    subgraph Cloud Provider
        subgraph Kubernetes Cluster
            subgraph Frontend Pods
                WEB[Web App Pods]
            end
            subgraph Backend Pods
                API[API Pods]
                WORKER[Worker Pods]
            end
            subgraph Data Pods
                DB[PostgreSQL]
                TS[TimescaleDB]
                REDIS[Redis]
            end
        end
        S3[Object Storage]
        CDN[CDN]
    end

    subgraph MTN Infrastructure
        CPAS[MTN CPaaS APIs]
        IOT[MTN IoT Network]
    end

    subgraph Customer Sites
        GPS[GPS Devices]
        USERS[End Users]
    end

    USERS --> CDN
    CDN --> WEB
    WEB --> API
    API --> WORKER
    API --> DB
    API --> TS
    API --> REDIS
    API --> S3
    
    API --> CPAS
    GPS --> IOT
    IOT --> API`;

// Data Architecture
export const dataArchitectureDiagram = `erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ VEHICLE : owns
    TENANT ||--o{ DRIVER : employs
    TENANT ||--o{ DEVICE : manages
    
    VEHICLE ||--o| DEVICE : has
    VEHICLE ||--o{ JOB : assigned
    VEHICLE ||--o{ TRIP : records
    
    DRIVER ||--o{ JOB : assigned
    DRIVER ||--o{ MESSAGE : receives
    
    JOB ||--o{ MESSAGE : generates
    JOB ||--o| TRIP : creates
    
    DEVICE ||--o{ TELEMETRY : emits
    
    TENANT {
        uuid id PK
        string name
        string status
        jsonb settings
    }
    
    VEHICLE {
        uuid id PK
        uuid tenant_id FK
        string plate_number
        string status
    }
    
    DRIVER {
        uuid id PK
        uuid tenant_id FK
        string phone
        string name
    }
    
    JOB {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        string status
    }
    
    TELEMETRY {
        uuid id PK
        uuid device_id FK
        timestamp time
        float latitude
        float longitude
        float speed
    }`;

// AI Architecture
export const aiArchitectureDiagram = `graph LR
    subgraph Input Layer
        EVENTS[Business Events]
        TELEMETRY[Telemetry Data]
        HISTORY[Historical Data]
    end

    subgraph Rules Engine
        RULES[Configurable Rules]
        THRESHOLDS[Thresholds]
        TRIGGERS[Event Triggers]
    end

    subgraph AI Layer
        ML[ML Models]
        PREDICT[Prediction Engine]
        OPT[Optimization Engine]
    end

    subgraph Output Layer
        DISPATCH[Smart Dispatch]
        ALERTS[Proactive Alerts]
        ROUTES[Route Suggestions]
        ETA[ETA Predictions]
    end

    EVENTS --> RULES
    TELEMETRY --> RULES
    TELEMETRY --> ML
    HISTORY --> ML
    
    RULES --> THRESHOLDS
    THRESHOLDS --> TRIGGERS
    
    ML --> PREDICT
    PREDICT --> OPT
    
    TRIGGERS --> DISPATCH
    TRIGGERS --> ALERTS
    OPT --> ROUTES
    PREDICT --> ETA`;



