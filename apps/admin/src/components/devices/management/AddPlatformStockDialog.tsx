import { useQuery } from "@tanstack/react-query";
import {
  getSystemDevicesCatalogQueryOptions, useImportPlatformStock,
} from "@truckmoov/api/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function csvCell(value: string) {
  return `"${value.replace(
    /"/g,
    "\"\"",
  )}"`;
}

export function AddPlatformStockDialog({
  open, onOpenChange,
}: Props) {
  const catalog = useQuery({
    ...getSystemDevicesCatalogQueryOptions({ params: { status: "supported" } }),
    enabled: open,
  });
  const importer = useImportPlatformStock();
  const [
    imei,
    setImei,
  ] = useState("");
  const [
    modelId,
    setModelId,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");
  const models = catalog.data?.data.models ?? [];
  const selected = models.find(model => model.id === modelId);

  const close = (value: boolean) => {
    if (!value) {
      setImei("");
      setModelId("");
      setError("");
    }
    onOpenChange(value);
  };

  const submit = () => {
    if (!selected || !/^\d{15}$/.test(imei))
      return;
    setError("");
    const row = [
      imei,
      selected.manufacturer,
      selected.model,
    ].map(csvCell).join(",");
    const file = new File(
      [`imei,manufacturer,model\r\n${row}\r\n`],
      "platform-device.csv",
      { type: "text/csv" },
    );
    importer.mutate(
      { file },
      {
        onSuccess: ({ data }) => {
          if (data.created === 1) {
            toast.success("Device added to stock");
            close(false);
          }
          else if (data.skippedExisting) {
            setError("This IMEI is already registered. Search for it in Inventory or Assigned Devices.");
          }
          else {
            setError(data.rejected[0]?.reason ?? "The device could not be added to stock.");
          }
        },
        onError: error => setError(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={value => !importer.isPending && close(value)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Device to Stock</DialogTitle>
          <DialogDescription>Register a physical unit from a supported model using its 15-digit IMEI.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label
              required
              htmlFor="stock-device-imei"
            >
              IMEI
            </Label>
            <Input
              id="stock-device-imei"
              autoComplete="off"
              inputMode="numeric"
              maxLength={15}
              value={imei}
              onChange={event => setImei(event.target.value.replace(
                /\D/g,
                "",
              ))}
            />
          </div>
          <div className="space-y-2">
            <Label
              required
              htmlFor="stock-device-model"
            >
              Supported model
            </Label>
            <Select
              value={modelId}
              onValueChange={setModelId}
            >
              <SelectTrigger
                id="stock-device-model"
                disabled={catalog.isLoading || catalog.isError || importer.isPending}
              >
                <SelectValue placeholder={catalog.isLoading ? "Loading models…" : "Select a model"} />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                  >
                    {model.manufacturer}
                    {" "}
                    {model.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {catalog.isError && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                Unable to load supported models.
              </p>
            )}
            {!catalog.isLoading && !catalog.isError && !models.length && <p className="text-sm text-muted-foreground">Add a model under Supported Models first.</p>}
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={importer.isPending}
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={importer.isPending}
              disabled={!selected || !/^\d{15}$/.test(imei)}
            >
              Add device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
