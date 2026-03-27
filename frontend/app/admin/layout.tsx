import AdminNavbar from "../components/adminNavbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className="min-h-full flex flex-col">
        <AdminNavbar/>
        {children}
        </body>
    </html>
  );
}
