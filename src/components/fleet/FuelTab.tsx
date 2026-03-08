import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Fuel,
  Plus,
  Search,
  AlertTriangle,
  Truck,
  DollarSign,
  Droplets,
  Gauge,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFuelTransactions, FuelTransaction } from "@/hooks/useFuelTransactions";
import { useFuelEfficiency } from "@/hooks/useFuelEfficiency";

export function FuelTab() {
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, getStats } = useFuelTransactions();
  const { weeklyConsumption, vehicleEfficiency, fleetSummary, efficiencyThreshold, exportToCSV, isLoading: efficiencyLoading } = useFuelEfficiency();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FuelTransaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    vehicleReg: "",
    driverName: "",
    fuelType: "diesel" as "diesel" | "petrol",
    quantity: "",
    pricePerLitre: "",
    odometer: "",
    station: "",
  });

  const filteredTransactions = transactions.filter(
    (t) =>
      t.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.driver_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.station_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const stats = getStats();
  const lowEfficiencyVehicles = fleetSummary.lowEfficiencyVehicles;

  const handleAddTransaction = async () => {
    const quantity = parseFloat(newTransaction.quantity);
    const pricePerLitre = parseFloat(newTransaction.pricePerLitre);
    const totalCost = quantity * pricePerLitre;

    try {
      await addTransaction({
        vehicle_id: `v-${Date.now()}`,
        vehicle_name: newTransaction.vehicleReg,
        driver_name: newTransaction.driverName || null,
        fuel_type: newTransaction.fuelType,
        quantity_liters: quantity,
        cost_ngn: totalCost,
        odometer_reading: newTransaction.odometer ? parseInt(newTransaction.odometer) : null,
        station_name: newTransaction.station || null,
      });
      setIsAddDialogOpen(false);
      resetNewTransaction();
    } catch (err) {}
  };

  const handleViewTransaction = (transaction: FuelTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const handleEditTransaction = (transaction: FuelTransaction) => {
    setSelectedTransaction(transaction);
    const pricePerLitre = Number(transaction.cost_ngn) / Number(transaction.quantity_liters);
    setNewTransaction({
      vehicleReg: transaction.vehicle_name,
      driverName: transaction.driver_name || "",
      fuelType: transaction.fuel_type as "diesel" | "petrol",
      quantity: transaction.quantity_liters.toString(),
      pricePerLitre: pricePerLitre.toFixed(0),
      odometer: transaction.odometer_reading?.toString() || "",
      station: transaction.station_name || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (selectedTransaction) {
      const quantity = parseFloat(newTransaction.quantity);
      const pricePerLitre = parseFloat(newTransaction.pricePerLitre);
      const totalCost = quantity * pricePerLitre;

      try {
        await updateTransaction(selectedTransaction.id, {
          vehicle_name: newTransaction.vehicleReg,
          driver_name: newTransaction.driverName || null,
          fuel_type: newTransaction.fuelType,
          quantity_liters: quantity,
          cost_ngn: totalCost,
          odometer_reading: newTransaction.odometer ? parseInt(newTransaction.odometer) : null,
          station_name: newTransaction.station || null,
        });
        setIsEditDialogOpen(false);
        setSelectedTransaction(null);
        resetNewTransaction();
      } catch (err) {}
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (err) {}
  };

  const handleExport = () => {
    exportToCSV();
  };

  const resetNewTransaction = () => {
    setNewTransaction({
      vehicleReg: "",
      driverName: "",
      fuelType: "diesel",
      quantity: "",
      pricePerLitre: "",
      odometer: "",
      station: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLitres.toLocaleString()}L</p>
                <p className="text-xs text-muted-foreground">Total Litres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦{(stats.totalCost / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Gauge className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.avgPricePerLitre > 0 ? `₦${stats.avgPricePerLitre.toFixed(0)}/L` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Avg Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowEfficiencyVehicles}</p>
                <p className="text-xs text-muted-foreground">Low Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Fueling
            </Button>
          </div>
        </div>

        <TabsContent value="transactions" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, driver, station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>

          <Card className="bg-card/50 border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No fuel transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{transaction.vehicle_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.driver_name || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            transaction.fuel_type === "diesel"
                              ? "bg-primary/20 text-primary"
                              : "bg-warning/20 text-warning"
                          )}
                        >
                          {transaction.fuel_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(transaction.quantity_liters).toFixed(1)}L</TableCell>
                      <TableCell className="font-medium">
                        ₦{Number(transaction.cost_ngn).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {transaction.station_name || '—'}
                      </TableCell>
                      <TableCell>{format(new Date(transaction.transaction_date), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Weekly Consumption</CardTitle>
              <CardDescription>Diesel vs Petrol usage by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="diesel"
                    name="Diesel (L)"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="petrol"
                    name="Petrol (L)"
                    fill="hsl(var(--warning))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Vehicle Fuel Efficiency</CardTitle>
                <CardDescription>Kilometers per litre by vehicle (threshold: {efficiencyThreshold} km/L)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleEfficiency.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No efficiency data available. Record fuel transactions with odometer readings to calculate efficiency.
                    </div>
                  ) : (
                    vehicleEfficiency.map((vehicle) => (
                      <div key={vehicle.vehicle_id} className="flex items-center gap-4">
                        <div className="w-24 font-mono text-sm truncate">{vehicle.vehicle_name}</div>
                        <div className="flex-1">
                          {vehicle.has_sufficient_data ? (
                            <Progress
                              value={((vehicle.efficiency_km_per_liter || 0) / 15) * 100}
                              className={cn(
                                "h-3",
                                vehicle.is_below_threshold && "[&>div]:bg-destructive",
                                !vehicle.is_below_threshold &&
                                  (vehicle.efficiency_km_per_liter || 0) < 9 &&
                                  "[&>div]:bg-warning",
                                (vehicle.efficiency_km_per_liter || 0) >= 9 && "[&>div]:bg-success"
                              )}
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground italic">Insufficient data</div>
                          )}
                        </div>
                        <div className="w-20 text-right">
                          <span className="font-medium">
                            {vehicle.efficiency_km_per_liter?.toFixed(1) || '—'} km/L
                          </span>
                        </div>
                        <div className="w-20 text-right text-sm text-muted-foreground">
                          {vehicle.transaction_count} txn
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Budget vs Actual</CardTitle>
                <CardDescription>Daily fuel spend compared to budget</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyConsumption}>
                    <defs>
                      <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="diesel"
                      name="Actual (L)"
                      stroke="hsl(var(--primary))"
                      fill="url(#fuelGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="budget"
                      name="Budget (L)"
                      stroke="hsl(var(--warning))"
                      fill="none"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Fuel Transaction</DialogTitle>
            <DialogDescription>Log a new fuel purchase for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Input
                  placeholder="e.g. LAG-234-XY"
                  value={newTransaction.vehicleReg}
                  onChange={(e) => setNewTransaction({ ...newTransaction, vehicleReg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  placeholder="Driver name"
                  value={newTransaction.driverName}
                  onChange={(e) => setNewTransaction({ ...newTransaction, driverName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select value={newTransaction.fuelType} onValueChange={(v: any) => setNewTransaction({ ...newTransaction, fuelType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input
                  placeholder="e.g. Total Lekki"
                  value={newTransaction.station}
                  onChange={(e) => setNewTransaction({ ...newTransaction, station: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Litre (₦)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 650"
                  value={newTransaction.pricePerLitre}
                  onChange={(e) => setNewTransaction({ ...newTransaction, pricePerLitre: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Odometer Reading (optional)</Label>
              <Input
                type="number"
                placeholder="Current mileage"
                value={newTransaction.odometer}
                onChange={(e) => setNewTransaction({ ...newTransaction, odometer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction} disabled={!newTransaction.vehicleReg || !newTransaction.quantity || !newTransaction.pricePerLitre}>
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-mono">{selectedTransaction.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p>{selectedTransaction.driver_name || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Fuel Type</p>
                  <Badge className={selectedTransaction.fuel_type === "diesel" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}>
                    {selectedTransaction.fuel_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Station</p>
                  <p>{selectedTransaction.station_name || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p>{Number(selectedTransaction.quantity_liters).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p>₦{Number(selectedTransaction.cost_ngn).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p>{format(new Date(selectedTransaction.transaction_date), "MMM dd, yyyy")}</p>
                </div>
              </div>
              {selectedTransaction.odometer_reading && (
                <div>
                  <p className="text-xs text-muted-foreground">Odometer</p>
                  <p>{selectedTransaction.odometer_reading.toLocaleString()} km</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Input
                  value={newTransaction.vehicleReg}
                  onChange={(e) => setNewTransaction({ ...newTransaction, vehicleReg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={newTransaction.driverName}
                  onChange={(e) => setNewTransaction({ ...newTransaction, driverName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select value={newTransaction.fuelType} onValueChange={(v: any) => setNewTransaction({ ...newTransaction, fuelType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input
                  value={newTransaction.station}
                  onChange={(e) => setNewTransaction({ ...newTransaction, station: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Litre (₦)</Label>
                <Input
                  type="number"
                  value={newTransaction.pricePerLitre}
                  onChange={(e) => setNewTransaction({ ...newTransaction, pricePerLitre: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Odometer Reading (optional)</Label>
              <Input
                type="number"
                value={newTransaction.odometer}
                onChange={(e) => setNewTransaction({ ...newTransaction, odometer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTransaction}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
