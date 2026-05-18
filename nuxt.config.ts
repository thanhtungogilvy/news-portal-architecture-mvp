// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

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
