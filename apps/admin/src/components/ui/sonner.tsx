import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      position="top-right"
      expand={false}
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-enterprise-md group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
          success: "group-[.toaster]:border-success/30 group-[.toaster]:bg-success/5",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/5",
          warning: "group-[.toaster]:border-warning/30 group-[.toaster]:bg-warning/5",
          info: "group-[.toaster]:border-info/30 group-[.toaster]:bg-info/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };


