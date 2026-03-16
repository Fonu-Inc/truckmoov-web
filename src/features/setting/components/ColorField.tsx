import { Input } from "@/components/ui/input";
import { Label } from "recharts";

type ColorFieldProps =  {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export default function ColorField({label, value, onChange, description}: ColorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-md border border-border cursor-pointer appearance-none bg-transparent p-0"
            style={{ WebkitAppearance: 'none' }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-xs uppercase"
          maxLength={7}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
