import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Diario Reflexivo
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Escreva livremente sobre seu dia. A IA faz perguntas reflexivas,
          identifica padroes emocionais e conecta suas experiencias ao longo do tempo.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/journal">
            <Button size="lg">Comecar a escrever</Button>
          </Link>
          <Link href="/insights">
            <Button size="lg" variant="outline">Ver insights</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
