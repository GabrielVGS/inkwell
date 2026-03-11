"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/journal");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-44">
            <Image
              src="/logo.png"
              alt="Inkwell"
              width={2816}
              height={1536}
              className="dark:invert opacity-85"
            />
          </div>
          <h1 className="font-display text-3xl italic tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground/60">
            Comece seu diario reflexivo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-card/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-card/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-card/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Minimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <div className="rule" />

        <p className="text-center text-sm text-muted-foreground/60">
          Ja tem uma conta?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
