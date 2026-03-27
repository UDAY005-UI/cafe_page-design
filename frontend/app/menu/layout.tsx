import UserTopbar from "../components/userTopbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className="min-h-full flex flex-col">
        <UserTopbar/>
        {children}
        </body>
    </html>
  );
}
