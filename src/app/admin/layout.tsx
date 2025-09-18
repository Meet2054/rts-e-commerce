import AdminHeader from "./components/Admin-header";
import SideNavbar from "./components/Side-Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F1F2F4] min-h-screen">
      <SideNavbar />
      <AdminHeader />
      <main className="ml-[300px] mt-[64px]">
          {children}
      </main>
    </div>
  );
}
