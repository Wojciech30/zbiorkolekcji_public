<template>
  <div class="container mx-auto p-4">
    <header class="text-center">
      <h1 class="text-4xl font-bold">Witaj w Zbiór Kolekcji</h1>
      <p class="text-gray-600">Twórz, zarządzaj i dziel się swoimi kolekcjami.</p>
    </header>

    <!-- Wyszukiwarka -->
    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Wyszukiwarka kategorii</h2>
      <div class="mt-4 flex gap-4">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Wyszukaj kategorię..."
            class="flex-1 p-2 border rounded"
        />
      </div>
    </section>


    <!-- Kategorie -->
    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Kategorie</h2>
      <div v-if="isLoading" class="text-center">Ładowanie danych...</div>
      <div v-else-if="categories.length === 0" class="text-center">Brak kategorii do wyświetlenia.</div>
      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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

    <!-- Najpopularniejsze kolekcje -->
    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Najpopularniejsze Kolekcje</h2>
      <div v-if="isLoading" class="text-center">Ładowanie danych...</div>
      <div v-else-if="popularCollections.length === 0" class="text-center">Brak kolekcji do wyświetlenia.</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div
            v-for="collection in popularCollections"
            :key="collection._id"
            class="p-4 border rounded shadow hover:shadow-lg transition"
        >
          <router-link :to="`/collections/${collection._id}`">
            <h3 class="text-lg font-bold">{{ collection.name }}</h3>
            <p class="text-sm text-gray-500">{{ collection.description }}</p>
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
      isLoading: true,
    };
  },

  computed: {
    filteredCategories() {
      if (!this.searchQuery.trim()) {
        return this.categories;
      }
      return this.categories.filter((category) =>
          category.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },

  async mounted() {
    try {
      try {
        const categoryResponse = await CategoryService.getCategories();
        this.categories = categoryResponse.data.categories;
      } catch (error) {
        console.error("Błąd pobierania kategorii:", error);
        this.$toast.error("Nie udało się załadować kategorii.");
      }

      try {
        const collectionResponse = await CollectionService.getCollections();
        this.popularCollections = collectionResponse.data.collections;
      } catch (error) {
        console.error("Błąd pobierania kolekcji:", error);
        this.$toast.error("Nie udało się załadować kolekcji.");
      }
    } finally {
      this.isLoading = false;
    }
  },
};

</script>

<style>
/* Dostosowane style */
</style>
