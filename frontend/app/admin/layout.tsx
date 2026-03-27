import AdminNavbar from "../components/adminNavbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="min-h-full flex flex-col">
        <AdminNavbar/>
        {children}
        </div>
  );
}
