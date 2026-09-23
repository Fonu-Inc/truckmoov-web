import type { InstallationJob } from "@/features/jobs/demoData";
import { INSTALLATION_CHECKLIST } from "@/features/jobs/demoData";

function esc(v: string) {
  return String(v ?? "").replace(
    /[&<>]/g,
    c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
    }[c] as string),
  );
}

export function buildInstallationReportHtml(job: InstallationJob, installerLabel: string) {
  const rows = INSTALLATION_CHECKLIST.flatMap(s =>
    s.items.map(
      i =>
        `<tr><td>${esc(s.title)}</td><td>${esc(i.label)}</td><td>${
          job.checklist[i.id] ? "Completed" : "Not completed"
        }</td></tr>`,
    )).join("");

  const photos = job.evidence
    .map(
      e =>
        `<figure><img src="${e.dataUrl}" style="width:220px;border-radius:8px" /><figcaption>${esc(
          e.category,
        )} — ${esc(e.name)}</figcaption></figure>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Installation Report ${esc(job.id)}</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:32px;color:#111}
h1{font-size:20px} h2{font-size:15px;margin-top:24px}
table{border-collapse:collapse;width:100%;font-size:13px}
td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px}
figure{display:inline-block;margin:8px 8px 0 0;font-size:11px}
</style></head><body>
<h1>Fleet Pro — Installation Report</h1>
<p>Work order <strong>${esc(job.id)}</strong> · Status: ${
  job.status === "completed" ? "Completed" : esc(job.status)
}</p>
<h2>Customer</h2>
<div class="grid">
<div>Customer: ${esc(job.customer.name)}</div><div>Type: ${esc(job.customer.type)}</div>
<div>Phone: ${esc(job.customer.phone)}</div><div>Email: ${esc(job.customer.email)}</div>
<div>Address: ${esc(job.customer.address)}, ${esc(job.customer.city)}, ${esc(job.customer.state)}</div>
</div>
<h2>Installation</h2>
<div class="grid">
<div>Installer: ${esc(installerLabel)}</div>
<div>Scheduled: ${esc(job.scheduledDate)} ${esc(job.scheduledTime)}</div>
<div>Completed: ${esc(job.completedAt ? new Date(job.completedAt).toLocaleString() : "—")}</div>
<div>Vehicles: 1 · Devices: 1</div>
</div>
<h2>Vehicle</h2>
<div class="grid">
<div>Registration: ${esc(job.vehicle.registration)}</div><div>Type: ${esc(job.vehicle.type)}</div>
<div>Make: ${esc(job.vehicle.make)}</div><div>Model: ${esc(job.vehicle.model)}</div>
</div>
<h2>Device</h2>
<div class="grid">
<div>Device ID: ${esc(job.device.id)}</div><div>IMEI: ${esc(job.device.imei)}</div>
<div>Manufacturer: ${esc(job.device.manufacturer)}</div><div>Model: ${esc(job.device.model)}</div>
${job.sim ? `<div>SIM: ${esc(job.sim.msisdn)} (${esc(job.sim.carrier)})</div><div>Activation: ${esc(job.sim.activation)}</div>` : ""}
</div>
<h2>Checklist</h2>
<table><thead><tr><th>Section</th><th>Item</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Issues & remarks</h2>
<p>${esc(job.issue ? `${job.issue.type}: ${job.issue.description}` : job.installerNotes || "No issues reported.")}</p>
<h2>Photos</h2>
<div>${photos || "<p>No photos captured.</p>"}</div>
</body></html>`;
}
