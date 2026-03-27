import UserTopbar from "../components/userTopbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="min-h-full flex flex-col">
        <UserTopbar/>
        {children}
        </div>
  );
}
