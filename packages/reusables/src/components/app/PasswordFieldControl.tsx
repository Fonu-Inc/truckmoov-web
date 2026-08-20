import type { ChangeEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

import { FormControl } from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";

interface PasswordFieldControlProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  inputRef?: (instance: HTMLInputElement | null) => void;
}

/** Password input with lock icon and a show/hide toggle. Render inside a react-hook-form FormItem. */
export function PasswordFieldControl({
  value,
  onChange,
  onBlur,
  name,
  placeholder = "Password",
  autoComplete = "current-password",
  inputRef,
}: PasswordFieldControlProps) {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <FormControl>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={inputRef}
          className="pl-10 pr-10"
          autoComplete={autoComplete}
        />
      </FormControl>
      <button
        type="button"
        onClick={() => setShowPassword(current => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
