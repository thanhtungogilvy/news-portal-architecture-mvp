// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  app: {
    head: {
      link: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Inter:wght@400;500&display=swap",
        },
      ],
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  devServer: {
    https: true,
  },

  modules: [
    "@pinia/nuxt",
    "nuxt-svgo",
    "@nuxt/eslint",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/supabase",
  ],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  imports: {
    dirs: ["composables/**"],
  },

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  svgo: {
    autoImportPath: "./assets/icons/",
    defaultImport: "component",
    componentPrefix: "Icon",
  },

  supabase: {
    redirect: false,
  },

  vite: {
    optimizeDeps: {
      include: [
        "pinia",
        "@vueuse/core",
        "@vueuse/motion",
        "clsx",
        "dayjs",
        "zod",
      ],
    },
  },
});
