<template>
  <div class="container mx-auto p-4">
    <div v-if="isLoading" class="text-center py-8">
      Ładowanie danych...
    </div>
    <div v-else-if="!item">
      <p>Nie znaleziono przedmiotu.</p>
    </div>
    <div v-else>
      <!-- Nagłówek z nazwą przedmiotu -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800">{{ item.name }}</h1>
        <p class="text-gray-600 mt-2">{{ item.description }}</p>
      </header>
      <!-- Wyświetlenie zdjęcia -->
      <div class="mb-6">
        <img :src="item.imageUrl || '/placeholder.png'" alt="Zdjęcie przedmiotu" class="w-full max-w-md mx-auto rounded" />
      </div>
      <!-- Informacje o kategorii, kolekcji i właścicielu -->
      <div class="mb-6">
        <p><strong>Kategoria:</strong> {{ item.category?.name || 'Brak kategorii' }}</p>
        <p><strong>Kolekcja:</strong> {{ item.parentCollection?.name || 'Brak kolekcji' }}</p>
        <p><strong>Właściciel:</strong> {{ item.createdBy?.username || 'Nieznany' }}</p>
      </div>
      <!-- Wyświetlenie atrybutów -->
      <div>
        <h2 class="text-2xl font-semibold mb-4">Atrybuty</h2>
        <ul>
          <li v-for="(attr, key) in item.attributes" :key="key" class="mb-2">
            <strong>{{ key }}:</strong> {{ attr.value }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import ItemService from "@/services/ItemService";

export default {
  name: "SingleItemView",
  setup() {
    const route = useRoute();
    const toast = useToast();
    const isLoading = ref(true);
    const item = ref(null);

    const loadItem = async () => {
      try {
        const response = await ItemService.getItem(route.params.id);
        item.value = response.data.item || response.data;
      } catch (error) {
        console.error("Błąd pobierania przedmiotu:", error);
        toast.error("Nie udało się pobrać danych przedmiotu");
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      loadItem();
    });

    return {
      item,
      isLoading
    };
  }
};
</script>

<style scoped>
/* Przykładowe style – dostosuj według potrzeb */
.container {
  max-width: 800px;
}
img {
  max-width: 100%;
  height: auto;
}
</style>
