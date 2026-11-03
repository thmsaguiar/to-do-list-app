import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerenciador Brutalista de Tarefas",
  description: "Gerencie suas tarefas com eficiência e design neo-brutalista.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-[#FFE600] selection:text-black">
        {children}
      </body>
    </html>
  );
}
