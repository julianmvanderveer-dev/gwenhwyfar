import { useAppSettings } from "@/hooks/useAppSettings";
import BengCertLogo from "@/components/BengCertLogo";

interface Props {
  variant?: "light" | "dark";
  size?: number;
}

export default function AppLogo({ variant = "dark", size = 32 }: Props) {
  const { settings, loading } = useAppSettings();

  if (loading) {
    return <div style={{ width: size * 3.5, height: size }} />;
  }

  // If a custom logo image is set, use it
  if (settings.org_logo_url) {
    return (
      <img
        src={settings.org_logo_url}
        alt={settings.org_naam}
        style={{ height: size, width: "auto" }}
        className="object-contain"
      />
    );
  }

  // If org name differs from default, render text-only logo
  if (settings.org_naam && settings.org_naam !== "bengcert") {
    const textColor = variant === "light" ? "#FFFFFF" : "hsl(var(--foreground))";
    return (
      <span
        style={{ fontSize: size * 0.55, color: textColor, letterSpacing: 0.5 }}
        className="font-bold whitespace-nowrap"
      >
        {settings.org_naam}
      </span>
    );
  }

  // Default: BengCert SVG logo
  return <BengCertLogo variant={variant} size={size} />;
}
