import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/shared/Hero";
import ProjectGrid from "@/components/shared/ProjectGrid";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen bg-neutral-950 font-sans">
      <Navbar />
      <Hero />
      <ProjectGrid />
    </main>
  );
}
