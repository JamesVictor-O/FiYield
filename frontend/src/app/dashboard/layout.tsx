import AppNavigation from "@/components/layout/app-navigator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavigation />
      <div className="lg:pl-64">{children}</div>
    </>
  );
}
