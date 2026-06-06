// Auth route group layout — no sidebar.
// Forms are self-contained full-screen components; layout is a passthrough.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
