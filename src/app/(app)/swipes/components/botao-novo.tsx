"use client";

import { useRouter } from "next/navigation";
import { Plus } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";

export function BotaoNovoSwipe({ rotulo = "Novo swipe" }: { rotulo?: string }) {
  const router = useRouter();
  return (
    <Button type="button" onClick={() => router.push("/swipes/novo")}>
      <Plus size={14} />
      {rotulo}
    </Button>
  );
}
