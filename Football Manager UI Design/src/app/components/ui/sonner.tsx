"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Get theme from localStorage or default to dark
  const theme = (localStorage.getItem("fan-manager-theme") || "dark") as ToasterProps["theme"];

  return (
    <Sonner
      theme={theme === "auto" ? "system" : theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
