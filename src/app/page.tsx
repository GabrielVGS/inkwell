import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-8 animate-fade-up">
        {/* Decorative mark */}
        <div className="mx-auto w-12 h-px bg-foreground/20" />

        <div className="space-y-4">
          <h1 className="font-display text-5xl sm:text-6xl tracking-tight leading-[1.1]">
            Diario
            <br />
            <span className="italic font-light">Reflexivo</span>
          </h1>
          <div className="mx-auto w-8 h-px bg-foreground/15" />
        </div>

        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Escreva livremente sobre seu dia. A IA faz perguntas reflexivas,
          identifica padroes emocionais e conecta suas experiencias ao longo do tempo.
        </p>

        <div className="flex gap-3 justify-center pt-2">
          <Link href="/journal">
            <Button size="lg" className="px-8">
              Comecar a escrever
            </Button>
          </Link>
          <Link href="/insights">
            <Button size="lg" variant="outline" className="px-8">
              Ver insights
            </Button>
          </Link>
        </div>

        {/* Decorative bottom element */}
        <div className="pt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <span className="w-4 h-px bg-current" />
          <span className="tracking-widest uppercase">reflexao guiada por ia</span>
          <span className="w-4 h-px bg-current" />
        </div>
      </div>
    </div>
  );
}
