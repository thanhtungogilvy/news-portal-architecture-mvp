<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { news: featured, status: featuredStatus } = useFeaturedNews()
const { news: mostViewed, status: mostViewedStatus } = useMostViewedNews()
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <!-- Featured -->
    <section class="mb-12">
      <h2 class="mb-6 text-2xl font-bold text-title">
        Featured
      </h2>
      <NewsList :items="featured" :pending="featuredStatus === 'pending'" />
      <p v-if="featuredStatus !== 'pending' && featured.length === 0" class="text-center text-body py-10">
        No featured news yet.
      </p>
    </section>

    <!-- Most Viewed -->
    <section>
      <h2 class="mb-6 text-2xl font-bold text-title">
        Most Viewed
      </h2>
      <NewsList :items="mostViewed" :pending="mostViewedStatus === 'pending'" />
      <p v-if="mostViewedStatus !== 'pending' && mostViewed.length === 0" class="text-center text-body py-10">
        No news yet.
      </p>
    </section>
  </div>
</template>