import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:
    "ILHOTA · Gerar terreno determinístico e encontrar trilha por A*, com exportação OBJ",
  description:
    "Gerar terreno determinístico e encontrar trilha por A*, com exportação OBJ",
  metadataBase: new URL("https://ilhota-gustapaz.starrylinen.chatgpt.site"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "ILHOTA",
    description:
      "Gerar terreno determinístico e encontrar trilha por A*, com exportação OBJ",
    type: "website",
    locale: "pt_BR",
  },
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
