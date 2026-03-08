export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounting_invoice_syncs: {
        Row: {
          amount_ngn: number | null
          created_at: string
          error_message: string | null
          external_amount: number | null
          external_currency: string | null
          external_invoice_id: string | null
          external_invoice_number: string | null
          id: string
          integration_id: string
          job_id: string
          metadata: Json | null
          retry_count: number | null
          sync_direction: string
          sync_status: Database["public"]["Enums"]["accounting_sync_status"]
          synced_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_ngn?: number | null
          created_at?: string
          error_message?: string | null
          external_amount?: number | null
          external_currency?: string | null
          external_invoice_id?: string | null
          external_invoice_number?: string | null
          id?: string
          integration_id: string
          job_id: string
          metadata?: Json | null
          retry_count?: number | null
          sync_direction?: string
          sync_status?: Database["public"]["Enums"]["accounting_sync_status"]
          synced_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_ngn?: number | null
          created_at?: string
          error_message?: string | null
          external_amount?: number | null
          external_currency?: string | null
          external_invoice_id?: string | null
          external_invoice_number?: string | null
          id?: string
          integration_id?: string
          job_id?: string
          metadata?: Json | null
          retry_count?: number | null
          sync_direction?: string
          sync_status?: Database["public"]["Enums"]["accounting_sync_status"]
          synced_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_invoice_syncs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "tenant_accounting_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          integration_id: string | null
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          integration_id?: string | null
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          integration_id?: string | null
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "tenant_accounting_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
        }
        Relationships: []
      }
      ai_match_results: {
        Row: {
          analysis: string | null
          candidates_considered: number
          confidence: number | null
          created_at: string
          id: string
          job_id: string
          model: string
          prompt_hash: string | null
          provider: Database["public"]["Enums"]["ai_provider"]
          tenant_id: string
          top_matches: Json
        }
        Insert: {
          analysis?: string | null
          candidates_considered: number
          confidence?: number | null
          created_at?: string
          id?: string
          job_id: string
          model: string
          prompt_hash?: string | null
          provider: Database["public"]["Enums"]["ai_provider"]
          tenant_id: string
          top_matches?: Json
        }
        Update: {
          analysis?: string | null
          candidates_considered?: number
          confidence?: number | null
          created_at?: string
          id?: string
          job_id?: string
          model?: string
          prompt_hash?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          tenant_id?: string
          top_matches?: Json
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          candidates_count: number | null
          completion_tokens: number | null
          created_at: string
          error_message: string | null
          id: string
          job_id: string | null
          latency_ms: number | null
          matches_returned: number | null
          model: string
          prompt_tokens: number | null
          provider: Database["public"]["Enums"]["ai_provider"]
          request_type: string
          success: boolean
          tenant_id: string
          tokens_used: number
        }
        Insert: {
          candidates_count?: number | null
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          latency_ms?: number | null
          matches_returned?: number | null
          model: string
          prompt_tokens?: number | null
          provider: Database["public"]["Enums"]["ai_provider"]
          request_type?: string
          success?: boolean
          tenant_id: string
          tokens_used?: number
        }
        Update: {
          candidates_count?: number | null
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          latency_ms?: number | null
          matches_returned?: number | null
          model?: string
          prompt_tokens?: number | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          request_type?: string
          success?: boolean
          tenant_id?: string
          tokens_used?: number
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          device_id: string | null
          driver_id: string | null
          id: string
          message: string
          metadata: Json | null
          org_id: string | null
          severity: string
          tenant_id: string
          type: string
          vehicle_id: string | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          device_id?: string | null
          driver_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          org_id?: string | null
          severity?: string
          tenant_id: string
          type: string
          vehicle_id?: string | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          device_id?: string | null
          driver_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          org_id?: string | null
          severity?: string
          tenant_id?: string
          type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          last_used_ip: string | null
          metadata: Json | null
          name: string
          rate_limit_per_day: number
          rate_limit_per_minute: number
          revoked_at: string | null
          revoked_by: string | null
          scopes: Database["public"]["Enums"]["api_scope"][]
          status: Database["public"]["Enums"]["api_key_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          last_used_ip?: string | null
          metadata?: Json | null
          name: string
          rate_limit_per_day?: number
          rate_limit_per_minute?: number
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Database["public"]["Enums"]["api_scope"][]
          status?: Database["public"]["Enums"]["api_key_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          last_used_ip?: string | null
          metadata?: Json | null
          name?: string
          rate_limit_per_day?: number
          rate_limit_per_minute?: number
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Database["public"]["Enums"]["api_scope"][]
          status?: Database["public"]["Enums"]["api_key_status"]
          tenant_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_key_id: string | null
          created_at: string
          id: string
          request_count: number
          tenant_id: string
          window_start: string
          window_type: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          id?: string
          request_count?: number
          tenant_id: string
          window_start: string
          window_type: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          id?: string
          request_count?: number
          tenant_id?: string
          window_start?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number | null
          status_code: number
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code: number
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_permanent: boolean
          metadata: Json | null
          reason: string
          tenant_id: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_permanent?: boolean
          metadata?: Json | null
          reason: string
          tenant_id?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_permanent?: boolean
          metadata?: Json | null
          reason?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          channel: string
          created_at: string
          delivered_count: number | null
          id: string
          message: string
          read_count: number | null
          replied_count: number | null
          sent_by: string | null
          tenant_id: string
          total_recipients: number | null
        }
        Insert: {
          channel?: string
          created_at?: string
          delivered_count?: number | null
          id?: string
          message: string
          read_count?: number | null
          replied_count?: number | null
          sent_by?: string | null
          tenant_id: string
          total_recipients?: number | null
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_count?: number | null
          id?: string
          message?: string
          read_count?: number | null
          replied_count?: number | null
          sent_by?: string | null
          tenant_id?: string
          total_recipients?: number | null
        }
        Relationships: []
      }
      broadcast_recipients: {
        Row: {
          broadcast_id: string
          created_at: string
          delivered_at: string | null
          driver_id: string
          driver_name: string | null
          driver_phone: string
          error_message: string | null
          external_message_id: string | null
          id: string
          read_at: string | null
          replied_at: string | null
          reply_content: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          delivered_at?: string | null
          driver_id: string
          driver_name?: string | null
          driver_phone: string
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_content?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          delivered_at?: string | null
          driver_id?: string
          driver_name?: string | null
          driver_phone?: string
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_content?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_rates: {
        Row: {
          communication_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          rate_ngn: number
          rate_unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          communication_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rate_ngn: number
          rate_unit: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          communication_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rate_ngn?: number
          rate_unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      compliance_documents: {
        Row: {
          created_at: string
          document_name: string
          document_number: string | null
          document_type: string
          expiry_date: string
          file_path: string | null
          id: string
          issue_date: string | null
          notes: string | null
          org_id: string | null
          rejection_reason: string | null
          reminder_days: number | null
          reminder_sent: boolean | null
          status: string
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
          vehicle_id: string | null
          vehicle_name: string | null
          verification_status: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_number?: string | null
          document_type: string
          expiry_date: string
          file_path?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          org_id?: string | null
          rejection_reason?: string | null
          reminder_days?: number | null
          reminder_sent?: boolean | null
          status?: string
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          verification_status?: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string
          file_path?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          org_id?: string | null
          rejection_reason?: string | null
          reminder_days?: number | null
          reminder_sent?: boolean | null
          status?: string
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_pricing_rules: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_name: string | null
          destination: string
          destination_aliases: Json | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          minimum_charge: number | null
          notes: string | null
          org_id: string | null
          origin: string | null
          price_ngn: number
          price_per_unit_ngn: number | null
          pricing_mode: string
          rule_name: string
          tenant_id: string
          unit_type: string | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_name?: string | null
          destination: string
          destination_aliases?: Json | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          minimum_charge?: number | null
          notes?: string | null
          org_id?: string | null
          origin?: string | null
          price_ngn: number
          price_per_unit_ngn?: number | null
          pricing_mode?: string
          rule_name: string
          tenant_id: string
          unit_type?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_name?: string | null
          destination?: string
          destination_aliases?: Json | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          minimum_charge?: number | null
          notes?: string | null
          org_id?: string | null
          origin?: string | null
          price_ngn?: number
          price_per_unit_ngn?: number | null
          pricing_mode?: string
          rule_name?: string
          tenant_id?: string
          unit_type?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_pricing_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_catalog: {
        Row: {
          config_instructions: string | null
          created_at: string
          default_port: number | null
          id: string
          manufacturer: string
          model: string
          payload_schema_reference: string | null
          protocol_type: Database["public"]["Enums"]["device_protocol_type"]
          status: Database["public"]["Enums"]["device_catalog_status"]
          supports_engine_hours: boolean
          supports_fuel: boolean
          supports_fuel_level: boolean
          supports_mileage: boolean
          supports_obd: boolean
          supports_sos: boolean
          updated_at: string
        }
        Insert: {
          config_instructions?: string | null
          created_at?: string
          default_port?: number | null
          id?: string
          manufacturer: string
          model: string
          payload_schema_reference?: string | null
          protocol_type?: Database["public"]["Enums"]["device_protocol_type"]
          status?: Database["public"]["Enums"]["device_catalog_status"]
          supports_engine_hours?: boolean
          supports_fuel?: boolean
          supports_fuel_level?: boolean
          supports_mileage?: boolean
          supports_obd?: boolean
          supports_sos?: boolean
          updated_at?: string
        }
        Update: {
          config_instructions?: string | null
          created_at?: string
          default_port?: number | null
          id?: string
          manufacturer?: string
          model?: string
          payload_schema_reference?: string | null
          protocol_type?: Database["public"]["Enums"]["device_protocol_type"]
          status?: Database["public"]["Enums"]["device_catalog_status"]
          supports_engine_hours?: boolean
          supports_fuel?: boolean
          supports_fuel_level?: boolean
          supports_mileage?: boolean
          supports_obd?: boolean
          supports_sos?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      device_geofence_alerts: {
        Row: {
          alert_type: string
          device_id: string
          geofence_name: string
          id: string
          latitude: number | null
          longitude: number | null
          tenant_id: string
          triggered_at: string
        }
        Insert: {
          alert_type: string
          device_id: string
          geofence_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          tenant_id: string
          triggered_at?: string
        }
        Update: {
          alert_type?: string
          device_id?: string
          geofence_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          tenant_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_geofence_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_installation_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          device_id: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          previous_status: string | null
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          device_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          device_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_installation_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_setup_request_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: string
          notes: string | null
          previous_status: string | null
          request_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status: string
          notes?: string | null
          previous_status?: string | null
          request_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          notes?: string | null
          previous_status?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_setup_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "device_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      device_setup_requests: {
        Row: {
          assigned_at: string | null
          assigned_to_name: string | null
          assigned_to_user_id: string | null
          catalog_id: string | null
          configurator_notes: string | null
          configurator_org_id: string | null
          created_at: string
          device_photo_path: string | null
          id: string
          imei: string
          installation_city: string | null
          installation_state: string | null
          is_support_mode: boolean
          linked_sim_request_id: string | null
          manufacturer: string
          model: string | null
          needs_sim: boolean
          preferred_date: string | null
          preferred_time: string | null
          receipt_photo_path: string | null
          rejection_reason: string | null
          requester_name: string | null
          requester_notes: string | null
          requester_user_id: string
          requesting_org_id: string
          resulting_device_id: string | null
          sim_iccid: string | null
          status: string
          support_actor_id: string | null
          tenant_id: string
          tracker_type: string
          updated_at: string
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_name?: string | null
          assigned_to_user_id?: string | null
          catalog_id?: string | null
          configurator_notes?: string | null
          configurator_org_id?: string | null
          created_at?: string
          device_photo_path?: string | null
          id?: string
          imei: string
          installation_city?: string | null
          installation_state?: string | null
          is_support_mode?: boolean
          linked_sim_request_id?: string | null
          manufacturer: string
          model?: string | null
          needs_sim?: boolean
          preferred_date?: string | null
          preferred_time?: string | null
          receipt_photo_path?: string | null
          rejection_reason?: string | null
          requester_name?: string | null
          requester_notes?: string | null
          requester_user_id: string
          requesting_org_id: string
          resulting_device_id?: string | null
          sim_iccid?: string | null
          status?: string
          support_actor_id?: string | null
          tenant_id: string
          tracker_type?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_name?: string | null
          assigned_to_user_id?: string | null
          catalog_id?: string | null
          configurator_notes?: string | null
          configurator_org_id?: string | null
          created_at?: string
          device_photo_path?: string | null
          id?: string
          imei?: string
          installation_city?: string | null
          installation_state?: string | null
          is_support_mode?: boolean
          linked_sim_request_id?: string | null
          manufacturer?: string
          model?: string | null
          needs_sim?: boolean
          preferred_date?: string | null
          preferred_time?: string | null
          receipt_photo_path?: string | null
          rejection_reason?: string | null
          requester_name?: string | null
          requester_notes?: string | null
          requester_user_id?: string
          requesting_org_id?: string
          resulting_device_id?: string | null
          sim_iccid?: string | null
          status?: string
          support_actor_id?: string | null
          tenant_id?: string
          tracker_type?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_setup_requests_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "device_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_setup_requests_configurator_org_id_fkey"
            columns: ["configurator_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_setup_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_setup_requests_resulting_device_id_fkey"
            columns: ["resulting_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_setup_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_telemetry: {
        Row: {
          accuracy: number | null
          altitude: number | null
          battery_voltage: number | null
          coolant_temp: number | null
          device_id: string
          engine_hours: number | null
          engine_rpm: number | null
          engine_status: string | null
          fuel_level: number | null
          harsh_acceleration: boolean | null
          harsh_braking: boolean | null
          harsh_cornering: boolean | null
          heading: number | null
          id: string
          latitude: number | null
          longitude: number | null
          odometer: number | null
          overspeeding: boolean | null
          raw_data: Json | null
          speed: number | null
          tenant_id: string
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          battery_voltage?: number | null
          coolant_temp?: number | null
          device_id: string
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_status?: string | null
          fuel_level?: number | null
          harsh_acceleration?: boolean | null
          harsh_braking?: boolean | null
          harsh_cornering?: boolean | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          overspeeding?: boolean | null
          raw_data?: Json | null
          speed?: number | null
          tenant_id: string
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          battery_voltage?: number | null
          coolant_temp?: number | null
          device_id?: string
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_status?: string | null
          fuel_level?: number | null
          harsh_acceleration?: boolean | null
          harsh_braking?: boolean | null
          harsh_cornering?: boolean | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          overspeeding?: boolean | null
          raw_data?: Json | null
          speed?: number | null
          tenant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          assigned_at: string | null
          battery_level: number | null
          catalog_id: string | null
          configured_at: string | null
          configured_by: string | null
          created_at: string
          device_config: Json | null
          expected_heartbeat_seconds: number | null
          firmware_version: string | null
          first_telemetry_at: string | null
          fonu_sim_id: string | null
          health_status:
            | Database["public"]["Enums"]["device_health_status"]
            | null
          id: string
          imei: string
          installer_id: string | null
          installer_notes: string | null
          last_health_check_at: string | null
          last_seen: string | null
          last_sim_sync_at: string | null
          last_status_change_at: string | null
          lifecycle_status: Database["public"]["Enums"]["device_lifecycle_status"]
          manufacturer: string
          model: string | null
          offline_threshold_seconds: number | null
          online_threshold_seconds: number | null
          owning_org_id: string | null
          protocol: string | null
          signal_strength: number | null
          sim_id: string | null
          sim_operator: string | null
          sim_status_snapshot: string | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string | null
          verification_error_code: string | null
          verification_error_message: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          battery_level?: number | null
          catalog_id?: string | null
          configured_at?: string | null
          configured_by?: string | null
          created_at?: string
          device_config?: Json | null
          expected_heartbeat_seconds?: number | null
          firmware_version?: string | null
          first_telemetry_at?: string | null
          fonu_sim_id?: string | null
          health_status?:
            | Database["public"]["Enums"]["device_health_status"]
            | null
          id?: string
          imei: string
          installer_id?: string | null
          installer_notes?: string | null
          last_health_check_at?: string | null
          last_seen?: string | null
          last_sim_sync_at?: string | null
          last_status_change_at?: string | null
          lifecycle_status?: Database["public"]["Enums"]["device_lifecycle_status"]
          manufacturer?: string
          model?: string | null
          offline_threshold_seconds?: number | null
          online_threshold_seconds?: number | null
          owning_org_id?: string | null
          protocol?: string | null
          signal_strength?: number | null
          sim_id?: string | null
          sim_operator?: string | null
          sim_status_snapshot?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id?: string | null
          verification_error_code?: string | null
          verification_error_message?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          battery_level?: number | null
          catalog_id?: string | null
          configured_at?: string | null
          configured_by?: string | null
          created_at?: string
          device_config?: Json | null
          expected_heartbeat_seconds?: number | null
          firmware_version?: string | null
          first_telemetry_at?: string | null
          fonu_sim_id?: string | null
          health_status?:
            | Database["public"]["Enums"]["device_health_status"]
            | null
          id?: string
          imei?: string
          installer_id?: string | null
          installer_notes?: string | null
          last_health_check_at?: string | null
          last_seen?: string | null
          last_sim_sync_at?: string | null
          last_status_change_at?: string | null
          lifecycle_status?: Database["public"]["Enums"]["device_lifecycle_status"]
          manufacturer?: string
          model?: string | null
          offline_threshold_seconds?: number | null
          online_threshold_seconds?: number | null
          owning_org_id?: string | null
          protocol?: string | null
          signal_strength?: number | null
          sim_id?: string | null
          sim_operator?: string | null
          sim_status_snapshot?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string | null
          verification_error_code?: string | null
          verification_error_message?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "device_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_behavior_events: {
        Row: {
          created_at: string
          device_id: string
          driver_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          severity: string
          speed: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          driver_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severity?: string
          speed?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          driver_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severity?: string
          speed?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_behavior_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_call_logs: {
        Row: {
          call_type: string
          caller_id: string | null
          caller_name: string | null
          created_at: string
          driver_id: string | null
          driver_name: string | null
          driver_phone: string
          duration_seconds: number | null
          ended_at: string | null
          external_call_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          recording_url: string | null
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          call_type?: string
          caller_id?: string | null
          caller_name?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_call_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          recording_url?: string | null
          started_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          call_type?: string
          caller_id?: string | null
          caller_name?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_call_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          recording_url?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      driver_fatigue_alerts: {
        Row: {
          ai_analysis: string | null
          created_at: string
          device_id: string
          driver_id: string | null
          driver_name: string | null
          driving_duration_minutes: number | null
          fatigue_score: number
          id: string
          indicators: Json | null
          recommendations: string[] | null
          rest_compliance_score: number | null
          risk_level: string
          tenant_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          device_id: string
          driver_id?: string | null
          driver_name?: string | null
          driving_duration_minutes?: number | null
          fatigue_score: number
          id?: string
          indicators?: Json | null
          recommendations?: string[] | null
          rest_compliance_score?: number | null
          risk_level: string
          tenant_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          device_id?: string
          driver_id?: string | null
          driver_name?: string | null
          driving_duration_minutes?: number | null
          fatigue_score?: number
          id?: string
          indicators?: Json | null
          recommendations?: string[] | null
          rest_compliance_score?: number | null
          risk_level?: string
          tenant_id?: string
        }
        Relationships: []
      }
      driver_fuel_efficiency: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          avg_fuel_efficiency_km_per_liter: number | null
          avg_speed_kmh: number | null
          created_at: string
          data_completeness_percent: number | null
          driver_id: string
          efficiency_rank: number | null
          efficiency_vs_fleet_percent: number | null
          estimated_fuel_cost_ngn: number | null
          fleet_avg_efficiency: number | null
          harsh_event_count: number | null
          id: string
          idle_time_hours: number | null
          potential_savings_ngn: number | null
          tenant_id: string
          total_distance_km: number | null
          total_fuel_consumed_liters: number | null
          trips_analyzed: number | null
          updated_at: string
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          avg_fuel_efficiency_km_per_liter?: number | null
          avg_speed_kmh?: number | null
          created_at?: string
          data_completeness_percent?: number | null
          driver_id: string
          efficiency_rank?: number | null
          efficiency_vs_fleet_percent?: number | null
          estimated_fuel_cost_ngn?: number | null
          fleet_avg_efficiency?: number | null
          harsh_event_count?: number | null
          id?: string
          idle_time_hours?: number | null
          potential_savings_ngn?: number | null
          tenant_id: string
          total_distance_km?: number | null
          total_fuel_consumed_liters?: number | null
          trips_analyzed?: number | null
          updated_at?: string
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          avg_fuel_efficiency_km_per_liter?: number | null
          avg_speed_kmh?: number | null
          created_at?: string
          data_completeness_percent?: number | null
          driver_id?: string
          efficiency_rank?: number | null
          efficiency_vs_fleet_percent?: number | null
          estimated_fuel_cost_ngn?: number | null
          fleet_avg_efficiency?: number | null
          harsh_event_count?: number | null
          id?: string
          idle_time_hours?: number | null
          potential_savings_ngn?: number | null
          tenant_id?: string
          total_distance_km?: number | null
          total_fuel_consumed_liters?: number | null
          trips_analyzed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_fuel_efficiency_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_ivr_calls: {
        Row: {
          attempt_number: number
          call_duration_seconds: number | null
          call_status: string
          call_type: string
          created_at: string
          driver_name: string | null
          driver_phone: string
          driver_response: string | null
          fonu_call_id: string | null
          id: string
          job_details: Json | null
          job_id: string | null
          metadata: Json | null
          response_received_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempt_number?: number
          call_duration_seconds?: number | null
          call_status?: string
          call_type?: string
          created_at?: string
          driver_name?: string | null
          driver_phone: string
          driver_response?: string | null
          fonu_call_id?: string | null
          id?: string
          job_details?: Json | null
          job_id?: string | null
          metadata?: Json | null
          response_received_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          call_duration_seconds?: number | null
          call_status?: string
          call_type?: string
          created_at?: string
          driver_name?: string | null
          driver_phone?: string
          driver_response?: string | null
          fonu_call_id?: string | null
          id?: string
          job_details?: Json | null
          job_id?: string | null
          metadata?: Json | null
          response_received_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          driver_id: string
          driver_name: string | null
          driver_phone: string
          error_message: string | null
          external_id: string | null
          id: string
          message_type: string
          metadata: Json | null
          sender_id: string | null
          sender_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          direction?: string
          driver_id: string
          driver_name?: string | null
          driver_phone: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          driver_id?: string
          driver_name?: string | null
          driver_phone?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          communication_preference: string | null
          created_at: string
          current_vehicle_id: string | null
          email: string | null
          id: string
          license_expiry: string | null
          license_number: string
          name: string
          owning_org_id: string | null
          phone: string
          rating: number | null
          status: string
          tenant_id: string
          total_trips: number | null
          updated_at: string
        }
        Insert: {
          communication_preference?: string | null
          created_at?: string
          current_vehicle_id?: string | null
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number: string
          name: string
          owning_org_id?: string | null
          phone: string
          rating?: number | null
          status?: string
          tenant_id: string
          total_trips?: number | null
          updated_at?: string
        }
        Update: {
          communication_preference?: string | null
          created_at?: string
          current_vehicle_id?: string | null
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string
          name?: string
          owning_org_id?: string | null
          phone?: string
          rating?: number | null
          status?: string
          tenant_id?: string
          total_trips?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_drivers_vehicle"
            columns: ["current_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string | null
          created_at: string
          enabled_by: string | null
          feature_description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean
          phase: string | null
          rollout_percentage: number | null
          scope: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          enabled_by?: string | null
          feature_description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          phase?: string | null
          rollout_percentage?: number | null
          scope?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          enabled_by?: string | null
          feature_description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          phase?: string | null
          rollout_percentage?: number | null
          scope?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fuel_anomaly_events: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_consumption: number | null
          alert_id: string | null
          anomaly_type: string
          confidence_score: number | null
          corroborating_events: string[] | null
          created_at: string
          detected_at: string
          device_id: string | null
          expected_consumption: number | null
          fuel_drop_liters: number | null
          fuel_drop_percent: number | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          pattern_analysis: string | null
          severity: string
          tenant_id: string
          theft_confidence_score: number | null
          theft_evidence: Json | null
          variance_percent: number | null
          vehicle_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_consumption?: number | null
          alert_id?: string | null
          anomaly_type: string
          confidence_score?: number | null
          corroborating_events?: string[] | null
          created_at?: string
          detected_at?: string
          device_id?: string | null
          expected_consumption?: number | null
          fuel_drop_liters?: number | null
          fuel_drop_percent?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          pattern_analysis?: string | null
          severity?: string
          tenant_id: string
          theft_confidence_score?: number | null
          theft_evidence?: Json | null
          variance_percent?: number | null
          vehicle_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_consumption?: number | null
          alert_id?: string | null
          anomaly_type?: string
          confidence_score?: number | null
          corroborating_events?: string[] | null
          created_at?: string
          detected_at?: string
          device_id?: string | null
          expected_consumption?: number | null
          fuel_drop_liters?: number | null
          fuel_drop_percent?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          pattern_analysis?: string | null
          severity?: string
          tenant_id?: string
          theft_confidence_score?: number | null
          theft_evidence?: Json | null
          variance_percent?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_anomaly_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_level_history: {
        Row: {
          device_id: string | null
          fuel_level_liters: number | null
          fuel_level_percent: number
          id: string
          latitude: number | null
          longitude: number | null
          odometer: number | null
          recorded_at: string
          source: string
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          device_id?: string | null
          fuel_level_liters?: number | null
          fuel_level_percent: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          recorded_at?: string
          source?: string
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          device_id?: string | null
          fuel_level_liters?: number | null
          fuel_level_percent?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          recorded_at?: string
          source?: string
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_level_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_transactions: {
        Row: {
          cost_ngn: number
          created_at: string
          driver_name: string | null
          fuel_type: string
          id: string
          location: string | null
          notes: string | null
          odometer_reading: number | null
          quantity_liters: number
          receipt_number: string | null
          station_name: string | null
          tenant_id: string
          transaction_date: string
          updated_at: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          cost_ngn: number
          created_at?: string
          driver_name?: string | null
          fuel_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          odometer_reading?: number | null
          quantity_liters: number
          receipt_number?: string | null
          station_name?: string | null
          tenant_id: string
          transaction_date?: string
          updated_at?: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          cost_ngn?: number
          created_at?: string
          driver_name?: string | null
          fuel_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          odometer_reading?: number | null
          quantity_liters?: number
          receipt_number?: string | null
          station_name?: string | null
          tenant_id?: string
          transaction_date?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      geofence_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["geofence_event_type"]
          geofence_id: string
          id: string
          job_id: string | null
          latitude: number | null
          longitude: number | null
          milestone_type: string | null
          occurred_at: string
          speed: number | null
          telemetry_id: string | null
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["geofence_event_type"]
          geofence_id: string
          id?: string
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          milestone_type?: string | null
          occurred_at?: string
          speed?: number | null
          telemetry_id?: string | null
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["geofence_event_type"]
          geofence_id?: string
          id?: string
          job_id?: string | null
          latitude?: number | null
          longitude?: number | null
          milestone_type?: string | null
          occurred_at?: string
          speed?: number | null
          telemetry_id?: string | null
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          alert_on_dwell: boolean
          alert_on_entry: boolean
          alert_on_exit: boolean
          category: Database["public"]["Enums"]["geofence_category"]
          color: string | null
          created_at: string
          created_by: string | null
          dwell_threshold_minutes: number | null
          geofence_type: Database["public"]["Enums"]["geofence_type"]
          geometry: Json
          id: string
          name: string
          org_id: string | null
          radius_meters: number | null
          schedule_days: string[] | null
          schedule_enabled: boolean
          schedule_end_time: string | null
          schedule_start_time: string | null
          speed_limit_kmh: number | null
          status: Database["public"]["Enums"]["geofence_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_on_dwell?: boolean
          alert_on_entry?: boolean
          alert_on_exit?: boolean
          category?: Database["public"]["Enums"]["geofence_category"]
          color?: string | null
          created_at?: string
          created_by?: string | null
          dwell_threshold_minutes?: number | null
          geofence_type?: Database["public"]["Enums"]["geofence_type"]
          geometry: Json
          id?: string
          name: string
          org_id?: string | null
          radius_meters?: number | null
          schedule_days?: string[] | null
          schedule_enabled?: boolean
          schedule_end_time?: string | null
          schedule_start_time?: string | null
          speed_limit_kmh?: number | null
          status?: Database["public"]["Enums"]["geofence_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_on_dwell?: boolean
          alert_on_entry?: boolean
          alert_on_exit?: boolean
          category?: Database["public"]["Enums"]["geofence_category"]
          color?: string | null
          created_at?: string
          created_by?: string | null
          dwell_threshold_minutes?: number | null
          geofence_type?: Database["public"]["Enums"]["geofence_type"]
          geometry?: Json
          id?: string
          name?: string
          org_id?: string | null
          radius_meters?: number | null
          schedule_days?: string[] | null
          schedule_enabled?: boolean
          schedule_end_time?: string | null
          schedule_start_time?: string | null
          speed_limit_kmh?: number | null
          status?: Database["public"]["Enums"]["geofence_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          changes: Json | null
          created_at: string
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "waybill_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_shares: {
        Row: {
          channel: string
          created_at: string
          id: string
          invoice_id: string
          provider_response: Json | null
          recipient: string
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          invoice_id: string
          provider_response?: Json | null
          recipient: string
          sent_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string
          provider_response?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_shares_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "waybill_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_ngn: number
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          subscription_id: string | null
          tax_ngn: number | null
          tenant_id: string
          tenant_name: string
          total_ngn: number
          updated_at: string
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          tax_ngn?: number | null
          tenant_id: string
          tenant_name: string
          total_ngn: number
          updated_at?: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          tax_ngn?: number | null
          tenant_id?: string
          tenant_name?: string
          total_ngn?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_sims: {
        Row: {
          activation_date: string | null
          carrier: string
          created_at: string
          data_limit_mb: number
          data_usage_mb: number
          device_id: string | null
          expiry_date: string | null
          fonu_sim_id: string | null
          fonu_status: string | null
          iccid: string
          id: string
          imsi: string | null
          last_activity: string | null
          monthly_cost_ngn: number
          msisdn: string
          network_type: string | null
          plan: string
          roaming: boolean | null
          signal_strength: number | null
          sms_limit: number
          sms_usage: number
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          activation_date?: string | null
          carrier?: string
          created_at?: string
          data_limit_mb?: number
          data_usage_mb?: number
          device_id?: string | null
          expiry_date?: string | null
          fonu_sim_id?: string | null
          fonu_status?: string | null
          iccid: string
          id?: string
          imsi?: string | null
          last_activity?: string | null
          monthly_cost_ngn?: number
          msisdn: string
          network_type?: string | null
          plan?: string
          roaming?: boolean | null
          signal_strength?: number | null
          sms_limit?: number
          sms_usage?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          activation_date?: string | null
          carrier?: string
          created_at?: string
          data_limit_mb?: number
          data_usage_mb?: number
          device_id?: string | null
          expiry_date?: string | null
          fonu_sim_id?: string | null
          fonu_status?: string | null
          iccid?: string
          id?: string
          imsi?: string | null
          last_activity?: string | null
          monthly_cost_ngn?: number
          msisdn?: string
          network_type?: string | null
          plan?: string
          roaming?: boolean | null
          signal_strength?: number | null
          sms_limit?: number
          sms_usage?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iot_sims_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offer_delivery_log: {
        Row: {
          attempted_at: string
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_message_id: string | null
          id: string
          offer_id: string
          response_keyword: string | null
          response_received_at: string | null
          status: string
        }
        Insert: {
          attempted_at?: string
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          offer_id: string
          response_keyword?: string | null
          response_received_at?: string | null
          status?: string
        }
        Update: {
          attempted_at?: string
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          offer_id?: string
          response_keyword?: string | null
          response_received_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offer_delivery_log_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          job_id: string
          job_owner_org_id: string
          offer_channel: string | null
          offer_message_id: string | null
          offered_at: string
          offered_rate_ngn: number | null
          responded_at: string | null
          response_note: string | null
          status: string
          target_driver_id: string | null
          target_org_id: string
          target_vehicle_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id: string
          job_owner_org_id: string
          offer_channel?: string | null
          offer_message_id?: string | null
          offered_at?: string
          offered_rate_ngn?: number | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_driver_id?: string | null
          target_org_id: string
          target_vehicle_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id?: string
          job_owner_org_id?: string
          offer_channel?: string | null
          offer_message_id?: string | null
          offered_at?: string
          offered_rate_ngn?: number | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_driver_id?: string | null
          target_org_id?: string
          target_vehicle_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_job_owner_org_id_fkey"
            columns: ["job_owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_target_driver_id_fkey"
            columns: ["target_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_target_vehicle_id_fkey"
            columns: ["target_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_settlements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          gross_amount: number
          id: string
          job_id: string
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payee_org_id: string
          payer_org_id: string
          platform_fee: number | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          job_id: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payee_org_id: string
          payer_org_id: string
          platform_fee?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          job_id?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payee_org_id?: string
          payer_org_id?: string
          platform_fee?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_settlements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_settlements_payee_org_id_fkey"
            columns: ["payee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_settlements_payer_org_id_fkey"
            columns: ["payer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          amount_ngn: number | null
          arrived_dropoff_at: string | null
          arrived_pickup_at: string | null
          assigned_driver_id: string | null
          assigned_vehicle_id: string | null
          billable_hours: number | null
          billable_km: number | null
          cargo_description: string | null
          cargo_type: string | null
          cargo_weight: number | null
          completed_at: string | null
          created_at: string
          customer_charge_ngn: number | null
          deadline: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          driver_id: string | null
          dropoff_geofence_id: string | null
          executing_org_id: string | null
          id: string
          job_owner_org_id: string | null
          notes: string | null
          pickup_address: string
          pickup_geofence_id: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          profit_margin_percent: number | null
          reference: string
          revenue_ngn: number | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount_ngn?: number | null
          arrived_dropoff_at?: string | null
          arrived_pickup_at?: string | null
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          billable_hours?: number | null
          billable_km?: number | null
          cargo_description?: string | null
          cargo_type?: string | null
          cargo_weight?: number | null
          completed_at?: string | null
          created_at?: string
          customer_charge_ngn?: number | null
          deadline?: string | null
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          dropoff_geofence_id?: string | null
          executing_org_id?: string | null
          id?: string
          job_owner_org_id?: string | null
          notes?: string | null
          pickup_address: string
          pickup_geofence_id?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          profit_margin_percent?: number | null
          reference: string
          revenue_ngn?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount_ngn?: number | null
          arrived_dropoff_at?: string | null
          arrived_pickup_at?: string | null
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          billable_hours?: number | null
          billable_km?: number | null
          cargo_description?: string | null
          cargo_type?: string | null
          cargo_weight?: number | null
          completed_at?: string | null
          created_at?: string
          customer_charge_ngn?: number | null
          deadline?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          dropoff_geofence_id?: string | null
          executing_org_id?: string | null
          id?: string
          job_owner_org_id?: string | null
          notes?: string | null
          pickup_address?: string
          pickup_geofence_id?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          profit_margin_percent?: number | null
          reference?: string
          revenue_ngn?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_dropoff_geofence_id_fkey"
            columns: ["dropoff_geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_executing_org_id_fkey"
            columns: ["executing_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_job_owner_org_id_fkey"
            columns: ["job_owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_pickup_geofence_id_fkey"
            columns: ["pickup_geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_notification_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_status: string
          document_id: string | null
          document_name: string
          document_type: string
          email_subject: string | null
          error_message: string | null
          id: string
          notification_type: string
          rejection_reason: string | null
          resend_message_id: string | null
          sent_at: string
          sent_by: string | null
          tenant_email: string
          tenant_id: string
          tenant_name: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          document_id?: string | null
          document_name: string
          document_type: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          rejection_reason?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          tenant_email: string
          tenant_id: string
          tenant_name?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          document_id?: string | null
          document_name?: string
          document_type?: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          rejection_reason?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          tenant_email?: string
          tenant_id?: string
          tenant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_notification_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "tenant_kyc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_completions: {
        Row: {
          completion_date: string
          completion_engine_hours: number | null
          completion_mileage: number | null
          cost_ngn: number | null
          created_at: string
          id: string
          labor_cost_ngn: number | null
          notes: string | null
          parts_cost_ngn: number | null
          profile_id: string | null
          service_type: string
          technician_name: string | null
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          completion_date?: string
          completion_engine_hours?: number | null
          completion_mileage?: number | null
          cost_ngn?: number | null
          created_at?: string
          id?: string
          labor_cost_ngn?: number | null
          notes?: string | null
          parts_cost_ngn?: number | null
          profile_id?: string | null
          service_type: string
          technician_name?: string | null
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          completion_date?: string
          completion_engine_hours?: number | null
          completion_mileage?: number | null
          cost_ngn?: number | null
          created_at?: string
          id?: string
          labor_cost_ngn?: number | null
          notes?: string | null
          parts_cost_ngn?: number | null
          profile_id?: string | null
          service_type?: string
          technician_name?: string | null
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_completions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "maintenance_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          due_alert_sent: boolean | null
          due_soon_days: number | null
          due_soon_km: number | null
          id: string
          interval_days: number | null
          interval_engine_hours: number | null
          interval_km: number | null
          interval_months: number | null
          interval_type: Database["public"]["Enums"]["maintenance_interval_type"]
          is_archived: boolean
          last_service_date: string | null
          last_service_engine_hours: number | null
          last_service_mileage: number | null
          lifecycle_status: Database["public"]["Enums"]["maintenance_lifecycle_status"]
          next_due_date: string | null
          next_due_engine_hours: number | null
          next_due_mileage: number | null
          overdue_alert_sent: boolean | null
          service_label: string | null
          service_type: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_alert_sent?: boolean | null
          due_soon_days?: number | null
          due_soon_km?: number | null
          id?: string
          interval_days?: number | null
          interval_engine_hours?: number | null
          interval_km?: number | null
          interval_months?: number | null
          interval_type?: Database["public"]["Enums"]["maintenance_interval_type"]
          is_archived?: boolean
          last_service_date?: string | null
          last_service_engine_hours?: number | null
          last_service_mileage?: number | null
          lifecycle_status?: Database["public"]["Enums"]["maintenance_lifecycle_status"]
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_mileage?: number | null
          overdue_alert_sent?: boolean | null
          service_label?: string | null
          service_type: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_alert_sent?: boolean | null
          due_soon_days?: number | null
          due_soon_km?: number | null
          id?: string
          interval_days?: number | null
          interval_engine_hours?: number | null
          interval_km?: number | null
          interval_months?: number | null
          interval_type?: Database["public"]["Enums"]["maintenance_interval_type"]
          is_archived?: boolean
          last_service_date?: string | null
          last_service_engine_hours?: number | null
          last_service_mileage?: number | null
          lifecycle_status?: Database["public"]["Enums"]["maintenance_lifecycle_status"]
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_mileage?: number | null
          overdue_alert_sent?: boolean | null
          service_label?: string | null
          service_type?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_profiles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completed_date: string | null
          cost_ngn: number | null
          created_at: string
          id: string
          maintenance_type: string
          notes: string | null
          priority: string | null
          scheduled_date: string
          status: string
          technician: string | null
          tenant_id: string
          updated_at: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          completed_date?: string | null
          cost_ngn?: number | null
          created_at?: string
          id?: string
          maintenance_type: string
          notes?: string | null
          priority?: string | null
          scheduled_date: string
          status?: string
          technician?: string | null
          tenant_id: string
          updated_at?: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          completed_date?: string | null
          cost_ngn?: number | null
          created_at?: string
          id?: string
          maintenance_type?: string
          notes?: string | null
          priority?: string | null
          scheduled_date?: string
          status?: string
          technician?: string | null
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      maintenance_risk_scores: {
        Row: {
          age_factor: number | null
          behavioral_factor: number | null
          computed_at: string
          confidence_score: number | null
          contributing_factors: Json | null
          created_at: string
          data_points_analyzed: number | null
          engine_hours_factor: number | null
          historical_breakdown_factor: number | null
          id: string
          mileage_factor: number | null
          overall_risk_score: number
          overdue_maintenance_factor: number | null
          recommendations: string[] | null
          risk_level: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          age_factor?: number | null
          behavioral_factor?: number | null
          computed_at?: string
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          data_points_analyzed?: number | null
          engine_hours_factor?: number | null
          historical_breakdown_factor?: number | null
          id?: string
          mileage_factor?: number | null
          overall_risk_score?: number
          overdue_maintenance_factor?: number | null
          recommendations?: string[] | null
          risk_level?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          age_factor?: number | null
          behavioral_factor?: number | null
          computed_at?: string
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          data_points_analyzed?: number | null
          engine_hours_factor?: number | null
          historical_breakdown_factor?: number | null
          id?: string
          mileage_factor?: number | null
          overall_risk_score?: number
          overdue_maintenance_factor?: number | null
          recommendations?: string[] | null
          risk_level?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_risk_scores_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_sla_metrics: {
        Row: {
          avg_cost_per_vehicle_30d: number | null
          avg_days_to_service: number | null
          avg_delay_days: number | null
          computed_at: string
          cost_trend_percentage: number | null
          created_at: string
          id: string
          on_time_completion_rate: number | null
          overdue_percentage: number | null
          preventive_vs_reactive_ratio: number | null
          tenant_id: string
          total_completions_30d: number | null
          total_maintenance_cost_30d: number | null
          total_vehicles: number | null
          updated_at: string
          vehicles_with_due_soon: number | null
          vehicles_with_overdue: number | null
        }
        Insert: {
          avg_cost_per_vehicle_30d?: number | null
          avg_days_to_service?: number | null
          avg_delay_days?: number | null
          computed_at?: string
          cost_trend_percentage?: number | null
          created_at?: string
          id?: string
          on_time_completion_rate?: number | null
          overdue_percentage?: number | null
          preventive_vs_reactive_ratio?: number | null
          tenant_id: string
          total_completions_30d?: number | null
          total_maintenance_cost_30d?: number | null
          total_vehicles?: number | null
          updated_at?: string
          vehicles_with_due_soon?: number | null
          vehicles_with_overdue?: number | null
        }
        Update: {
          avg_cost_per_vehicle_30d?: number | null
          avg_days_to_service?: number | null
          avg_delay_days?: number | null
          computed_at?: string
          cost_trend_percentage?: number | null
          created_at?: string
          id?: string
          on_time_completion_rate?: number | null
          overdue_percentage?: number | null
          preventive_vs_reactive_ratio?: number | null
          tenant_id?: string
          total_completions_30d?: number | null
          total_maintenance_cost_30d?: number | null
          total_vehicles?: number | null
          updated_at?: string
          vehicles_with_due_soon?: number | null
          vehicles_with_overdue?: number | null
        }
        Relationships: []
      }
      org_relationships: {
        Row: {
          created_at: string
          end_date: string | null
          from_org_id: string
          id: string
          permissions: Json | null
          relationship_type: Database["public"]["Enums"]["org_relationship_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["org_relationship_status"]
          tenant_id: string
          to_org_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          from_org_id: string
          id?: string
          permissions?: Json | null
          relationship_type: Database["public"]["Enums"]["org_relationship_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["org_relationship_status"]
          tenant_id: string
          to_org_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          from_org_id?: string
          id?: string
          permissions?: Json | null
          relationship_type?: Database["public"]["Enums"]["org_relationship_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["org_relationship_status"]
          tenant_id?: string
          to_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_relationships_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_relationships_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_role_definitions: {
        Row: {
          applicable_org_types: Database["public"]["Enums"]["organization_type"][]
          created_at: string
          description: string | null
          display_name: string
          is_system_role: boolean
          permissions: Json
          role_key: string
          role_scope: Database["public"]["Enums"]["org_role_scope"]
        }
        Insert: {
          applicable_org_types: Database["public"]["Enums"]["organization_type"][]
          created_at?: string
          description?: string | null
          display_name: string
          is_system_role?: boolean
          permissions?: Json
          role_key: string
          role_scope?: Database["public"]["Enums"]["org_role_scope"]
        }
        Update: {
          applicable_org_types?: Database["public"]["Enums"]["organization_type"][]
          created_at?: string
          description?: string | null
          display_name?: string
          is_system_role?: boolean
          permissions?: Json
          role_key?: string
          role_scope?: Database["public"]["Enums"]["org_role_scope"]
        }
        Relationships: []
      }
      org_upgrade_requests: {
        Row: {
          created_at: string
          current_vehicle_count: number | null
          from_type: string
          id: string
          org_id: string
          reason: string | null
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          to_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_vehicle_count?: number | null
          from_type?: string
          id?: string
          org_id: string
          reason?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          to_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_vehicle_count?: number | null
          from_type?: string
          id?: string
          org_id?: string
          reason?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          to_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_upgrade_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          max_vehicles: number | null
          metadata: Json | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          parent_organization_id: string | null
          status: Database["public"]["Enums"]["organization_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_vehicles?: number | null
          metadata?: Json | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          parent_organization_id?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_vehicles?: number | null
          metadata?: Json | null
          name?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          parent_organization_id?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_ngn: number
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          momo_reference: string | null
          payment_method: string
          phone_number: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          momo_reference?: string | null
          payment_method?: string
          phone_number?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          momo_reference?: string | null
          payment_method?: string
          phone_number?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          applicable_org_type: string | null
          created_at: string
          feature_category: string
          feature_description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_included: boolean
          plan_id: string
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          applicable_org_type?: string | null
          created_at?: string
          feature_category?: string
          feature_description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_included?: boolean
          plan_id: string
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          applicable_org_type?: string | null
          created_at?: string
          feature_category?: string
          feature_description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_included?: boolean
          plan_id?: string
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ai_config: {
        Row: {
          ai_job_matching_enabled: boolean
          anthropic_allowed_models: string[] | null
          anthropic_enabled: boolean
          created_at: string
          default_model: string
          default_provider: Database["public"]["Enums"]["ai_provider"]
          id: string
          lovable_allowed_models: string[] | null
          lovable_enabled: boolean
          max_requests_per_minute: number
          max_tokens_per_day_per_tenant: number
          max_tokens_per_request: number
          openai_allowed_models: string[] | null
          openai_enabled: boolean
          redact_driver_names: boolean
          redact_phone_numbers: boolean
          redact_vehicle_plates: boolean
          store_prompts_responses: boolean
          updated_at: string
        }
        Insert: {
          ai_job_matching_enabled?: boolean
          anthropic_allowed_models?: string[] | null
          anthropic_enabled?: boolean
          created_at?: string
          default_model?: string
          default_provider?: Database["public"]["Enums"]["ai_provider"]
          id?: string
          lovable_allowed_models?: string[] | null
          lovable_enabled?: boolean
          max_requests_per_minute?: number
          max_tokens_per_day_per_tenant?: number
          max_tokens_per_request?: number
          openai_allowed_models?: string[] | null
          openai_enabled?: boolean
          redact_driver_names?: boolean
          redact_phone_numbers?: boolean
          redact_vehicle_plates?: boolean
          store_prompts_responses?: boolean
          updated_at?: string
        }
        Update: {
          ai_job_matching_enabled?: boolean
          anthropic_allowed_models?: string[] | null
          anthropic_enabled?: boolean
          created_at?: string
          default_model?: string
          default_provider?: Database["public"]["Enums"]["ai_provider"]
          id?: string
          lovable_allowed_models?: string[] | null
          lovable_enabled?: boolean
          max_requests_per_minute?: number
          max_tokens_per_day_per_tenant?: number
          max_tokens_per_request?: number
          openai_allowed_models?: string[] | null
          openai_enabled?: boolean
          redact_driver_names?: boolean
          redact_phone_numbers?: boolean
          redact_vehicle_plates?: boolean
          store_prompts_responses?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      platform_phone_numbers: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          capabilities: string[]
          country_code: string
          created_at: string
          fonu_number_id: string | null
          id: string
          monthly_cost_ngn: number | null
          notes: string | null
          phone_number: string
          phone_number_type: Database["public"]["Enums"]["phone_number_type"]
          provisioned_at: string | null
          status: Database["public"]["Enums"]["phone_number_status"]
          tenant_id: string | null
          tenant_name: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          capabilities?: string[]
          country_code?: string
          created_at?: string
          fonu_number_id?: string | null
          id?: string
          monthly_cost_ngn?: number | null
          notes?: string | null
          phone_number: string
          phone_number_type?: Database["public"]["Enums"]["phone_number_type"]
          provisioned_at?: string | null
          status?: Database["public"]["Enums"]["phone_number_status"]
          tenant_id?: string | null
          tenant_name?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          capabilities?: string[]
          country_code?: string
          created_at?: string
          fonu_number_id?: string | null
          id?: string
          monthly_cost_ngn?: number | null
          notes?: string | null
          phone_number?: string
          phone_number_type?: Database["public"]["Enums"]["phone_number_type"]
          provisioned_at?: string | null
          status?: Database["public"]["Enums"]["phone_number_status"]
          tenant_id?: string | null
          tenant_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_phone_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          days_before: number[] | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          recipient_emails: string[] | null
          reminder_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_before?: number[] | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          recipient_emails?: string[] | null
          reminder_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_before?: number[] | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          recipient_emails?: string[] | null
          reminder_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          tenant_id: string | null
          tenant_name: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity: string
          tenant_id?: string | null
          tenant_name?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          tenant_id?: string | null
          tenant_name?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      sim_activation_batches: {
        Row: {
          activation_mode: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          data_limit_gb: number | null
          device_mapping_data: Json | null
          device_mapping_file_path: string | null
          error_message: string | null
          fonu_batch_id: string | null
          fonu_response: Json | null
          id: string
          notes: string | null
          operator: string | null
          quantity: number
          request_id: string | null
          requested_plan: string | null
          sims_activated: number | null
          sims_failed: number | null
          started_at: string | null
          status: string
          tenant_id: string
          tenant_name: string | null
        }
        Insert: {
          activation_mode?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          data_limit_gb?: number | null
          device_mapping_data?: Json | null
          device_mapping_file_path?: string | null
          error_message?: string | null
          fonu_batch_id?: string | null
          fonu_response?: Json | null
          id?: string
          notes?: string | null
          operator?: string | null
          quantity?: number
          request_id?: string | null
          requested_plan?: string | null
          sims_activated?: number | null
          sims_failed?: number | null
          started_at?: string | null
          status?: string
          tenant_id: string
          tenant_name?: string | null
        }
        Update: {
          activation_mode?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          data_limit_gb?: number | null
          device_mapping_data?: Json | null
          device_mapping_file_path?: string | null
          error_message?: string | null
          fonu_batch_id?: string | null
          fonu_response?: Json | null
          id?: string
          notes?: string | null
          operator?: string | null
          quantity?: number
          request_id?: string | null
          requested_plan?: string | null
          sims_activated?: number | null
          sims_failed?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          tenant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sim_activation_batches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sim_provisioning_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_provisioning_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string
          deployment_timeline: string | null
          device_mapping_data: Json | null
          device_mapping_enabled: boolean | null
          device_mapping_file_path: string | null
          fonu_request_id: string | null
          fonu_response: Json | null
          iccid: string | null
          id: string
          msisdn: string | null
          notes: string | null
          number_of_sims: number | null
          preferred_operator: string | null
          priority: string | null
          rejected_reason: string | null
          request_type: string
          requested_by: string | null
          requested_by_name: string | null
          requested_data_limit_mb: number | null
          requested_plan: string | null
          sim_id: string | null
          status: string
          tenant_id: string
          tenant_name: string | null
          updated_at: string
          use_case: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          deployment_timeline?: string | null
          device_mapping_data?: Json | null
          device_mapping_enabled?: boolean | null
          device_mapping_file_path?: string | null
          fonu_request_id?: string | null
          fonu_response?: Json | null
          iccid?: string | null
          id?: string
          msisdn?: string | null
          notes?: string | null
          number_of_sims?: number | null
          preferred_operator?: string | null
          priority?: string | null
          rejected_reason?: string | null
          request_type?: string
          requested_by?: string | null
          requested_by_name?: string | null
          requested_data_limit_mb?: number | null
          requested_plan?: string | null
          sim_id?: string | null
          status?: string
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          deployment_timeline?: string | null
          device_mapping_data?: Json | null
          device_mapping_enabled?: boolean | null
          device_mapping_file_path?: string | null
          fonu_request_id?: string | null
          fonu_response?: Json | null
          iccid?: string | null
          id?: string
          msisdn?: string | null
          notes?: string | null
          number_of_sims?: number | null
          preferred_operator?: string | null
          priority?: string | null
          rejected_reason?: string | null
          request_type?: string
          requested_by?: string | null
          requested_by_name?: string | null
          requested_data_limit_mb?: number | null
          requested_plan?: string | null
          sim_id?: string | null
          status?: string
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sim_provisioning_requests_sim_id_fkey"
            columns: ["sim_id"]
            isOneToOne: false
            referencedRelation: "iot_sims"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_usage_signals: {
        Row: {
          created_at: string
          data_usage_mb: number | null
          iccid: string
          id: string
          latitude: number | null
          longitude: number | null
          network_type: string | null
          raw_data: Json | null
          recorded_at: string
          signal_strength: number | null
          signal_type: string
          sim_id: string | null
          sms_count: number | null
        }
        Insert: {
          created_at?: string
          data_usage_mb?: number | null
          iccid: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          raw_data?: Json | null
          recorded_at?: string
          signal_strength?: number | null
          signal_type: string
          sim_id?: string | null
          sms_count?: number | null
        }
        Update: {
          created_at?: string
          data_usage_mb?: number | null
          iccid?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          raw_data?: Json | null
          recorded_at?: string
          signal_strength?: number | null
          signal_type?: string
          sim_id?: string | null
          sms_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sim_usage_signals_sim_id_fkey"
            columns: ["sim_id"]
            isOneToOne: false
            referencedRelation: "iot_sims"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          applicable_org_types: string[]
          badge_style: string | null
          badge_text: string | null
          billing_cycle: string
          created_at: string
          cta_label: string | null
          cta_type: string | null
          custom_price_text: string | null
          description: string | null
          display_order: number | null
          entitlements: Json | null
          features: Json | null
          footer_helper_template: string | null
          id: string
          is_active: boolean
          is_popular: boolean | null
          max_devices: number | null
          max_drivers: number | null
          max_users: number | null
          max_vehicles: number | null
          metric_limit: number | null
          metric_line_template: string | null
          name: string
          plan_key: string | null
          price_ngn: number
          pricing_display_mode: string | null
          tier: string | null
          tier_badge_color: string | null
          trial_days: number | null
          updated_at: string
          yearly_discount_percent: number | null
          yearly_price_ngn: number | null
        }
        Insert: {
          applicable_org_types?: string[]
          badge_style?: string | null
          badge_text?: string | null
          billing_cycle?: string
          created_at?: string
          cta_label?: string | null
          cta_type?: string | null
          custom_price_text?: string | null
          description?: string | null
          display_order?: number | null
          entitlements?: Json | null
          features?: Json | null
          footer_helper_template?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          max_devices?: number | null
          max_drivers?: number | null
          max_users?: number | null
          max_vehicles?: number | null
          metric_limit?: number | null
          metric_line_template?: string | null
          name: string
          plan_key?: string | null
          price_ngn: number
          pricing_display_mode?: string | null
          tier?: string | null
          tier_badge_color?: string | null
          trial_days?: number | null
          updated_at?: string
          yearly_discount_percent?: number | null
          yearly_price_ngn?: number | null
        }
        Update: {
          applicable_org_types?: string[]
          badge_style?: string | null
          badge_text?: string | null
          billing_cycle?: string
          created_at?: string
          cta_label?: string | null
          cta_type?: string | null
          custom_price_text?: string | null
          description?: string | null
          display_order?: number | null
          entitlements?: Json | null
          features?: Json | null
          footer_helper_template?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          max_devices?: number | null
          max_drivers?: number | null
          max_users?: number | null
          max_vehicles?: number | null
          metric_limit?: number | null
          metric_line_template?: string | null
          name?: string
          plan_key?: string | null
          price_ngn?: number
          pricing_display_mode?: string | null
          tier?: string | null
          tier_badge_color?: string | null
          trial_days?: number | null
          updated_at?: string
          yearly_discount_percent?: number | null
          yearly_price_ngn?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string
          sender_name: string | null
          sender_role: Database["public"]["Enums"]["app_role"]
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
          sender_name?: string | null
          sender_role: Database["public"]["Enums"]["app_role"]
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
          sender_name?: string | null
          sender_role?: Database["public"]["Enums"]["app_role"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          closed_at: string | null
          context_id: string | null
          context_snapshot: Json | null
          context_type: Database["public"]["Enums"]["support_context_type"]
          created_at: string
          created_by: string
          description: string
          escalated_at: string | null
          escalated_by: string | null
          escalated_reference_id: string | null
          escalated_to:
            | Database["public"]["Enums"]["support_escalation_target"]
            | null
          escalation_notes: string | null
          id: string
          org_id: string | null
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          context_id?: string | null
          context_snapshot?: Json | null
          context_type?: Database["public"]["Enums"]["support_context_type"]
          created_at?: string
          created_by: string
          description: string
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_reference_id?: string | null
          escalated_to?:
            | Database["public"]["Enums"]["support_escalation_target"]
            | null
          escalation_notes?: string | null
          id?: string
          org_id?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          context_id?: string | null
          context_snapshot?: Json | null
          context_type?: Database["public"]["Enums"]["support_context_type"]
          created_at?: string
          created_by?: string
          description?: string
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_reference_id?: string | null
          escalated_to?:
            | Database["public"]["Enums"]["support_escalation_target"]
            | null
          escalation_notes?: string | null
          id?: string
          org_id?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_accounting_integrations: {
        Row: {
          access_token_encrypted: string | null
          company_id: string | null
          company_name: string | null
          connected_at: string | null
          created_at: string
          disconnected_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          refresh_token_encrypted: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["accounting_integration_status"]
          sync_error: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          company_id?: string | null
          company_name?: string | null
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["accounting_integration_status"]
          sync_error?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          company_id?: string | null
          company_name?: string | null
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["accounting_integration_status"]
          sync_error?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_ai_config: {
        Row: {
          api_key_encrypted: string | null
          api_key_last_four: string | null
          confidence_threshold: number
          constraint_driver_hours: boolean
          constraint_max_load: boolean
          constraint_refrigeration: boolean
          constraint_truck_type: boolean
          created_at: string
          enabled: boolean
          id: string
          last_connection_test_at: string | null
          last_connection_test_error: string | null
          last_connection_test_success: boolean | null
          model: string | null
          provider: Database["public"]["Enums"]["ai_provider"] | null
          require_dispatcher_approval: boolean
          tenant_id: string
          updated_at: string
          weight_capacity_fit: number
          weight_cost_efficiency: number
          weight_distance_pickup: number
          weight_driver_availability: number
          weight_eta_delivery: number
        }
        Insert: {
          api_key_encrypted?: string | null
          api_key_last_four?: string | null
          confidence_threshold?: number
          constraint_driver_hours?: boolean
          constraint_max_load?: boolean
          constraint_refrigeration?: boolean
          constraint_truck_type?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_connection_test_at?: string | null
          last_connection_test_error?: string | null
          last_connection_test_success?: boolean | null
          model?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"] | null
          require_dispatcher_approval?: boolean
          tenant_id: string
          updated_at?: string
          weight_capacity_fit?: number
          weight_cost_efficiency?: number
          weight_distance_pickup?: number
          weight_driver_availability?: number
          weight_eta_delivery?: number
        }
        Update: {
          api_key_encrypted?: string | null
          api_key_last_four?: string | null
          confidence_threshold?: number
          constraint_driver_hours?: boolean
          constraint_max_load?: boolean
          constraint_refrigeration?: boolean
          constraint_truck_type?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_connection_test_at?: string | null
          last_connection_test_error?: string | null
          last_connection_test_success?: boolean | null
          model?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"] | null
          require_dispatcher_approval?: boolean
          tenant_id?: string
          updated_at?: string
          weight_capacity_fit?: number
          weight_cost_efficiency?: number
          weight_distance_pickup?: number
          weight_driver_availability?: number
          weight_eta_delivery?: number
        }
        Relationships: []
      }
      tenant_branding: {
        Row: {
          accent_color: string | null
          created_at: string
          destructive_color: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          sidebar_accent_color: string | null
          sidebar_bg_color: string | null
          sidebar_text_color: string | null
          success_color: string | null
          tenant_id: string
          updated_at: string
          warning_color: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          destructive_color?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_accent_color?: string | null
          sidebar_bg_color?: string | null
          sidebar_text_color?: string | null
          success_color?: string | null
          tenant_id: string
          updated_at?: string
          warning_color?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          destructive_color?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_accent_color?: string | null
          sidebar_bg_color?: string | null
          sidebar_text_color?: string | null
          success_color?: string | null
          tenant_id?: string
          updated_at?: string
          warning_color?: string | null
        }
        Relationships: []
      }
      tenant_business_info: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          annual_revenue: string | null
          business_type: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          industry: string | null
          number_of_employees: string | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          rejection_reason: string | null
          state: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
          year_established: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue?: string | null
          business_type?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          number_of_employees?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          year_established?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          number_of_employees?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          year_established?: number | null
        }
        Relationships: []
      }
      tenant_communication_config: {
        Row: {
          created_at: string
          default_message_language: string | null
          enable_delivery_notifications: boolean | null
          enable_read_receipts: boolean | null
          id: string
          sms_fallback_timeout_seconds: number | null
          sms_sender_id: string | null
          tenant_id: string
          updated_at: string
          voice_caller_id: string | null
          whatsapp_fallback_to_sms: boolean | null
        }
        Insert: {
          created_at?: string
          default_message_language?: string | null
          enable_delivery_notifications?: boolean | null
          enable_read_receipts?: boolean | null
          id?: string
          sms_fallback_timeout_seconds?: number | null
          sms_sender_id?: string | null
          tenant_id: string
          updated_at?: string
          voice_caller_id?: string | null
          whatsapp_fallback_to_sms?: boolean | null
        }
        Update: {
          created_at?: string
          default_message_language?: string | null
          enable_delivery_notifications?: boolean | null
          enable_read_receipts?: boolean | null
          id?: string
          sms_fallback_timeout_seconds?: number | null
          sms_sender_id?: string | null
          tenant_id?: string
          updated_at?: string
          voice_caller_id?: string | null
          whatsapp_fallback_to_sms?: boolean | null
        }
        Relationships: []
      }
      tenant_geofence_config: {
        Row: {
          created_at: string
          debounce_points: number
          debounce_seconds: number
          job_milestone_automation: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          debounce_points?: number
          debounce_seconds?: number
          job_milestone_automation?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          debounce_points?: number
          debounce_seconds?: number
          job_milestone_automation?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_invoice_config: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          currency: string
          id: string
          invoice_prefix: string
          next_invoice_number: number
          notes_template: string | null
          payment_terms_days: number
          tax_enabled: boolean
          tax_label: string
          tax_rate_percent: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_prefix?: string
          next_invoice_number?: number
          notes_template?: string | null
          payment_terms_days?: number
          tax_enabled?: boolean
          tax_label?: string
          tax_rate_percent?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_prefix?: string
          next_invoice_number?: number
          notes_template?: string | null
          payment_terms_days?: number
          tax_enabled?: boolean
          tax_label?: string
          tax_rate_percent?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_kyc_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tenant_maintenance_config: {
        Row: {
          created_at: string
          dispatch_due_action: string
          dispatch_overdue_action: string
          fuel_alert_enabled: boolean
          fuel_variance_threshold_percent: number
          id: string
          tenant_id: string
          updated_at: string
          warn_days_before: number
        }
        Insert: {
          created_at?: string
          dispatch_due_action?: string
          dispatch_overdue_action?: string
          fuel_alert_enabled?: boolean
          fuel_variance_threshold_percent?: number
          id?: string
          tenant_id: string
          updated_at?: string
          warn_days_before?: number
        }
        Update: {
          created_at?: string
          dispatch_due_action?: string
          dispatch_overdue_action?: string
          fuel_alert_enabled?: boolean
          fuel_variance_threshold_percent?: number
          id?: string
          tenant_id?: string
          updated_at?: string
          warn_days_before?: number
        }
        Relationships: []
      }
      tenant_sender_ids: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          request_letter_url: string | null
          request_notes: string | null
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["sender_id_type"]
          status: Database["public"]["Enums"]["sender_id_status"]
          telecom_provider: string | null
          telecom_reference: string | null
          tenant_id: string
          tenant_name: string | null
          updated_at: string
          whitelisted_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          request_letter_url?: string | null
          request_notes?: string | null
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
          sender_type?: Database["public"]["Enums"]["sender_id_type"]
          status?: Database["public"]["Enums"]["sender_id_status"]
          telecom_provider?: string | null
          telecom_reference?: string | null
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string
          whitelisted_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          request_letter_url?: string | null
          request_notes?: string | null
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["sender_id_type"]
          status?: Database["public"]["Enums"]["sender_id_status"]
          telecom_provider?: string | null
          telecom_reference?: string | null
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string
          whitelisted_at?: string | null
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          payment_method: string | null
          phone_number: string | null
          plan_id: string
          status: string
          tenant_id: string
          tenant_name: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          payment_method?: string | null
          phone_number?: string | null
          plan_id: string
          status?: string
          tenant_id: string
          tenant_name: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_method?: string | null
          phone_number?: string | null
          plan_id?: string
          status?: string
          tenant_id?: string
          tenant_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_wallets: {
        Row: {
          auto_topup_amount_ngn: number | null
          auto_topup_enabled: boolean
          auto_topup_phone: string | null
          auto_topup_threshold_ngn: number | null
          balance_ngn: number
          created_at: string
          credit_enabled: boolean
          credit_limit_ngn: number | null
          current_month_spending_ngn: number
          id: string
          last_auto_topup_at: string | null
          low_balance_threshold_ngn: number | null
          monthly_spending_limit_ngn: number | null
          spending_alert_100_sent: boolean
          spending_alert_80_sent: boolean
          spending_alert_email: string | null
          spending_limit_enabled: boolean
          spending_limit_reset_day: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_topup_amount_ngn?: number | null
          auto_topup_enabled?: boolean
          auto_topup_phone?: string | null
          auto_topup_threshold_ngn?: number | null
          balance_ngn?: number
          created_at?: string
          credit_enabled?: boolean
          credit_limit_ngn?: number | null
          current_month_spending_ngn?: number
          id?: string
          last_auto_topup_at?: string | null
          low_balance_threshold_ngn?: number | null
          monthly_spending_limit_ngn?: number | null
          spending_alert_100_sent?: boolean
          spending_alert_80_sent?: boolean
          spending_alert_email?: string | null
          spending_limit_enabled?: boolean
          spending_limit_reset_day?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_topup_amount_ngn?: number | null
          auto_topup_enabled?: boolean
          auto_topup_phone?: string | null
          auto_topup_threshold_ngn?: number | null
          balance_ngn?: number
          created_at?: string
          credit_enabled?: boolean
          credit_limit_ngn?: number | null
          current_month_spending_ngn?: number
          id?: string
          last_auto_topup_at?: string | null
          low_balance_threshold_ngn?: number | null
          monthly_spending_limit_ngn?: number | null
          spending_alert_100_sent?: boolean
          spending_alert_80_sent?: boolean
          spending_alert_email?: string | null
          spending_limit_enabled?: boolean
          spending_limit_reset_day?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_whatsapp_accounts: {
        Row: {
          business_id: string | null
          business_portfolio_id: string | null
          connected_at: string | null
          connection_method:
            | Database["public"]["Enums"]["whatsapp_connection_method"]
            | null
          created_at: string
          created_by: string | null
          disconnected_at: string | null
          display_phone_number: string | null
          id: string
          is_default_sender: boolean
          messaging_limit_tier: string | null
          oauth_state: string | null
          oauth_state_expires_at: string | null
          phone_number_id: string | null
          quality_rating: string | null
          status: Database["public"]["Enums"]["whatsapp_account_status"]
          tenant_id: string
          token_reference_id: string | null
          updated_at: string
          verified_name: string | null
          waba_id: string | null
        }
        Insert: {
          business_id?: string | null
          business_portfolio_id?: string | null
          connected_at?: string | null
          connection_method?:
            | Database["public"]["Enums"]["whatsapp_connection_method"]
            | null
          created_at?: string
          created_by?: string | null
          disconnected_at?: string | null
          display_phone_number?: string | null
          id?: string
          is_default_sender?: boolean
          messaging_limit_tier?: string | null
          oauth_state?: string | null
          oauth_state_expires_at?: string | null
          phone_number_id?: string | null
          quality_rating?: string | null
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          tenant_id: string
          token_reference_id?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Update: {
          business_id?: string | null
          business_portfolio_id?: string | null
          connected_at?: string | null
          connection_method?:
            | Database["public"]["Enums"]["whatsapp_connection_method"]
            | null
          created_at?: string
          created_by?: string | null
          disconnected_at?: string | null
          display_phone_number?: string | null
          id?: string
          is_default_sender?: boolean
          messaging_limit_tier?: string | null
          oauth_state?: string | null
          oauth_state_expires_at?: string | null
          phone_number_id?: string | null
          quality_rating?: string | null
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          tenant_id?: string
          token_reference_id?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          billing_email: string | null
          created_at: string
          device_count: number | null
          driver_count: number | null
          email: string
          features: Json | null
          fuel_efficiency_alert_enabled: boolean | null
          fuel_efficiency_threshold_km_l: number | null
          id: string
          last_active_at: string | null
          logo_url: string | null
          monthly_revenue_ngn: number | null
          name: string
          phone: string | null
          plan: string
          sim_count: number | null
          slug: string
          status: string
          updated_at: string
          vehicle_count: number | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          created_at?: string
          device_count?: number | null
          driver_count?: number | null
          email: string
          features?: Json | null
          fuel_efficiency_alert_enabled?: boolean | null
          fuel_efficiency_threshold_km_l?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          monthly_revenue_ngn?: number | null
          name: string
          phone?: string | null
          plan?: string
          sim_count?: number | null
          slug: string
          status?: string
          updated_at?: string
          vehicle_count?: number | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          created_at?: string
          device_count?: number | null
          driver_count?: number | null
          email?: string
          features?: Json | null
          fuel_efficiency_alert_enabled?: boolean | null
          fuel_efficiency_threshold_km_l?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          monthly_revenue_ngn?: number | null
          name?: string
          phone?: string | null
          plan?: string
          sim_count?: number | null
          slug?: string
          status?: string
          updated_at?: string
          vehicle_count?: number | null
        }
        Relationships: []
      }
      usage_summary_items: {
        Row: {
          created_at: string
          icon_key: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_key?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_key?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          metadata: Json | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          metadata?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          metadata?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          token?: string
        }
        Relationships: []
      }
      user_org_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          membership_status: Database["public"]["Enums"]["org_membership_status"]
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          membership_status?: Database["public"]["Enums"]["org_membership_status"]
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          membership_status?: Database["public"]["Enums"]["org_membership_status"]
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_org_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          org_id: string
          role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_id: string
          role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_id?: string
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "org_role_definitions"
            referencedColumns: ["role_key"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_dispatch_scores: {
        Row: {
          computed_at: string
          created_at: string
          driver_performance_score: number | null
          fuel_efficiency_score: number | null
          id: string
          is_dispatch_recommended: boolean | null
          maintenance_health_score: number | null
          overall_score: number
          recommendation_reasons: string[] | null
          reliability_score: number | null
          risk_warnings: string[] | null
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          driver_performance_score?: number | null
          fuel_efficiency_score?: number | null
          id?: string
          is_dispatch_recommended?: boolean | null
          maintenance_health_score?: number | null
          overall_score?: number
          recommendation_reasons?: string[] | null
          reliability_score?: number | null
          risk_warnings?: string[] | null
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          driver_performance_score?: number | null
          fuel_efficiency_score?: number | null
          id?: string
          is_dispatch_recommended?: boolean | null
          maintenance_health_score?: number | null
          overall_score?: number
          recommendation_reasons?: string[] | null
          reliability_score?: number | null
          risk_warnings?: string[] | null
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_dispatch_scores_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_financial_config: {
        Row: {
          created_at: string
          depreciation_method: string | null
          id: string
          monthly_driver_wage_ngn: number | null
          monthly_insurance_ngn: number | null
          monthly_other_fixed_ngn: number | null
          monthly_parking_ngn: number | null
          per_km_wage_ngn: number | null
          per_trip_wage_ngn: number | null
          purchase_date: string | null
          purchase_price_ngn: number | null
          salvage_value_ngn: number | null
          tenant_id: string
          updated_at: string
          useful_life_months: number | null
          vehicle_id: string
          wage_allocation_method: string | null
        }
        Insert: {
          created_at?: string
          depreciation_method?: string | null
          id?: string
          monthly_driver_wage_ngn?: number | null
          monthly_insurance_ngn?: number | null
          monthly_other_fixed_ngn?: number | null
          monthly_parking_ngn?: number | null
          per_km_wage_ngn?: number | null
          per_trip_wage_ngn?: number | null
          purchase_date?: string | null
          purchase_price_ngn?: number | null
          salvage_value_ngn?: number | null
          tenant_id: string
          updated_at?: string
          useful_life_months?: number | null
          vehicle_id: string
          wage_allocation_method?: string | null
        }
        Update: {
          created_at?: string
          depreciation_method?: string | null
          id?: string
          monthly_driver_wage_ngn?: number | null
          monthly_insurance_ngn?: number | null
          monthly_other_fixed_ngn?: number | null
          monthly_parking_ngn?: number | null
          per_km_wage_ngn?: number | null
          per_trip_wage_ngn?: number | null
          purchase_date?: string | null
          purchase_price_ngn?: number | null
          salvage_value_ngn?: number | null
          tenant_id?: string
          updated_at?: string
          useful_life_months?: number | null
          vehicle_id?: string
          wage_allocation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_financial_config_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_financial_summary: {
        Row: {
          created_at: string
          depreciation_ngn: number | null
          fuel_cost_ngn: number | null
          id: string
          insurance_cost_ngn: number | null
          jobs_completed: number | null
          maintenance_cost_ngn: number | null
          net_profit_ngn: number | null
          other_costs_ngn: number | null
          period_end: string
          period_start: string
          profit_margin_percent: number | null
          profitability_score: number | null
          profitability_tier: string | null
          tenant_id: string
          total_cost_ngn: number | null
          total_hours_operated: number | null
          total_km_driven: number | null
          total_revenue_ngn: number | null
          updated_at: string
          vehicle_id: string
          wage_cost_ngn: number | null
        }
        Insert: {
          created_at?: string
          depreciation_ngn?: number | null
          fuel_cost_ngn?: number | null
          id?: string
          insurance_cost_ngn?: number | null
          jobs_completed?: number | null
          maintenance_cost_ngn?: number | null
          net_profit_ngn?: number | null
          other_costs_ngn?: number | null
          period_end: string
          period_start: string
          profit_margin_percent?: number | null
          profitability_score?: number | null
          profitability_tier?: string | null
          tenant_id: string
          total_cost_ngn?: number | null
          total_hours_operated?: number | null
          total_km_driven?: number | null
          total_revenue_ngn?: number | null
          updated_at?: string
          vehicle_id: string
          wage_cost_ngn?: number | null
        }
        Update: {
          created_at?: string
          depreciation_ngn?: number | null
          fuel_cost_ngn?: number | null
          id?: string
          insurance_cost_ngn?: number | null
          jobs_completed?: number | null
          maintenance_cost_ngn?: number | null
          net_profit_ngn?: number | null
          other_costs_ngn?: number | null
          period_end?: string
          period_start?: string
          profit_margin_percent?: number | null
          profitability_score?: number | null
          profitability_tier?: string | null
          tenant_id?: string
          total_cost_ngn?: number | null
          total_hours_operated?: number | null
          total_km_driven?: number | null
          total_revenue_ngn?: number | null
          updated_at?: string
          vehicle_id?: string
          wage_cost_ngn?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_financial_summary_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fuel_efficiency: {
        Row: {
          calculated_at: string
          cost_per_km_ngn: number | null
          created_at: string
          efficiency_km_per_liter: number | null
          id: string
          period_end: string
          period_start: string
          tenant_id: string
          total_cost_ngn: number
          total_distance_km: number
          total_fuel_liters: number
          transaction_count: number | null
          vehicle_id: string
        }
        Insert: {
          calculated_at?: string
          cost_per_km_ngn?: number | null
          created_at?: string
          efficiency_km_per_liter?: number | null
          id?: string
          period_end: string
          period_start: string
          tenant_id: string
          total_cost_ngn?: number
          total_distance_km?: number
          total_fuel_liters?: number
          transaction_count?: number | null
          vehicle_id: string
        }
        Update: {
          calculated_at?: string
          cost_per_km_ngn?: number | null
          created_at?: string
          efficiency_km_per_liter?: number | null
          id?: string
          period_end?: string
          period_start?: string
          tenant_id?: string
          total_cost_ngn?: number
          total_distance_km?: number
          total_fuel_liters?: number
          transaction_count?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fuel_efficiency_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_geofence_states: {
        Row: {
          consecutive_count: number
          geofence_id: string
          id: string
          last_evaluated_at: string
          last_transition_at: string | null
          pending_state: Database["public"]["Enums"]["geofence_state"] | null
          state: Database["public"]["Enums"]["geofence_state"]
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          consecutive_count?: number
          geofence_id: string
          id?: string
          last_evaluated_at?: string
          last_transition_at?: string | null
          pending_state?: Database["public"]["Enums"]["geofence_state"] | null
          state?: Database["public"]["Enums"]["geofence_state"]
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          consecutive_count?: number
          geofence_id?: string
          id?: string
          last_evaluated_at?: string
          last_transition_at?: string | null
          pending_state?: Database["public"]["Enums"]["geofence_state"] | null
          state?: Database["public"]["Enums"]["geofence_state"]
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_geofence_states_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_geofence_states_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_geofences: {
        Row: {
          created_at: string
          geofence_id: string
          id: string
          is_active: boolean
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          geofence_id: string
          id?: string
          is_active?: boolean
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          geofence_id?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_geofences_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_geofences_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number | null
          created_at: string
          current_driver_id: string | null
          current_engine_hours: number | null
          current_mileage: number | null
          device_id: string | null
          engine_hours_source: string | null
          fuel_level: number | null
          id: string
          last_mileage_update: string | null
          make: string
          managing_org_id: string | null
          mileage_source: string | null
          model: string
          owning_org_id: string | null
          registration_number: string
          status: string
          tenant_id: string
          type: string
          updated_at: string
          vin: string
          year: number
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          current_driver_id?: string | null
          current_engine_hours?: number | null
          current_mileage?: number | null
          device_id?: string | null
          engine_hours_source?: string | null
          fuel_level?: number | null
          id?: string
          last_mileage_update?: string | null
          make: string
          managing_org_id?: string | null
          mileage_source?: string | null
          model: string
          owning_org_id?: string | null
          registration_number: string
          status?: string
          tenant_id: string
          type?: string
          updated_at?: string
          vin: string
          year: number
        }
        Update: {
          capacity?: number | null
          created_at?: string
          current_driver_id?: string | null
          current_engine_hours?: number | null
          current_mileage?: number | null
          device_id?: string | null
          engine_hours_source?: string | null
          fuel_level?: number | null
          id?: string
          last_mileage_update?: string | null
          make?: string
          managing_org_id?: string | null
          mileage_source?: string | null
          model?: string
          owning_org_id?: string | null
          registration_number?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          vin?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_current_driver_id_fkey"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_managing_org_id_fkey"
            columns: ["managing_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_ngn: number
          balance_after_ngn: number
          balance_before_ngn: number
          communication_type: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          quantity: number | null
          reference_id: string | null
          tenant_id: string
          transaction_type: string
          unit_rate_ngn: number | null
        }
        Insert: {
          amount_ngn: number
          balance_after_ngn: number
          balance_before_ngn: number
          communication_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          reference_id?: string | null
          tenant_id: string
          transaction_type: string
          unit_rate_ngn?: number | null
        }
        Update: {
          amount_ngn?: number
          balance_after_ngn?: number
          balance_before_ngn?: number
          communication_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          reference_id?: string | null
          tenant_id?: string
          transaction_type?: string
          unit_rate_ngn?: number | null
        }
        Relationships: []
      }
      waybill_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
        }
        Relationships: []
      }
      waybill_invoices: {
        Row: {
          amount_paid_ngn: number | null
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          destination: string | null
          discount_ngn: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json
          notes: string | null
          org_id: string | null
          origin: string | null
          payment_terms: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          quantity: number | null
          quantity_unit: string | null
          sent_at: string | null
          sent_to: string | null
          sent_via: string | null
          status: Database["public"]["Enums"]["waybill_invoice_status"]
          subtotal_ngn: number
          tax_amount_ngn: number | null
          tax_rate_percent: number | null
          tenant_id: string
          total_ngn: number
          updated_at: string
          vehicle_number: string | null
          waybill_date: string | null
          waybill_id: string
          waybill_number: string | null
        }
        Insert: {
          amount_paid_ngn?: number | null
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          destination?: string | null
          discount_ngn?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          org_id?: string | null
          origin?: string | null
          payment_terms?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          sent_at?: string | null
          sent_to?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["waybill_invoice_status"]
          subtotal_ngn?: number
          tax_amount_ngn?: number | null
          tax_rate_percent?: number | null
          tenant_id: string
          total_ngn?: number
          updated_at?: string
          vehicle_number?: string | null
          waybill_date?: string | null
          waybill_id: string
          waybill_number?: string | null
        }
        Update: {
          amount_paid_ngn?: number | null
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          destination?: string | null
          discount_ngn?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          org_id?: string | null
          origin?: string | null
          payment_terms?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          sent_at?: string | null
          sent_to?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["waybill_invoice_status"]
          subtotal_ngn?: number
          tax_amount_ngn?: number | null
          tax_rate_percent?: number | null
          tenant_id?: string
          total_ngn?: number
          updated_at?: string
          vehicle_number?: string | null
          waybill_date?: string | null
          waybill_id?: string
          waybill_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waybill_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waybill_invoices_waybill_id_fkey"
            columns: ["waybill_id"]
            isOneToOne: false
            referencedRelation: "waybill_records"
            referencedColumns: ["id"]
          },
        ]
      }
      waybill_records: {
        Row: {
          additional_notes: string | null
          ai_confidence_score: number | null
          ai_model_used: string | null
          calculated_price_ngn: number | null
          confidence_per_field: Json | null
          created_at: string
          customer_name: string | null
          destination: string | null
          driver_name: string | null
          extracted_data: Json | null
          extraction_error: string | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          matched_pricing_rule_id: string | null
          order_number: string | null
          org_id: string | null
          origin: string | null
          processed_at: string | null
          processed_by: string | null
          quantity: number | null
          quantity_unit: string | null
          source_message_id: string | null
          source_phone: string | null
          source_type: string
          status: Database["public"]["Enums"]["waybill_status"]
          tenant_id: string
          updated_at: string
          vehicle_number: string | null
          waybill_date: string | null
          waybill_number: string | null
          weight_kg: number | null
          weight_tons: number | null
        }
        Insert: {
          additional_notes?: string | null
          ai_confidence_score?: number | null
          ai_model_used?: string | null
          calculated_price_ngn?: number | null
          confidence_per_field?: Json | null
          created_at?: string
          customer_name?: string | null
          destination?: string | null
          driver_name?: string | null
          extracted_data?: Json | null
          extraction_error?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          matched_pricing_rule_id?: string | null
          order_number?: string | null
          org_id?: string | null
          origin?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          source_message_id?: string | null
          source_phone?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["waybill_status"]
          tenant_id: string
          updated_at?: string
          vehicle_number?: string | null
          waybill_date?: string | null
          waybill_number?: string | null
          weight_kg?: number | null
          weight_tons?: number | null
        }
        Update: {
          additional_notes?: string | null
          ai_confidence_score?: number | null
          ai_model_used?: string | null
          calculated_price_ngn?: number | null
          confidence_per_field?: Json | null
          created_at?: string
          customer_name?: string | null
          destination?: string | null
          driver_name?: string | null
          extracted_data?: Json | null
          extraction_error?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          matched_pricing_rule_id?: string | null
          order_number?: string | null
          org_id?: string | null
          origin?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          source_message_id?: string | null
          source_phone?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["waybill_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_number?: string | null
          waybill_date?: string | null
          waybill_number?: string | null
          weight_kg?: number | null
          weight_tons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "waybill_records_matched_pricing_rule_id_fkey"
            columns: ["matched_pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "destination_pricing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waybill_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          next_retry_at: string | null
          request_body: Json | null
          request_headers: Json | null
          request_url: string
          response_body: string | null
          response_headers: Json | null
          response_status_code: number | null
          status: Database["public"]["Enums"]["webhook_delivery_status"]
          subscription_id: string | null
          tenant_id: string
          webhook_event_id: string | null
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_url: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          subscription_id?: string | null
          tenant_id: string
          webhook_event_id?: string | null
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_url?: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          subscription_id?: string | null
          tenant_id?: string
          webhook_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_delivery_logs_webhook_event_id_fkey"
            columns: ["webhook_event_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id: string
          occurred_at: string
          payload: Json
          processed_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          occurred_at?: string
          payload: Json
          processed_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          created_by: string | null
          event_types: Database["public"]["Enums"]["webhook_event_type"][]
          headers: Json | null
          id: string
          is_enabled: boolean
          name: string
          retry_count: number
          signing_secret: string
          tenant_id: string
          timeout_seconds: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_types?: Database["public"]["Enums"]["webhook_event_type"][]
          headers?: Json | null
          id?: string
          is_enabled?: boolean
          name: string
          retry_count?: number
          signing_secret: string
          tenant_id: string
          timeout_seconds?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_types?: Database["public"]["Enums"]["webhook_event_type"][]
          headers?: Json | null
          id?: string
          is_enabled?: boolean
          name?: string
          retry_count?: number
          signing_secret?: string
          tenant_id?: string
          timeout_seconds?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_inbound_messages: {
        Row: {
          created_at: string
          from_phone: string
          id: string
          media_mime: string | null
          media_url: string | null
          message_type: string
          org_id: string | null
          raw_payload: Json | null
          received_at: string
          tenant_id: string
          text_body: string | null
          to_phone: string
        }
        Insert: {
          created_at?: string
          from_phone: string
          id?: string
          media_mime?: string | null
          media_url?: string | null
          message_type?: string
          org_id?: string | null
          raw_payload?: Json | null
          received_at?: string
          tenant_id: string
          text_body?: string | null
          to_phone: string
        }
        Update: {
          created_at?: string
          from_phone?: string
          id?: string
          media_mime?: string | null
          media_url?: string | null
          message_type?: string
          org_id?: string | null
          raw_payload?: Json | null
          received_at?: string
          tenant_id?: string
          text_body?: string | null
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_inbound_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          driver_id: string | null
          driver_name: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          from_phone: string | null
          id: string
          media_type: string | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
          payload_ref: string | null
          provider_message_id: string | null
          read_at: string | null
          sender_account_id: string | null
          sender_user_id: string | null
          sender_user_name: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"]
          template_language: string | null
          template_name: string | null
          template_variables: Json | null
          tenant_id: string
          to_phone: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          driver_id?: string | null
          driver_name?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_phone?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
          payload_ref?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          sender_account_id?: string | null
          sender_user_id?: string | null
          sender_user_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          tenant_id: string
          to_phone: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          driver_id?: string | null
          driver_name?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_phone?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
          payload_ref?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          sender_account_id?: string | null
          sender_user_id?: string | null
          sender_user_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          tenant_id?: string
          to_phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_sender_account_id_fkey"
            columns: ["sender_account_id"]
            isOneToOne: false
            referencedRelation: "tenant_whatsapp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string | null
          buttons: Json | null
          category: string | null
          content_json: Json
          created_at: string
          created_by: string | null
          footer_text: string | null
          header_content: string | null
          header_type: string | null
          id: string
          language: string
          last_synced_at: string | null
          meta_template_id: string | null
          name: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["whatsapp_template_status"]
          tenant_id: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_text?: string | null
          buttons?: Json | null
          category?: string | null
          content_json?: Json
          created_at?: string
          created_by?: string | null
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          tenant_id: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_text?: string | null
          buttons?: Json | null
          category?: string | null
          content_json?: Json
          created_at?: string
          created_by?: string | null
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          tenant_id?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_org_upgrade: {
        Args: { p_notes?: string; p_request_id: string; p_reviewer_id?: string }
        Returns: Json
      }
      backfill_org_memberships: { Args: never; Returns: Json }
      block_ip: {
        Args: {
          p_blocked_by?: string
          p_expires_at?: string
          p_ip_address: string
          p_is_permanent?: boolean
          p_metadata?: Json
          p_reason: string
          p_tenant_id?: string
        }
        Returns: string
      }
      calculate_vehicle_fuel_efficiency: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_vehicle_id: string
        }
        Returns: Json
      }
      calculate_vehicle_profitability: {
        Args: { p_end_date: string; p_start_date: string; p_vehicle_id: string }
        Returns: Json
      }
      can_access_tenant_entity: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_waybill_org: {
        Args: { _target_org_id: string; _user_id: string }
        Returns: boolean
      }
      can_approve_sim_requests: { Args: { _user_id: string }; Returns: boolean }
      can_assign_device_to_vehicle: {
        Args: { p_device_id: string; p_vehicle_id: string }
        Returns: Json
      }
      can_assign_geofences: { Args: { _user_id: string }; Returns: boolean }
      can_assign_sim_to_device: { Args: { _user_id: string }; Returns: boolean }
      can_configure_devices: { Args: { _user_id: string }; Returns: boolean }
      can_configure_fonu: { Args: { _user_id: string }; Returns: boolean }
      can_create_support_ticket: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_accounting_integrations: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_all_support_tickets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_devices: { Args: { _user_id: string }; Returns: boolean }
      can_manage_geofences: { Args: { _user_id: string }; Returns: boolean }
      can_manage_whatsapp: { Args: { _user_id: string }; Returns: boolean }
      can_read_job: {
        Args: {
          _executing_org_id: string
          _job_owner_org_id: string
          _user_id: string
        }
        Returns: boolean
      }
      can_read_org_entity: {
        Args: { _entity_org_id: string; _user_id: string }
        Returns: boolean
      }
      can_request_sim_activation: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_run_ai_matching: { Args: { _user_id: string }; Returns: boolean }
      can_send_whatsapp: { Args: { _user_id: string }; Returns: boolean }
      can_tenant_send_whatsapp: { Args: { p_tenant_id: string }; Returns: Json }
      can_view_devices: { Args: { _user_id: string }; Returns: boolean }
      can_view_geofence_alerts: { Args: { _user_id: string }; Returns: boolean }
      can_view_sims: { Args: { _user_id: string }; Returns: boolean }
      can_view_support_tickets: { Args: { _user_id: string }; Returns: boolean }
      can_view_whatsapp: { Args: { _user_id: string }; Returns: boolean }
      can_write_job_execution: {
        Args: { _executing_org_id: string; _user_id: string }
        Returns: boolean
      }
      can_write_org_entity: {
        Args: { _entity_org_id: string; _permission?: string; _user_id: string }
        Returns: boolean
      }
      can_write_org_entity_v2: {
        Args: { _entity_org_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      can_write_waybill: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      check_api_rate_limit: {
        Args: {
          p_api_key_id: string
          p_limit_per_day: number
          p_limit_per_minute: number
          p_tenant_id: string
        }
        Returns: Json
      }
      check_owner_operator_active_job_limit: {
        Args: { p_max_active_jobs?: number; p_org_id: string }
        Returns: Json
      }
      check_vehicle_dispatch_eligibility: {
        Args: { p_tenant_id: string; p_vehicle_id: string }
        Returns: Json
      }
      complete_maintenance_profile:
        | {
            Args: {
              p_completion_cost?: number
              p_completion_mileage?: number
              p_notes?: string
              p_profile_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_completion_cost?: number
              p_completion_engine_hours?: number
              p_completion_mileage?: number
              p_labor_cost?: number
              p_notes?: string
              p_parts_cost?: number
              p_profile_id: string
              p_technician?: string
            }
            Returns: Json
          }
      compute_device_health_status: {
        Args: {
          p_last_seen: string
          p_offline_threshold: number
          p_online_threshold: number
        }
        Returns: Database["public"]["Enums"]["device_health_status"]
      }
      compute_maintenance_lifecycle_status:
        | {
            Args: {
              p_current_engine_hours: number
              p_current_mileage: number
              p_due_soon_days?: number
              p_due_soon_hours?: number
              p_due_soon_km?: number
              p_next_due_date: string
              p_next_due_engine_hours: number
              p_next_due_mileage: number
            }
            Returns: Database["public"]["Enums"]["maintenance_lifecycle_status"]
          }
        | {
            Args: { p_profile_id: string }
            Returns: Database["public"]["Enums"]["maintenance_lifecycle_status"]
          }
      compute_tenant_sla_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      compute_vehicle_maintenance_risk: {
        Args: { p_vehicle_id: string }
        Returns: Json
      }
      deduct_wallet_balance: {
        Args: {
          p_communication_type: string
          p_description?: string
          p_quantity: number
          p_reference_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      dispatch_webhook_event: {
        Args: {
          p_data: Json
          p_event_type: Database["public"]["Enums"]["webhook_event_type"]
          p_tenant_id: string
        }
        Returns: string
      }
      evaluate_vehicle_geofences: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_speed?: number
          p_telemetry_id?: string
          p_tenant_id: string
          p_vehicle_id: string
        }
        Returns: Json
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_tenant_slug: { Args: { tenant_name: string }; Returns: string }
      generate_waybill_invoice_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_api_usage_stats: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_org_type: { Args: { _org_id: string }; Returns: string }
      get_plan_features_for_org_type: {
        Args: { p_org_type: string; p_plan_id: string }
        Returns: {
          applicable_org_type: string | null
          created_at: string
          feature_category: string
          feature_description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_included: boolean
          plan_id: string
          updated_at: string
          usage_limit: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "plan_features"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_related_org_ids: { Args: { p_tenant_id: string }; Returns: string[] }
      get_tenant_ai_config: { Args: { p_tenant_id: string }; Returns: Json }
      get_tenant_communication_config: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_default_whatsapp_sender: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_tenant_org_types: {
        Args: never
        Returns: {
          org_types: string[]
          tenant_id: string
        }[]
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_org_type: {
        Args: { _org_id: string; _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      get_vehicle_dispatch_scores: {
        Args: { p_tenant_id: string; p_vehicle_ids?: string[] }
        Returns: {
          fuel_efficiency_score: number
          is_recommended: boolean
          maintenance_health_score: number
          overall_score: number
          risk_warnings: string[]
          vehicle_id: string
        }[]
      }
      get_wallet_balance: { Args: { p_tenant_id: string }; Returns: Json }
      has_active_org_relationship: {
        Args: { p_from_org_id: string; p_to_org_id: string }
        Returns: boolean
      }
      has_any_org_role: {
        Args: { _role_keys: string[]; _user_id: string }
        Returns: boolean
      }
      has_cross_org_visibility: {
        Args: { _target_org_id: string; _user_id: string }
        Returns: boolean
      }
      has_org_permission: {
        Args: { _org_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { _org_id: string; _role_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_broadcast_delivered: {
        Args: { broadcast_uuid: string }
        Returns: undefined
      }
      increment_broadcast_read: {
        Args: { broadcast_uuid: string }
        Returns: undefined
      }
      increment_broadcast_replied: {
        Args: { broadcast_uuid: string }
        Returns: undefined
      }
      is_feature_enabled: {
        Args: { p_feature_key: string; p_tenant_id?: string }
        Returns: boolean
      }
      is_ip_blocked: { Args: { check_ip: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_plan_available_for_org_type: {
        Args: { p_org_type: string; p_plan_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      log_integration_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_name: string
          p_changes?: Json
          p_resource_id: string
          p_resource_type: string
          p_tenant_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_severity: string
          p_tenant_id?: string
          p_tenant_name?: string
          p_user_email?: string
          p_user_id?: string
          p_user_name?: string
        }
        Returns: string
      }
      map_legacy_role_to_org_role: {
        Args: { legacy_role: string }
        Returns: string
      }
      mask_phone_number: { Args: { phone: string }; Returns: string }
      point_in_circle: {
        Args: {
          p_center_lat: number
          p_center_lng: number
          p_lat: number
          p_lng: number
          p_radius_meters: number
        }
        Returns: boolean
      }
      point_in_geofence: {
        Args: {
          p_geofence: Database["public"]["Tables"]["geofences"]["Row"]
          p_lat: number
          p_lng: number
        }
        Returns: boolean
      }
      point_in_polygon: {
        Args: { p_lat: number; p_lng: number; p_polygon: Json }
        Returns: boolean
      }
      reset_monthly_spending: { Args: never; Returns: undefined }
      run_heartbeat_check: { Args: never; Returns: Json }
      topup_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      transition_device_lifecycle: {
        Args: {
          p_actor_id?: string
          p_device_id: string
          p_new_status: Database["public"]["Enums"]["device_lifecycle_status"]
        }
        Returns: Json
      }
      unblock_ip: { Args: { p_ip_address: string }; Returns: boolean }
      update_device_health_status: {
        Args: { p_device_id: string }
        Returns: Json
      }
      user_can_view_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_org_type: {
        Args: { _org_type: string; _user_id: string }
        Returns: boolean
      }
      validate_api_key: {
        Args: {
          p_api_key: string
          p_required_scope: Database["public"]["Enums"]["api_scope"]
        }
        Returns: Json
      }
      verify_device_telemetry: {
        Args: {
          p_device_id: string
          p_latitude: number
          p_longitude: number
          p_timestamp: string
        }
        Returns: Json
      }
    }
    Enums: {
      accounting_integration_status:
        | "pending"
        | "connected"
        | "disconnected"
        | "error"
      accounting_sync_status: "pending" | "syncing" | "synced" | "failed"
      ai_model:
        | "gpt-4.1"
        | "gpt-4o"
        | "gpt-4o-mini"
        | "gpt-5"
        | "gpt-5-mini"
        | "gpt-5-nano"
        | "claude-3-opus"
        | "claude-3-sonnet"
        | "claude-3-haiku"
        | "claude-3.5-sonnet"
        | "gemini-2.5-pro"
        | "gemini-2.5-flash"
        | "gemini-2.5-flash-lite"
        | "gemini-3-flash-preview"
      ai_provider: "openai" | "anthropic" | "lovable"
      api_key_status: "active" | "revoked" | "expired"
      api_scope:
        | "jobs.read"
        | "jobs.write"
        | "vehicles.read"
        | "vehicles.write"
        | "drivers.read"
        | "drivers.write"
        | "devices.read"
        | "geofences.read"
        | "geofences.write"
        | "alerts.read"
        | "maintenance.read"
        | "fuel.read"
        | "webhooks.manage"
        | "waybills.read"
        | "waybills.write"
        | "pricing.read"
        | "pricing.write"
        | "invoices.read"
        | "invoices.write"
      app_role:
        | "platform_admin"
        | "tenant_admin"
        | "supervisor"
        | "operations_manager"
        | "dispatcher"
        | "viewer_finance"
        | "installer"
      device_catalog_status: "supported" | "deprecated" | "blocked"
      device_health_status: "online" | "degraded" | "offline"
      device_lifecycle_status:
        | "registered"
        | "config_pending"
        | "configured"
        | "verified_online"
        | "assignable"
        | "assigned"
        | "faulty"
        | "decommissioned"
      device_protocol_type: "tcp" | "http" | "mqtt" | "udp"
      geofence_category:
        | "depot"
        | "delivery"
        | "restricted"
        | "customer"
        | "custom"
      geofence_event_type: "ENTER" | "EXIT"
      geofence_state: "INSIDE" | "OUTSIDE"
      geofence_status: "ACTIVE" | "ARCHIVED"
      geofence_type: "CIRCLE" | "POLYGON"
      maintenance_interval_type: "date" | "mileage" | "both"
      maintenance_lifecycle_status: "upcoming" | "due" | "overdue" | "completed"
      message_direction: "OUTBOUND" | "INBOUND"
      org_membership_status: "active" | "invited" | "suspended" | "removed"
      org_relationship_status: "ACTIVE" | "INACTIVE"
      org_relationship_type:
        | "CONTRACTED_PROVIDER"
        | "AGGREGATED_FLEET"
        | "SUBCONTRACTOR"
      org_role_scope: "ORG" | "CROSS_ORG"
      organization_status: "ACTIVE" | "SUSPENDED" | "ARCHIVED"
      organization_type:
        | "ENTERPRISE"
        | "FLEET_PROVIDER"
        | "AGGREGATOR"
        | "OWNER_OPERATOR"
      phone_number_status: "available" | "assigned" | "suspended" | "released"
      phone_number_type: "local" | "mobile" | "toll_free"
      sender_id_status: "pending" | "whitelisting" | "approved" | "rejected"
      sender_id_type: "sms" | "voice" | "both"
      service_tier: "basic" | "standard" | "advanced" | "premium"
      support_context_type:
        | "device"
        | "sim"
        | "vehicle"
        | "whatsapp"
        | "billing"
        | "none"
      support_escalation_target:
        | "truckmoov_internal"
        | "fonu_connectivity"
        | "vendor_installer"
      support_ticket_category:
        | "device_tracking"
        | "sim_connectivity"
        | "messaging"
        | "billing_subscription"
        | "account_access"
        | "other"
      support_ticket_priority: "low" | "medium" | "high" | "critical"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_on_tenant"
        | "escalated"
        | "resolved"
        | "closed"
      waybill_invoice_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "sent"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
        | "disputed"
      waybill_status:
        | "received"
        | "processing"
        | "extracted"
        | "extraction_failed"
        | "needs_review"
        | "approved"
        | "invoice_generated"
        | "invoiced"
        | "rejected"
        | "archived"
      webhook_delivery_status:
        | "pending"
        | "success"
        | "failed"
        | "retrying"
        | "dead_letter"
      webhook_event_status: "RECEIVED" | "PROCESSED" | "FAILED"
      webhook_event_type:
        | "job.created"
        | "job.updated"
        | "job.offer.sent"
        | "job.offer.accepted"
        | "job.offer.declined"
        | "job.completed"
        | "job.cancelled"
        | "geofence.enter"
        | "geofence.exit"
        | "geofence.dwell.exceeded"
        | "device.status.changed"
        | "sla.breached"
        | "maintenance.due"
        | "fuel.anomaly.detected"
        | "alert.created"
      whatsapp_account_status:
        | "NOT_CONNECTED"
        | "PENDING"
        | "CONNECTED"
        | "NEEDS_ATTENTION"
        | "DISABLED"
      whatsapp_connection_method: "EMBEDDED_SIGNUP" | "SUPERADMIN_ASSISTED"
      whatsapp_message_status:
        | "QUEUED"
        | "SENT"
        | "DELIVERED"
        | "READ"
        | "FAILED"
      whatsapp_message_type: "TEMPLATE" | "TEXT" | "MEDIA" | "INTERACTIVE"
      whatsapp_template_status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accounting_integration_status: [
        "pending",
        "connected",
        "disconnected",
        "error",
      ],
      accounting_sync_status: ["pending", "syncing", "synced", "failed"],
      ai_model: [
        "gpt-4.1",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-5",
        "gpt-5-mini",
        "gpt-5-nano",
        "claude-3-opus",
        "claude-3-sonnet",
        "claude-3-haiku",
        "claude-3.5-sonnet",
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3-flash-preview",
      ],
      ai_provider: ["openai", "anthropic", "lovable"],
      api_key_status: ["active", "revoked", "expired"],
      api_scope: [
        "jobs.read",
        "jobs.write",
        "vehicles.read",
        "vehicles.write",
        "drivers.read",
        "drivers.write",
        "devices.read",
        "geofences.read",
        "geofences.write",
        "alerts.read",
        "maintenance.read",
        "fuel.read",
        "webhooks.manage",
        "waybills.read",
        "waybills.write",
        "pricing.read",
        "pricing.write",
        "invoices.read",
        "invoices.write",
      ],
      app_role: [
        "platform_admin",
        "tenant_admin",
        "supervisor",
        "operations_manager",
        "dispatcher",
        "viewer_finance",
        "installer",
      ],
      device_catalog_status: ["supported", "deprecated", "blocked"],
      device_health_status: ["online", "degraded", "offline"],
      device_lifecycle_status: [
        "registered",
        "config_pending",
        "configured",
        "verified_online",
        "assignable",
        "assigned",
        "faulty",
        "decommissioned",
      ],
      device_protocol_type: ["tcp", "http", "mqtt", "udp"],
      geofence_category: [
        "depot",
        "delivery",
        "restricted",
        "customer",
        "custom",
      ],
      geofence_event_type: ["ENTER", "EXIT"],
      geofence_state: ["INSIDE", "OUTSIDE"],
      geofence_status: ["ACTIVE", "ARCHIVED"],
      geofence_type: ["CIRCLE", "POLYGON"],
      maintenance_interval_type: ["date", "mileage", "both"],
      maintenance_lifecycle_status: ["upcoming", "due", "overdue", "completed"],
      message_direction: ["OUTBOUND", "INBOUND"],
      org_membership_status: ["active", "invited", "suspended", "removed"],
      org_relationship_status: ["ACTIVE", "INACTIVE"],
      org_relationship_type: [
        "CONTRACTED_PROVIDER",
        "AGGREGATED_FLEET",
        "SUBCONTRACTOR",
      ],
      org_role_scope: ["ORG", "CROSS_ORG"],
      organization_status: ["ACTIVE", "SUSPENDED", "ARCHIVED"],
      organization_type: [
        "ENTERPRISE",
        "FLEET_PROVIDER",
        "AGGREGATOR",
        "OWNER_OPERATOR",
      ],
      phone_number_status: ["available", "assigned", "suspended", "released"],
      phone_number_type: ["local", "mobile", "toll_free"],
      sender_id_status: ["pending", "whitelisting", "approved", "rejected"],
      sender_id_type: ["sms", "voice", "both"],
      service_tier: ["basic", "standard", "advanced", "premium"],
      support_context_type: [
        "device",
        "sim",
        "vehicle",
        "whatsapp",
        "billing",
        "none",
      ],
      support_escalation_target: [
        "truckmoov_internal",
        "fonu_connectivity",
        "vendor_installer",
      ],
      support_ticket_category: [
        "device_tracking",
        "sim_connectivity",
        "messaging",
        "billing_subscription",
        "account_access",
        "other",
      ],
      support_ticket_priority: ["low", "medium", "high", "critical"],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_on_tenant",
        "escalated",
        "resolved",
        "closed",
      ],
      waybill_invoice_status: [
        "draft",
        "pending_review",
        "approved",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "disputed",
      ],
      waybill_status: [
        "received",
        "processing",
        "extracted",
        "extraction_failed",
        "needs_review",
        "approved",
        "invoice_generated",
        "invoiced",
        "rejected",
        "archived",
      ],
      webhook_delivery_status: [
        "pending",
        "success",
        "failed",
        "retrying",
        "dead_letter",
      ],
      webhook_event_status: ["RECEIVED", "PROCESSED", "FAILED"],
      webhook_event_type: [
        "job.created",
        "job.updated",
        "job.offer.sent",
        "job.offer.accepted",
        "job.offer.declined",
        "job.completed",
        "job.cancelled",
        "geofence.enter",
        "geofence.exit",
        "geofence.dwell.exceeded",
        "device.status.changed",
        "sla.breached",
        "maintenance.due",
        "fuel.anomaly.detected",
        "alert.created",
      ],
      whatsapp_account_status: [
        "NOT_CONNECTED",
        "PENDING",
        "CONNECTED",
        "NEEDS_ATTENTION",
        "DISABLED",
      ],
      whatsapp_connection_method: ["EMBEDDED_SIGNUP", "SUPERADMIN_ASSISTED"],
      whatsapp_message_status: [
        "QUEUED",
        "SENT",
        "DELIVERED",
        "READ",
        "FAILED",
      ],
      whatsapp_message_type: ["TEMPLATE", "TEXT", "MEDIA", "INTERACTIVE"],
      whatsapp_template_status: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
    },
  },
} as const
