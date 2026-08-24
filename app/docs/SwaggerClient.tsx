"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import "swagger-ui-react/swagger-ui.css";

// SwaggerUI manipule le DOM → client-only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-gray-500">Chargement de la documentation…</div>,
}) as ComponentType<{
  url?: string;
  docExpansion?: "list" | "full" | "none";
  deepLinking?: boolean;
  persistAuthorization?: boolean;
}>;

export default function SwaggerClient() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI url="/api/docs/openapi" docExpansion="list" deepLinking persistAuthorization />
    </div>
  );
}
