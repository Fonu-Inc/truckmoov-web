import { supabase } from "@/integrations/supabase/client";

/**
 * Simulated External Provisioning Engine
 *
 * Triggered after Platform Admin clicks "Approve" on a device or SIM
 * provisioning request. Runs through the engine checklist by progressively
 * marking steps complete on a timer. UI components subscribe via realtime
 * (or refetch) to see the progress.
 *
 * In production this would be an external service writing back via webhook;
 * here we simulate locally so the queue + details modals demo end-to-end.
 */

export interface ProvisioningStep {
  key: string;
  label: string;
  status: "pending" | "in_progress" | "completed";
  completed_at?: string;
}

export const DEVICE_PROVISIONING_STEPS: ProvisioningStep[] = [
  { key: "allocate_imei", label: "Allocate IMEI from GSMA pool", status: "pending" },
  { key: "assign_serial", label: "Assign hardware serial number", status: "pending" },
  { key: "generate_keys", label: "Generate device security keys & certificates", status: "pending" },
  { key: "register_platform", label: "Register device on Fleet Pro telemetry platform", status: "pending" },
  { key: "push_firmware", label: "Push firmware & APN configuration", status: "pending" },
  { key: "bind_mqtt", label: "Bind MQTT broker credentials", status: "pending" },
  { key: "self_test", label: "Run self-test & connectivity check", status: "pending" },
  { key: "handover", label: "Hand over to tenant inventory", status: "pending" },
];

export const SIM_PROVISIONING_STEPS: ProvisioningStep[] = [
  { key: "allocate_iccid", label: "Allocate ICCID from MTN pool", status: "pending" },
  { key: "assign_msisdn", label: "Assign MSISDN & IMSI", status: "pending" },
  { key: "generate_keys", label: "Generate Ki authentication keys", status: "pending" },
  { key: "write_profile", label: "Write SIM profile (OTA)", status: "pending" },
  { key: "provision_hlr", label: "Provision on HLR/HSS network registry", status: "pending" },
  { key: "attach_apn", label: "Attach APN & data bundle entitlements", status: "pending" },
  { key: "network_test", label: "Verify network attach & PDP context", status: "pending" },
  { key: "handover", label: "Hand over to tenant inventory", status: "pending" },
];

const STEP_DELAY_MS = 2500; // 2.5s per step → ~20s total per request

/**
 * Kick off the simulated engine for a device request.
 * Marks status `in_progress`, walks through checklist, then marks `active`.
 */
export async function startDeviceProvisioningSimulation(requestId: string) {
  const checklist: ProvisioningStep[] = DEVICE_PROVISIONING_STEPS.map((s) => ({ ...s }));

  // Move first step to in_progress, set status to in_progress
  checklist[0].status = "in_progress";
  await supabase
    .from("device_setup_requests")
    .update({
      status: "in_progress",
      provisioning_started_at: new Date().toISOString(),
      provisioning_checklist: checklist as never,
    } as never)
    .eq("id", requestId);

  for (let i = 0; i < checklist.length; i++) {
    await new Promise((r) => setTimeout(r, STEP_DELAY_MS));
    checklist[i].status = "completed";
    checklist[i].completed_at = new Date().toISOString();
    if (i + 1 < checklist.length) {
      checklist[i + 1].status = "in_progress";
    }
    await supabase
      .from("device_setup_requests")
      .update({ provisioning_checklist: checklist as never } as never)
      .eq("id", requestId);
  }

  // Mark as completed
  await supabase
    .from("device_setup_requests")
    .update({
      status: "completed",
      provisioning_completed_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);
}

/**
 * Kick off the simulated engine for a SIM request.
 * Walks through SIM checklist; final state remains `approved` (Completed).
 */
export async function startSIMProvisioningSimulation(requestId: string) {
  const checklist: ProvisioningStep[] = SIM_PROVISIONING_STEPS.map((s) => ({ ...s }));

  checklist[0].status = "in_progress";
  await supabase
    .from("sim_provisioning_requests")
    .update({
      status: "in_progress",
      provisioning_started_at: new Date().toISOString(),
      provisioning_checklist: checklist as never,
    } as never)
    .eq("id", requestId);

  for (let i = 0; i < checklist.length; i++) {
    await new Promise((r) => setTimeout(r, STEP_DELAY_MS));
    checklist[i].status = "completed";
    checklist[i].completed_at = new Date().toISOString();
    if (i + 1 < checklist.length) {
      checklist[i + 1].status = "in_progress";
    }
    await supabase
      .from("sim_provisioning_requests")
      .update({ provisioning_checklist: checklist as never } as never)
      .eq("id", requestId);
  }

  await supabase
    .from("sim_provisioning_requests")
    .update({
      status: "completed",
      provisioning_completed_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);
}
