<template>
  <div class="container mx-auto p-4">
    <header class="mb-8">
      <h1 class="text-4xl font-bold">{{ item.name }}</h1>
      <p class="text-gray-600">{{ item.description }}</p>
    </header>

    <!-- Zdjęcie przedmiotu -->
    <section class="mb-8">
      <img
          :src="item.imageUrl || '/placeholder.png'"
          alt="Zdjęcie przedmiotu"
          class="w-full max-w-md mx-auto rounded shadow"
      />
    </section>

    <!-- Atrybuty przedmiotu -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold">Atrybuty</h2>
      <div v-if="attributes.length === 0" class="text-gray-500">
        Brak atrybutów dla tego przedmiotu.
      </div>
      <ul v-else class="list-disc list-inside">
        <li v-for="attr in attributes" :key="attr._id">
          <strong>{{ attr.attributeName }}:</strong> {{ attr.attributeValue }}
        </li>
      </ul>
    </section>

    <!-- Przycisk edycji (dla właściciela) -->
    <section v-if="isOwner" class="mt-8">
      <button
          @click="openEditForm"
          class="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edytuj przedmiot
      </button>
    </section>
  </div>
</template>

<script>
import ItemService from "@/services/ItemService";
import { ref } from "vue";
import { useToast } from "vue-toastification";

export default {
  name: "ItemView",
  setup() {
    const toast = useToast();
    const item = ref({});
    const attributes = ref([]);
    const isOwner = ref(false);

    const loadItemDetails = async () => {
      try {
        const itemId = this.$route.params.id;

        // Pobieranie szczegółów przedmiotu
        const itemResponse = await ItemService.getItem(itemId);
        item.value = itemResponse.data;

        // Pobieranie atrybutów przedmiotu
        const attributesResponse = await ItemService.getItemAttributes(itemId);
        attributes.value = attributesResponse.data;

        // Sprawdzenie, czy użytkownik jest właścicielem
        isOwner.value = item.value.collectionId.ownerId === localStorage.getItem("userId");
      } catch (error) {
        console.error("Błąd pobierania szczegółów przedmiotu:", error);
        toast.error("Nie udało się załadować szczegółów przedmiotu.");
      }
    };

    const openEditForm = () => {
      // Logika otwierania formularza edycji przedmiotu
      toast.info("Formularz edycji zostanie dodany później.");
    };

    loadItemDetails();

    return {
      item,
      attributes,
      isOwner,
      openEditForm,
    };
  },
};
</script>

<style>
/* Dostosowane style */
</style>
