import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportTypeSelect, { type ReportType } from "../components/ReportTypeSelect";
import DateRangeSelect, { type DateRange } from "../components/DateRangeSelect";
import ReportKpiCards from "../components/ReportKpiCards";
import ReportBarChart from "../components/ReportBarChart";
import ReportPieChart from "../components/ReportPieChart";
import ReportTable from "../components/ReportTable";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("job_performance");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Report Builder</h2>
          <p className="text-sm text-muted-foreground">
            Select a report type and date range to explore operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelect value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Report type selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTypeSelect value={reportType} onChange={setReportType} />
        </CardContent>
      </Card>

      {/* KPI cards */}
      <ReportKpiCards reportType={reportType} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportBarChart reportType={reportType} />
        <ReportPieChart reportType={reportType} />
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detailed Records</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTable reportType={reportType} />
        </CardContent>
      </Card>
    </section>
  );
}
