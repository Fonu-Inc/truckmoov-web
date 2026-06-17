import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { 
  Code, Copy, Check, ChevronRight, AlertTriangle, Clock, 
  Shield, Zap, BookOpen, Terminal, FileJson, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, '');
const API_BASE_URL = BACKEND_BASE_URL ? `${BACKEND_BASE_URL}/v1` : '/api/v1';

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  scope: string;
  category: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    location: 'path' | 'query' | 'body';
  }>;
  requestBody?: {
    description: string;
    example: Record<string, unknown>;
  };
  response: {
    description: string;
    example: Record<string, unknown>;
  };
}

const API_ENDPOINTS: EndpointDoc[] = [
  // Vehicles
  {
    method: 'GET',
    path: '/vehicles',
    description: 'List all vehicles in your fleet with optional filtering and pagination',
    scope: 'vehicles.read',
    category: 'Vehicles',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)', location: 'query' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20, max: 100)', location: 'query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: active, inactive, maintenance', location: 'query' },
      { name: 'type', type: 'string', required: false, description: 'Filter by vehicle type', location: 'query' },
    ],
    response: {
      description: 'Paginated list of vehicles',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              registration_number: 'ABC-123-XY',
              make: 'DAF',
              model: 'XF 480',
              year: 2022,
              type: 'truck',
              status: 'active',
              current_mileage: 125000,
              fuel_capacity_liters: 400,
              created_at: '2025-01-15T10:30:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            total_pages: 3
          }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/vehicles/{id}',
    description: 'Get detailed information about a specific vehicle',
    scope: 'vehicles.read',
    category: 'Vehicles',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Vehicle ID', location: 'path' },
    ],
    response: {
      description: 'Vehicle details with assigned driver and device info',
      example: {
        data: {
          id: 'uuid',
          registration_number: 'ABC-123-XY',
          make: 'DAF',
          model: 'XF 480',
          year: 2022,
          type: 'truck',
          status: 'active',
          current_mileage: 125000,
          fuel_capacity_liters: 400,
          assigned_driver: {
            id: 'uuid',
            name: 'John Doe',
            phone: '+234...'
          },
          device: {
            id: 'uuid',
            imei: '123456789012345',
            status: 'online',
            last_seen: '2025-02-02T10:30:00Z'
          }
        }
      }
    }
  },
  // Drivers
  {
    method: 'GET',
    path: '/drivers',
    description: 'List all drivers with optional filtering',
    scope: 'drivers.read',
    category: 'Drivers',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number', location: 'query' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page', location: 'query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: available, on_trip, off_duty', location: 'query' },
    ],
    response: {
      description: 'Paginated list of drivers',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              name: 'John Doe',
              phone: '+234...',
              license_number: 'DRV-12345',
              license_expiry: '2026-06-15',
              status: 'available',
              rating: 4.8,
              total_trips: 156
            }
          ],
          pagination: { page: 1, limit: 20, total: 28, total_pages: 2 }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/drivers/{id}',
    description: 'Get detailed driver information',
    scope: 'drivers.read',
    category: 'Drivers',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Driver ID', location: 'path' },
    ],
    response: {
      description: 'Driver details with current assignment',
      example: {
        data: {
          id: 'uuid',
          name: 'John Doe',
          phone: '+234...',
          email: 'john@example.com',
          license_number: 'DRV-12345',
          license_expiry: '2026-06-15',
          status: 'on_trip',
          rating: 4.8,
          total_trips: 156,
          current_vehicle: { id: 'uuid', registration_number: 'ABC-123-XY' },
          current_job: { id: 'uuid', reference: 'JOB-2025-001' }
        }
      }
    }
  },
  // Devices
  {
    method: 'GET',
    path: '/devices',
    description: 'List all IoT tracking devices',
    scope: 'devices.read',
    category: 'Devices',
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status: online, offline, degraded', location: 'query' },
      { name: 'lifecycle_status', type: 'string', required: false, description: 'Filter by lifecycle: registered, assigned, etc.', location: 'query' },
    ],
    response: {
      description: 'List of tracking devices',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              imei: '123456789012345',
              manufacturer: 'Teltonika',
              model: 'FMC130',
              status: 'online',
              health_status: 'online',
              lifecycle_status: 'assigned',
              battery_level: 95,
              signal_strength: -65,
              last_seen: '2025-02-02T10:30:00Z',
              vehicle_id: 'uuid'
            }
          ]
        }
      }
    }
  },
  // Jobs
  {
    method: 'GET',
    path: '/jobs',
    description: 'List dispatch jobs with optional filtering',
    scope: 'jobs.read',
    category: 'Jobs',
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status: pending, assigned, in_transit, delivered, cancelled', location: 'query' },
      { name: 'from_date', type: 'string', required: false, description: 'Filter jobs created after this date (ISO 8601)', location: 'query' },
      { name: 'to_date', type: 'string', required: false, description: 'Filter jobs created before this date', location: 'query' },
    ],
    response: {
      description: 'Paginated list of jobs',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              reference: 'JOB-2025-001',
              status: 'in_transit',
              pickup_address: 'Lagos Port',
              delivery_address: 'Kano Warehouse',
              cargo_description: '20ft Container',
              weight_tons: 18.5,
              assigned_vehicle: { id: 'uuid', registration_number: 'ABC-123-XY' },
              assigned_driver: { id: 'uuid', name: 'John Doe' },
              created_at: '2025-02-01T08:00:00Z',
              estimated_delivery: '2025-02-03T18:00:00Z'
            }
          ]
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/jobs',
    description: 'Create a new dispatch job',
    scope: 'jobs.write',
    category: 'Jobs',
    requestBody: {
      description: 'Job creation payload',
      example: {
        pickup_address: 'Lagos Port Terminal 2',
        pickup_lat: 6.4541,
        pickup_lng: 3.3947,
        delivery_address: 'Kano Industrial Zone',
        delivery_lat: 12.0022,
        delivery_lng: 8.5920,
        cargo_description: '20ft Container - Electronics',
        weight_tons: 18.5,
        cargo_type: 'general',
        required_truck_type: 'flatbed',
        notes: 'Handle with care',
        scheduled_pickup: '2025-02-03T08:00:00Z'
      }
    },
    response: {
      description: 'Created job details',
      example: {
        data: {
          id: 'uuid',
          reference: 'JOB-2025-002',
          status: 'pending',
          created_at: '2025-02-02T10:30:00Z'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/jobs/{id}/status',
    description: 'Get real-time job status and tracking info',
    scope: 'jobs.read',
    category: 'Jobs',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Job ID', location: 'path' },
    ],
    response: {
      description: 'Job status with current location',
      example: {
        data: {
          job_id: 'uuid',
          status: 'in_transit',
          current_location: { lat: 9.0820, lng: 7.4951 },
          distance_remaining_km: 245,
          eta: '2025-02-03T16:30:00Z',
          milestones: [
            { type: 'pickup', completed_at: '2025-02-02T09:15:00Z' },
            { type: 'checkpoint', name: 'Abuja', completed_at: '2025-02-02T14:00:00Z' }
          ]
        }
      }
    }
  },
  // Geofences
  {
    method: 'GET',
    path: '/geofences',
    description: 'List all geofence zones',
    scope: 'geofences.read',
    category: 'Geofences',
    response: {
      description: 'List of geofence zones',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              name: 'Lagos Depot',
              category: 'depot',
              geofence_type: 'circle',
              geometry: { center: { lat: 6.4541, lng: 3.3947 }, radius_meters: 500 },
              alert_on_entry: true,
              alert_on_exit: true
            }
          ]
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/geofence-events',
    description: 'List geofence entry/exit events',
    scope: 'geofences.read',
    category: 'Geofences',
    parameters: [
      { name: 'geofence_id', type: 'uuid', required: false, description: 'Filter by geofence', location: 'query' },
      { name: 'vehicle_id', type: 'uuid', required: false, description: 'Filter by vehicle', location: 'query' },
      { name: 'event_type', type: 'string', required: false, description: 'Filter by type: entry, exit, dwell', location: 'query' },
    ],
    response: {
      description: 'List of geofence events',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              geofence_id: 'uuid',
              geofence_name: 'Lagos Depot',
              vehicle_id: 'uuid',
              event_type: 'entry',
              occurred_at: '2025-02-02T09:00:00Z',
              latitude: 6.4541,
              longitude: 3.3947
            }
          ]
        }
      }
    }
  },
  // Alerts
  {
    method: 'GET',
    path: '/alerts',
    description: 'List fleet alerts and notifications',
    scope: 'alerts.read',
    category: 'Alerts',
    parameters: [
      { name: 'severity', type: 'string', required: false, description: 'Filter by severity: low, medium, high, critical', location: 'query' },
      { name: 'type', type: 'string', required: false, description: 'Filter by alert type', location: 'query' },
      { name: 'acknowledged', type: 'boolean', required: false, description: 'Filter by acknowledgement status', location: 'query' },
    ],
    response: {
      description: 'List of alerts',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              type: 'SPEEDING',
              severity: 'high',
              message: 'Vehicle ABC-123-XY exceeded speed limit',
              vehicle_id: 'uuid',
              driver_id: 'uuid',
              acknowledged: false,
              created_at: '2025-02-02T10:15:00Z'
            }
          ]
        }
      }
    }
  },
  // Maintenance
  {
    method: 'GET',
    path: '/maintenance',
    description: 'List maintenance profiles and schedules',
    scope: 'maintenance.read',
    category: 'Maintenance',
    parameters: [
      { name: 'vehicle_id', type: 'uuid', required: false, description: 'Filter by vehicle', location: 'query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: upcoming, due, overdue', location: 'query' },
    ],
    response: {
      description: 'List of maintenance profiles',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              vehicle_id: 'uuid',
              service_type: 'Oil Change',
              lifecycle_status: 'due',
              next_due_date: '2025-02-05',
              next_due_mileage: 130000,
              interval_km: 10000,
              last_service_date: '2024-12-01'
            }
          ]
        }
      }
    }
  },
  // Fuel
  {
    method: 'GET',
    path: '/fuel',
    description: 'List fuel transactions',
    scope: 'fuel.read',
    category: 'Fuel',
    parameters: [
      { name: 'vehicle_id', type: 'uuid', required: false, description: 'Filter by vehicle', location: 'query' },
      { name: 'from_date', type: 'string', required: false, description: 'Filter from date', location: 'query' },
      { name: 'to_date', type: 'string', required: false, description: 'Filter to date', location: 'query' },
    ],
    response: {
      description: 'List of fuel transactions',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              vehicle_id: 'uuid',
              vehicle_name: 'ABC-123-XY',
              quantity_liters: 150,
              cost_ngn: 112500,
              fuel_type: 'diesel',
              station_name: 'Total Energies - Ikeja',
              odometer_reading: 125000,
              transaction_date: '2025-02-01T14:30:00Z'
            }
          ]
        }
      }
    }
  },
  // Waybills
  {
    method: 'GET',
    path: '/waybills',
    description: 'List waybill records with optional status filtering',
    scope: 'waybills.read',
    category: 'Waybills',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)', location: 'query' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20, max: 100)', location: 'query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: received, processing, extracted, needs_review, approved, invoice_generated, rejected, archived', location: 'query' },
    ],
    response: {
      description: 'Paginated list of waybill records',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              status: 'extracted',
              source_type: 'whatsapp',
              driver_name: 'Musa Ibrahim',
              waybill_number: 'WB-2026-00134',
              origin: 'Lagos Port',
              destination: 'Kano Warehouse',
              customer_name: 'Dangote Industries',
              vehicle_number: 'ABC-123-XY',
              quantity: 20,
              quantity_unit: 'tons',
              weight_kg: 20000,
              ai_confidence_score: 0.94,
              calculated_price_ngn: 850000,
              created_at: '2026-02-15T10:30:00Z'
            }
          ],
          pagination: { page: 1, limit: 20, total: 87, total_pages: 5 }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/waybills/{id}',
    description: 'Get detailed information about a specific waybill',
    scope: 'waybills.read',
    category: 'Waybills',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Waybill ID', location: 'path' },
    ],
    response: {
      description: 'Full waybill record with extracted data and pricing match',
      example: {
        data: {
          id: 'uuid',
          status: 'extracted',
          source_type: 'whatsapp',
          source_phone: '+2348012345678',
          driver_name: 'Musa Ibrahim',
          image_url: 'https://storage.example.com/waybill-images/...',
          waybill_number: 'WB-2026-00134',
          origin: 'Lagos Port',
          destination: 'Kano Warehouse',
          customer_name: 'Dangote Industries',
          vehicle_number: 'ABC-123-XY',
          waybill_date: '2026-02-14',
          quantity: 20,
          quantity_unit: 'tons',
          weight_kg: 20000,
          matched_pricing_rule_id: 'uuid',
          calculated_price_ngn: 850000,
          ai_confidence_score: 0.94,
          ai_model_used: 'gemini-2.5-flash',
          extracted_data: { raw_fields: {} },
          created_at: '2026-02-15T10:30:00Z'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/waybills/{id}/extract',
    description: 'Trigger AI extraction on a waybill image. Extracts structured data from the waybill photo using Gemini vision.',
    scope: 'waybills.write',
    category: 'Waybills',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Waybill ID', location: 'path' },
    ],
    requestBody: {
      description: 'Optional image override (uses stored image if omitted)',
      example: {
        imageUrl: 'https://example.com/waybill-photo.jpg'
      }
    },
    response: {
      description: 'Extraction result with extracted fields and confidence score',
      example: {
        success: true,
        data: {
          waybill_number: 'WB-2026-00134',
          origin: 'Lagos Port',
          destination: 'Kano Warehouse',
          customer_name: 'Dangote Industries',
          vehicle_number: 'ABC-123-XY',
          quantity: 20,
          quantity_unit: 'tons',
          confidence_score: 0.94
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/waybills/{id}/approve',
    description: 'Approve extracted waybill data after review. Moves status to "approved" and locks fields for invoice generation.',
    scope: 'waybills.write',
    category: 'Waybills',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Waybill ID', location: 'path' },
    ],
    requestBody: {
      description: 'Optional field overrides to apply before approval',
      example: {
        overrides: {
          destination: 'Kano Central Warehouse',
          quantity: 22
        }
      }
    },
    response: {
      description: 'Approved waybill record',
      example: {
        success: true,
        data: { id: 'uuid', status: 'approved', updated_at: '2026-02-15T12:00:00Z' }
      }
    }
  },
  {
    method: 'POST',
    path: '/waybills/{id}/reject',
    description: 'Reject a waybill. Optionally provide a reason. Moves status to "rejected".',
    scope: 'waybills.write',
    category: 'Waybills',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Waybill ID', location: 'path' },
    ],
    requestBody: {
      description: 'Rejection reason',
      example: {
        reason: 'Illegible waybill image — driver to re-submit'
      }
    },
    response: {
      description: 'Rejected waybill',
      example: {
        success: true,
        data: { id: 'uuid', status: 'rejected', updated_at: '2026-02-15T12:05:00Z' }
      }
    }
  },
  // Pricing Rules
  {
    method: 'GET',
    path: '/pricing/destinations',
    description: 'List all destination pricing rules for your tenant',
    scope: 'pricing.read',
    category: 'Pricing',
    parameters: [
      { name: 'destination', type: 'string', required: false, description: 'Filter by destination name (partial match)', location: 'query' },
      { name: 'customer_name', type: 'string', required: false, description: 'Filter by customer name', location: 'query' },
      { name: 'is_active', type: 'boolean', required: false, description: 'Filter active/inactive rules (default: true)', location: 'query' },
    ],
    response: {
      description: 'List of pricing rules',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              rule_name: 'Lagos–Kano Standard',
              origin: 'Lagos',
              destination: 'Kano',
              pricing_mode: 'FLAT',
              price_ngn: 850000,
              currency: 'NGN',
              vehicle_type: 'truck',
              customer_name: null,
              is_active: true,
              effective_from: '2026-01-01',
              effective_to: null
            }
          ]
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/pricing/destinations',
    description: 'Create a new destination pricing rule',
    scope: 'pricing.write',
    category: 'Pricing',
    requestBody: {
      description: 'Pricing rule details',
      example: {
        rule_name: 'Lagos–Abuja Premium',
        origin: 'Lagos',
        destination: 'Abuja',
        pricing_mode: 'FLAT',
        price_ngn: 650000,
        vehicle_type: 'truck',
        customer_name: 'BUA Cement',
        effective_from: '2026-03-01',
        notes: 'Negotiated rate for Q1 2026'
      }
    },
    response: {
      description: 'Created pricing rule',
      example: {
        success: true,
        data: { id: 'uuid', rule_name: 'Lagos–Abuja Premium', created_at: '2026-02-18T09:00:00Z' }
      }
    }
  },
  {
    method: 'PUT',
    path: '/pricing/destinations/{id}',
    description: 'Update an existing pricing rule',
    scope: 'pricing.write',
    category: 'Pricing',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Pricing rule ID', location: 'path' },
    ],
    requestBody: {
      description: 'Fields to update',
      example: {
        price_ngn: 700000,
        effective_to: '2026-06-30',
        notes: 'Updated rate for H1 2026'
      }
    },
    response: {
      description: 'Updated pricing rule',
      example: {
        success: true,
        data: { id: 'uuid', price_ngn: 700000, updated_at: '2026-02-18T09:15:00Z' }
      }
    }
  },
  {
    method: 'DELETE',
    path: '/pricing/destinations/{id}',
    description: 'Soft-delete a pricing rule (sets is_active to false)',
    scope: 'pricing.write',
    category: 'Pricing',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Pricing rule ID', location: 'path' },
    ],
    response: {
      description: 'Deactivated pricing rule',
      example: {
        success: true,
        data: { id: 'uuid', is_active: false, updated_at: '2026-02-18T09:20:00Z' }
      }
    }
  },
  // Invoices
  {
    method: 'GET',
    path: '/invoices',
    description: 'List invoices with optional status filtering',
    scope: 'invoices.read',
    category: 'Invoices',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)', location: 'query' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20, max: 100)', location: 'query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: draft, pending_review, approved, sent, paid, overdue, cancelled, disputed', location: 'query' },
    ],
    response: {
      description: 'Paginated list of invoices',
      example: {
        data: {
          items: [
            {
              id: 'uuid',
              invoice_number: 'INV-2026-00042',
              status: 'sent',
              customer_name: 'Dangote Industries',
              origin: 'Lagos Port',
              destination: 'Kano Warehouse',
              vehicle_number: 'ABC-123-XY',
              waybill_number: 'WB-2026-00134',
              subtotal_ngn: 850000,
              tax_amount_ngn: 63750,
              total_ngn: 913750,
              invoice_date: '2026-02-15',
              due_date: '2026-03-15',
              created_at: '2026-02-15T12:30:00Z'
            }
          ],
          pagination: { page: 1, limit: 20, total: 42, total_pages: 3 }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/invoices/{id}',
    description: 'Get detailed information about a specific invoice',
    scope: 'invoices.read',
    category: 'Invoices',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Invoice ID', location: 'path' },
    ],
    response: {
      description: 'Full invoice with line items and sharing history',
      example: {
        data: {
          id: 'uuid',
          invoice_number: 'INV-2026-00042',
          status: 'sent',
          customer_name: 'Dangote Industries',
          customer_phone: '+2348012345678',
          customer_email: 'accounts@dangote.com',
          origin: 'Lagos Port',
          destination: 'Kano Warehouse',
          vehicle_number: 'ABC-123-XY',
          waybill_number: 'WB-2026-00134',
          waybill_date: '2026-02-14',
          quantity: 20,
          quantity_unit: 'tons',
          line_items: [
            { description: 'Haulage: Lagos Port → Kano Warehouse', quantity: 1, unit_price_ngn: 850000, total_ngn: 850000 }
          ],
          subtotal_ngn: 850000,
          tax_rate_percent: 7.5,
          tax_amount_ngn: 63750,
          discount_ngn: 0,
          total_ngn: 913750,
          amount_paid_ngn: 0,
          invoice_date: '2026-02-15',
          due_date: '2026-03-15',
          payment_terms: 'Net 30',
          sent_via: 'whatsapp',
          sent_at: '2026-02-15T13:00:00Z',
          sent_to: '+2348012345678'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/invoices/from-waybill/{waybillId}',
    description: 'Generate an invoice from an approved waybill. Automatically applies matched pricing rules and tenant invoice configuration.',
    scope: 'invoices.write',
    category: 'Invoices',
    parameters: [
      { name: 'waybillId', type: 'uuid', required: true, description: 'Waybill ID to generate invoice from', location: 'path' },
    ],
    response: {
      description: 'Generated invoice',
      example: {
        success: true,
        data: {
          id: 'uuid',
          invoice_number: 'INV-2026-00043',
          status: 'draft',
          total_ngn: 913750,
          created_at: '2026-02-18T10:00:00Z'
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/invoices/{id}',
    description: 'Edit a draft invoice. Only invoices with status "draft" can be modified.',
    scope: 'invoices.write',
    category: 'Invoices',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Invoice ID', location: 'path' },
    ],
    requestBody: {
      description: 'Fields to update (draft invoices only)',
      example: {
        customer_name: 'Dangote Industries Ltd.',
        discount_ngn: 50000,
        notes: 'Loyalty discount applied',
        due_date: '2026-03-20'
      }
    },
    response: {
      description: 'Updated invoice',
      example: {
        success: true,
        data: { id: 'uuid', status: 'draft', total_ngn: 863750, updated_at: '2026-02-18T10:15:00Z' }
      }
    }
  },
  {
    method: 'POST',
    path: '/invoices/{id}/generate-pdf',
    description: 'Generate a downloadable PDF for the invoice. Returns a signed URL valid for 1 hour.',
    scope: 'invoices.write',
    category: 'Invoices',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Invoice ID', location: 'path' },
    ],
    response: {
      description: 'Signed PDF download URL',
      example: {
        success: true,
        data: {
          pdf_url: 'https://storage.example.com/invoices/INV-2026-00042.pdf?token=...',
          expires_at: '2026-02-18T11:15:00Z'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/invoices/{id}/share',
    description: 'Share an invoice via WhatsApp or Email. Records the share event and triggers delivery.',
    scope: 'invoices.write',
    category: 'Invoices',
    parameters: [
      { name: 'id', type: 'uuid', required: true, description: 'Invoice ID', location: 'path' },
    ],
    requestBody: {
      description: 'Share channel and recipient',
      example: {
        channel: 'whatsapp',
        recipient: '+2348012345678'
      }
    },
    response: {
      description: 'Share confirmation',
      example: {
        success: true,
        data: {
          share_id: 'uuid',
          channel: 'whatsapp',
          status: 'SENT',
          sent_at: '2026-02-18T10:30:00Z'
        }
      }
    }
  },
];

const ERROR_CODES = [
  { code: 400, name: 'Bad Request', description: 'Invalid request parameters or malformed JSON' },
  { code: 401, name: 'Unauthorized', description: 'Missing or invalid API key' },
  { code: 403, name: 'Forbidden', description: 'API key lacks required scope for this operation' },
  { code: 404, name: 'Not Found', description: 'Requested resource does not exist' },
  { code: 422, name: 'Validation Error', description: 'Request body failed validation' },
  { code: 429, name: 'Rate Limited', description: 'Too many requests, please slow down' },
  { code: 500, name: 'Server Error', description: 'Internal server error, please retry or contact support' },
];

const WEBHOOK_EVENTS = [
  { event: 'job.created', description: 'A new dispatch job was created' },
  { event: 'job.assigned', description: 'A job was assigned to a driver/vehicle' },
  { event: 'job.started', description: 'Driver started the job (pickup)' },
  { event: 'job.completed', description: 'Job was successfully delivered' },
  { event: 'job.cancelled', description: 'Job was cancelled' },
  { event: 'vehicle.entered_geofence', description: 'Vehicle entered a geofence zone' },
  { event: 'vehicle.exited_geofence', description: 'Vehicle exited a geofence zone' },
  { event: 'alert.created', description: 'A new alert was triggered' },
  { event: 'device.offline', description: 'Tracking device went offline' },
  { event: 'device.online', description: 'Tracking device came back online' },
  { event: 'maintenance.due', description: 'Maintenance is due for a vehicle' },
  { event: 'maintenance.overdue', description: 'Maintenance is overdue for a vehicle' },
  { event: 'waybill.received', description: 'A new waybill image was received (e.g. via WhatsApp)' },
  { event: 'waybill.extracted', description: 'AI extraction completed on a waybill' },
  { event: 'waybill.approved', description: 'Waybill data was reviewed and approved' },
  { event: 'waybill.rejected', description: 'Waybill was rejected during review' },
  { event: 'invoice.generated', description: 'An invoice was generated from a waybill' },
  { event: 'invoice.sent', description: 'An invoice was shared via WhatsApp or Email' },
  { event: 'invoice.paid', description: 'An invoice was marked as paid' },
  { event: 'invoice.overdue', description: 'An invoice has passed its due date' },
  { event: 'pricing.rule_created', description: 'A new pricing rule was added' },
  { event: 'pricing.rule_updated', description: 'A pricing rule was modified' },
];

export function ApiDocumentation() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(API_ENDPOINTS.map(e => e.category)))];

  const filteredEndpoints = selectedCategory === 'all' 
    ? API_ENDPOINTS 
    : API_ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    POST: 'bg-green-500/20 text-green-500 border-green-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    PATCH: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    DELETE: 'bg-red-500/20 text-red-500 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="endpoints">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints" className="gap-2">
            <Code className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="authentication" className="gap-2">
            <Lock className="h-4 w-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errors & Limits
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Zap className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">API Endpoints</h3>
              <p className="text-sm text-muted-foreground">
                Base URL: <code className="bg-muted px-2 py-0.5 rounded">{API_BASE_URL}</code>
              </p>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat === 'all' ? 'All categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {filteredEndpoints.map((endpoint, i) => (
              <AccordionItem 
                key={i} 
                value={`endpoint-${i}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left">
                    <Badge className={methodColors[endpoint.method]}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      — {endpoint.description}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Scope: {endpoint.scope}</Badge>
                    <Badge variant="secondary">{endpoint.category}</Badge>
                  </div>

                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Parameters</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Name</th>
                              <th className="text-left p-2 font-medium">Type</th>
                              <th className="text-left p-2 font-medium">Location</th>
                              <th className="text-left p-2 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, pi) => (
                              <tr key={pi} className="border-t">
                                <td className="p-2">
                                  <code className="text-xs">{param.name}</code>
                                  {param.required && <span className="text-destructive ml-1">*</span>}
                                </td>
                                <td className="p-2 text-muted-foreground">{param.type}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{param.location}</Badge>
                                </td>
                                <td className="p-2 text-muted-foreground">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Request Body</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(JSON.stringify(endpoint.requestBody?.example, null, 2), `req-${i}`)}
                        >
                          {copiedText === `req-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(endpoint.requestBody.example, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Response</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(JSON.stringify(endpoint.response.example, null, 2), `res-${i}`)}
                      >
                        {copiedText === `res-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{endpoint.response.description}</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(endpoint.response.example, null, 2)}
                    </pre>
                  </div>

                  {/* Example cURL */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Example Request
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(
                          `curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\\n  -H "X-API-Key: tm_your_api_key" \\\n  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\\n  -d '${JSON.stringify(endpoint.requestBody.example)}'` : ''}`,
                          `curl-${i}`
                        )}
                      >
                        {copiedText === `curl-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\
  -H "X-API-Key: tm_your_api_key" \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${JSON.stringify(endpoint.requestBody.example)}'` : ''}`}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                API Key Authentication
              </CardTitle>
              <CardDescription>
                All API requests must include your API key in the request headers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Header Format</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm">
                  X-API-Key: tm_your_api_key_here
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Example Request</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`curl -X GET "${API_BASE_URL}/vehicles" \\
  -H "X-API-Key: tm_live_abc123def456" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h4 className="text-sm font-medium flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Security Best Practices
                </h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Never expose your API key in client-side code</li>
                  <li>Rotate keys periodically and after any suspected compromise</li>
                  <li>Use separate keys for development and production</li>
                  <li>Apply the minimum required scopes for each key</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Key Scopes</CardTitle>
              <CardDescription>
                Each API key can be configured with specific scopes to limit access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {['vehicles.read', 'drivers.read', 'devices.read', 'jobs.read', 'jobs.write', 
                  'geofences.read', 'alerts.read', 'maintenance.read', 'fuel.read'].map(scope => (
                  <div key={scope} className="flex items-center gap-2 p-2 border rounded-lg">
                    <Badge variant="outline">{scope}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {scope.includes('write') ? 'Create/Update' : 'Read-only'} access
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors & Limits Tab */}
        <TabsContent value="errors" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Codes
              </CardTitle>
              <CardDescription>
                Standard HTTP status codes and error response format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Code</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ERROR_CODES.map(err => (
                      <tr key={err.code} className="border-t">
                        <td className="p-3">
                          <Badge variant={err.code >= 500 ? 'destructive' : err.code >= 400 ? 'secondary' : 'default'}>
                            {err.code}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">{err.name}</td>
                        <td className="p-3 text-muted-foreground">{err.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Error Response Format</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "pickup_lat",
        "message": "Must be a valid latitude between -90 and 90"
      }
    ]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Rate Limiting
              </CardTitle>
              <CardDescription>
                API rate limits to ensure fair usage and system stability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">60</div>
                  <div className="text-sm text-muted-foreground">Requests per minute</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">10,000</div>
                  <div className="text-sm text-muted-foreground">Requests per day</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Rate Limit Headers</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs">
{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706875200`}
                </pre>
              </div>

              <div className="bg-muted/50 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  When rate limited (429), wait until the <code>X-RateLimit-Reset</code> timestamp 
                  before retrying. Implement exponential backoff for robust handling.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagination</CardTitle>
              <CardDescription>
                All list endpoints support pagination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">page</code>
                  <span className="text-sm text-muted-foreground">Page number (default: 1)</span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">limit</code>
                  <span className="text-sm text-muted-foreground">Items per page (default: 20, max: 100)</span>
                </div>
              </div>

              <pre className="bg-muted p-3 rounded-lg text-xs">
{`GET /vehicles?page=2&limit=50

Response:
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 145,
      "total_pages": 3
    }
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Webhook Events
              </CardTitle>
              <CardDescription>
                Subscribe to real-time events from your fleet operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Event</th>
                      <th className="text-left p-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEBHOOK_EVENTS.map(evt => (
                      <tr key={evt.event} className="border-t">
                        <td className="p-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{evt.event}</code>
                        </td>
                        <td className="p-3 text-muted-foreground">{evt.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Payload Structure</CardTitle>
              <CardDescription>
                All webhooks follow a consistent payload format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "event_id": "evt_abc123def456",
  "event_type": "job.completed",
  "tenant_id": "uuid",
  "occurred_at": "2025-02-02T10:30:00Z",
  "data": {
    "job_id": "uuid",
    "reference": "JOB-2025-001",
    "status": "delivered",
    "delivered_at": "2025-02-02T10:30:00Z",
    "driver": {
      "id": "uuid",
      "name": "John Doe"
    },
    "vehicle": {
      "id": "uuid",
      "registration_number": "ABC-123-XY"
    }
  }
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Signature Verification
              </CardTitle>
              <CardDescription>
                Verify webhook authenticity using HMAC-SHA256 signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Each webhook request includes a signature in the <code className="bg-muted px-1 rounded">X-FleetPro-Signature</code> header.
                Verify this signature using your webhook secret to ensure the request is authentic.
              </p>

              <div>
                <h4 className="text-sm font-medium mb-2">Verification Example (Node.js)</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
const signature = req.headers['x-fleetpro-signature'];
const isValid = verifyWebhookSignature(
  JSON.stringify(req.body),
  signature,
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}`}
                </pre>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h4 className="text-sm font-medium flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Important
                </h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Always verify signatures before processing webhooks</li>
                  <li>Respond with 2xx within 30 seconds to acknowledge receipt</li>
                  <li>Failed deliveries will be retried with exponential backoff</li>
                  <li>Implement idempotency using <code>event_id</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
