import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/ui/Hero";
import ProjectGrid from "@/components/ui/ProjectGrid";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen bg-neutral-950 font-sans">
      <Navbar />
      <Hero />
      <ProjectGrid />
    </main>
  );
}
