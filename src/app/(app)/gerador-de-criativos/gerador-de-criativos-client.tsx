"use client";

import { useState } from "react";
import { CarouselPanel } from "./components/carousel-panel";
import { CriativosLivre } from "./components/criativos-livre";
import type { Database } from "@/lib/supabase/types";

type FakeCarousel = Database["public"]["Tables"]["fake_carousels"]["Row"];

interface GeradorDeCriativosClientProps {
  initialCarousels: FakeCarousel[];
  currentUserId: string;
}

export function GeradorDeCriativosClient({ initialCarousels, currentUserId }: GeradorDeCriativosClientProps) {
  const [tab, setTab] = useState<"posts" | "criativos">("posts");

  return (
    <div className="mt-6">
      <div className="flex gap-1.5 rounded-button border border-border-strong p-0.5 w-fit">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          Gerador de Posts
        </TabButton>
        <TabButton active={tab === "criativos"} onClick={() => setTab("criativos")}>
          Criativos
        </TabButton>
      </div>

      {tab === "posts" ? (
        <CarouselPanel initialCarousels={initialCarousels} currentUserId={currentUserId} />
      ) : (
        <CriativosLivre />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
