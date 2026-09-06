import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Ghost AI",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        geistSans.className,
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body>
        <ClerkProvider
          afterSignOutUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}
          appearance={{
            theme: dark,
            options: {
              logoPlacement: "none",
              socialButtonsVariant: "blockButton",
            },
            variables: {
              colorPrimary: "var(--accent-primary)",
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-subtle)",
              colorInputForeground: "var(--text-primary)",
              colorForeground: "var(--text-primary)",
              colorMutedForeground: "var(--text-muted)",
              colorBorder: "var(--border-default)",
              colorNeutral: "var(--text-primary)",
              colorDanger: "var(--state-error)",
              borderRadius: "var(--radius)",
              fontFamily: geistSans.style.fontFamily,
              fontFamilyButtons: geistSans.style.fontFamily,
              fontFamilyMono: geistMono.style.fontFamily,
            },
            elements: {
              rootBox: "w-full max-w-[38rem]",
              cardBox:
                "w-full overflow-hidden rounded-3xl border border-surface-border bg-base shadow-none",
              card: "w-full rounded-none bg-base px-8 py-10 shadow-none sm:px-12",
              header: "gap-2",
              headerTitle: "text-2xl font-semibold tracking-tight",
              headerSubtitle: "text-base text-copy-muted",
              socialButtonsRoot: "mt-8",
              socialButtons: "grid grid-cols-2 gap-3",
              socialButtonsBlockButton:
                "h-12 border-surface-border bg-base text-copy-secondary hover:bg-surface",
              dividerRow: "my-6",
              dividerLine: "bg-surface-border",
              dividerText: "text-copy-muted",
              formFieldLabel: "mb-2 text-sm font-medium text-copy-primary",
              formFieldInput:
                "h-12 rounded-xl border-surface-border-subtle bg-subtle px-4 text-copy-primary",
              formButtonPrimary:
                "mt-3 h-12 rounded-xl bg-brand font-semibold text-primary-foreground hover:bg-brand/90",
              footer:
                "border-t border-surface-border bg-surface px-8 py-5 sm:px-12",
              footerActionText: "text-copy-muted",
              footerActionLink: "font-medium text-brand hover:text-brand",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
