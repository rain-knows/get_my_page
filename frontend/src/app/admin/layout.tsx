export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 px-6 py-4">Admin</header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
