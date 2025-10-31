import "@unocss/reset/tailwind.css";

import "./globals.css";

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
      />

      {children}
    </html>
  );
}
