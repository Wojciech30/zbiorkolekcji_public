<template>
  <div class="container mx-auto p-4">
    <header class="text-center">
      <h1 class="text-4xl font-bold">Witaj w Zbiór Kolekcji</h1>
      <p class="text-gray-600">Twórz, zarządzaj i dziel się swoimi kolekcjami.</p>
    </header>

    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Wyszukiwarka kategorii</h2>
      <div class="mt-4 flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Wyszukaj kategorię..."
          class="flex-1 p-2 border rounded"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Kategorie</h2>

      <div v-if="isLoadingCategories" class="text-center">
        Ładowanie danych...
      </div>

      <div v-else-if="filteredCategories.length === 0" class="text-center">
        Brak kategorii do wyświetlenia.
      </div>

      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"
      >
        <div
          v-for="category in filteredCategories"
          :key="category._id"
          class="p-4 border rounded shadow hover:shadow-lg transition"
        >
          <router-link :to="`/categories/${category._id}/collections`">
            <h3 class="text-lg font-bold">{{ category.name }}</h3>
            <p class="text-sm text-gray-500">{{ category.description }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Najpopularniejsze kolekcje</h2>

      <div v-if="isLoadingPopular" class="text-center">
        Ładowanie danych...
      </div>

      <div v-else-if="popularCollections.length === 0" class="text-center">
        Brak kolekcji do wyświetlenia.
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
      >
        <div
          v-for="collection in popularCollections"
          :key="collection._id"
          class="p-4 border rounded shadow hover:shadow-lg transition"
        >
          <router-link :to="`/collections/${collection._id}`">
            <h3 class="text-lg font-bold">{{ collection.name }}</h3>
            <p class="text-sm text-gray-500">
              Właściciel: {{ collection.owner?.username || "Nieznany" }}
            </p>
            <p class="text-xs text-gray-400">
              Wyświetlenia: {{ collection.views || 0 }}
            </p>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import CategoryService from "@/services/CategoryService";
import CollectionService from "@/services/CollectionService";

export default {
  name: "HomeView",

  data() {
    return {
      categories: [],
      popularCollections: [],
      searchQuery: "",
      isLoadingCategories: true,
      isLoadingPopular: true
    };
  },

  computed: {
    filteredCategories() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return this.categories;
      return this.categories.filter(category =>
        category.name.toLowerCase().includes(query)
      );
    }
  },

  async mounted() {
    await Promise.all([this.loadCategories(), this.loadPopularCollections()]);
  },

  methods: {
    async loadCategories() {
      this.isLoadingCategories = true;
      try {
        const response = await CategoryService.getCategories();
        this.categories = response.data.categories || [];
      } catch (error) {
        console.error("Błąd pobierania kategorii:", error);
        this.$toast?.error?.("Nie udało się załadować kategorii.");
      } finally {
        this.isLoadingCategories = false;
      }
    },

    async loadPopularCollections() {
      this.isLoadingPopular = true;
      try {
        const response = await CollectionService.getPopularCollections();
        this.popularCollections = response.data.collections || [];
      } catch (error) {
        console.error("Błąd pobierania kolekcji:", error);
        this.$toast?.error?.("Nie udało się załadować kolekcji.");
      } finally {
        this.isLoadingPopular = false;
      }
    }
  }
};
</script>
<style>
</style>
