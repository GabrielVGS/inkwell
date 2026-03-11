import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/**/{page,layout,loading,error,not-found,route,default}.{ts,tsx}"],
  project: ["src/**/*.{ts,tsx}"],
  ignore: ["src/components/ui/**"],
  ignoreDependencies: ["@tailwindcss/typography", "tw-animate-css"],
  next: {
    entry: [
      "next.config.{js,ts,cjs,mjs}",
      "src/app/**/{page,layout,loading,error,not-found,route,default,middleware}.{ts,tsx}",
      "src/middleware.{ts,tsx}",
    ],
  },
};

export default config;
