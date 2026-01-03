export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove server-side redirect to avoid infinite loop
  // Client-side check is handled in the page component
  return <>{children}</>;
}

