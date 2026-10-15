import UserSidebar from "@/components/UserSidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      <UserSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
