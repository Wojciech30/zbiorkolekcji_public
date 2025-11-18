<template>
  <div class="container mx-auto p-4">
    <header v-if="collection" class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800">{{ collection.name }}</h1>
      <p class="text-gray-600 mt-2">{{ collection.description }}</p>
      <p v-if="collection && collection.category" class="text-sm text-gray-500 mt-2">
        Kategoria:
        <router-link :to="`/categories/${collection.category.id || collection.category._id}/collections`" class="text-blue-500 hover:underline">
          {{ collection.category.name || "Nieznana kategoria" }}
        </router-link>
      </p>
      <div class="mt-4 flex gap-2">
        <button v-if="canEdit" @click="openEditCollectionModal" class="btn-primary">
          Edytuj kolekcję
        </button>
        <button
            v-if="canEdit && collection.privacy === 'private'"
            @click="openAllowedUsersModal"
            class="btn-primary"
        >
          Zarządzaj dostępem
        </button>
      </div>
    </header>

    <section>
      <h2 class="text-2xl font-semibold mb-4">Przedmioty w tej kolekcji</h2>
      <div v-if="isLoading" class="text-center py-8">Ładowanie danych...</div>
      <div v-else-if="items.length === 0" class="text-center py-8">Brak przedmiotów w tej kolekcji.</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="item in items" :key="item.id || item._id" class="relative group">
          <router-link :to="`/items/${item.id || item._id}`" class="block">
            <div class="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
              <img :src="item.imageUrl || '/placeholder.png'" alt="Zdjęcie przedmiotu" class="h-32 w-full object-cover mb-4 rounded" />
              <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">{{ item.name }}</h3>
              <p class="text-sm text-gray-600 mt-2">{{ item.description }}</p>
            </div>
          </router-link>
          <div v-if="canEdit" class="absolute inset-0 flex items-start justify-end p-2 z-30 pointer-events-none">
            <div class="flex gap-2 pointer-events-auto">
              <button @click.stop="updateItem(item)" class="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200" title="Edytuj">
                <PencilIcon class="w-5 h-5" />
              </button>
              <button @click.stop="deleteItem(item.id || item._id)" class="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200" title="Usuń">
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <button v-if="canEdit" @click="openAddItemForm" class="fixed bottom-12 right-4 btn-primary">
      Dodaj przedmiot
    </button>

    <div v-if="showAddItemForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" style="max-height: 90vh;">
        <div class="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-2xl font-semibold">{{ isEditingItem ? "Edytuj przedmiot" : "Dodaj przedmiot" }}</h2>
        </div>
        <form @submit.prevent="handleAddItem" class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 min-h-0 overflow-y-auto p-6">
            <div class="space-y-4">
              <div>
                <label for="itemName" class="block text-sm font-medium text-gray-700 mb-1">Nazwa przedmiotu*</label>
                <input v-model="newItem.name" type="text" id="itemName" class="input-field" required />
              </div>
              <div>
                <label for="itemDescription" class="block text-sm font-medium text-gray-700 mb-1">Opis przedmiotu</label>
                <textarea v-model="newItem.description" id="itemDescription" class="input-field h-24"></textarea>
              </div>
              <div>
                <label for="itemImageUrl" class="block text-sm font-medium text-gray-700 mb-1">URL zdjęcia</label>
                <input v-model="newItem.imageUrl" type="text" id="itemImageUrl" class="input-field" />
              </div>
              <div v-if="collection.category && collection.category.attributes && collection.category.attributes.length" class="mt-4">
                <h3 class="text-lg font-semibold mb-2">Atrybuty</h3>
                <div v-for="attr in collection.category.attributes" :key="attr.name" class="mb-4">
                  <label :for="`attr-${attr.name}`" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ attr.name }}<span v-if="attr.required" class="text-red-500">*</span>
                  </label>
                  <template v-if="attr.type === 'string'">
                    <input :value="getAttributeValue(attr)" @input="setAttributeValue(attr, $event.target.value)" type="text" :id="`attr-${attr.name}`" class="input-field" :required="attr.required" />
                  </template>
                  <template v-else-if="attr.type === 'number'">
                    <input :value="getAttributeValue(attr)" @input="setAttributeValue(attr, $event.target.valueAsNumber)" type="number" :id="`attr-${attr.name}`" class="input-field" :required="attr.required" />
                  </template>
                  <template v-else-if="attr.type === 'date'">
                    <input :value="getAttributeValue(attr)" @input="setAttributeValue(attr, $event.target.value)" type="date" :id="`attr-${attr.name}`" class="input-field" :required="attr.required" />
                  </template>
                  <template v-else-if="attr.type === 'boolean'">
                    <select :value="getAttributeValue(attr)" @change="setAttributeValue(attr, $event.target.value)" :id="`attr-${attr.name}`" class="input-field" :required="attr.required">
                      <option :value="true">Tak</option>
                      <option :value="false">Nie</option>
                    </select>
                  </template>
                  <template v-else-if="attr.type === 'url'">
                    <input :value="getAttributeValue(attr)" @input="setAttributeValue(attr, $event.target.value)" type="url" :id="`attr-${attr.name}`" class="input-field" :required="attr.required" />
                  </template>
                  <template v-else-if="attr.type === 'select'">
                    <select :value="getAttributeValue(attr)" @change="setAttributeValue(attr, $event.target.value)" :id="`attr-${attr.name}`" class="input-field" :required="attr.required">
                      <option disabled value="">Wybierz opcję</option>
                      <option v-for="option in attr.options" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 flex-shrink-0">
            <div class="flex justify-end gap-3">
              <button @click="closeAddItemForm" type="button" class="btn-gray">Anuluj</button>
              <button type="submit" class="btn-primary">{{ isEditingItem ? "Zapisz zmiany" : "Dodaj przedmiot" }}</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditCollectionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-semibold">Edytuj kolekcję</h2>
        </div>
        <form @submit.prevent="handleUpdateCollection" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nazwa kolekcji*</label>
            <input v-model="editedCollection.name" type="text" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Opis</label>
            <textarea v-model="editedCollection.description" class="input-field"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Kategoria</label>
            <select
                v-model="editedCollection.category"
                class="input-field"
                :disabled="hasItems"
            >
              <option v-for="cat in categories"
                      :key="cat.id || cat._id"
                      :value="cat.id || cat._id">
                {{ cat.name }}
              </option>
            </select>
            <p v-if="hasItems" class="text-sm text-gray-500 mt-1">
              Nie można zmienić kategorii, ponieważ kolekcja zawiera przedmioty.
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" @click="closeEditCollectionModal" class="btn-gray">Anuluj</button>
            <button type="submit" class="btn-primary">Zapisz zmiany</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showAllowedUsersModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" style="max-height: 90vh;">
        <div class="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-2xl font-semibold">Zarządzaj dostępem</h2>
        </div>
        <div class="flex-1 p-6 overflow-y-auto">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Dodaj użytkownika (ID):</label>
            <input v-model="newAllowedUser" type="text" class="input-field" placeholder="ID użytkownika" />
            <button @click="addAllowedUser" class="btn-primary mt-2">Dodaj</button>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-2">Aktualni użytkownicy z dostępem:</h3>
            <ul>
              <li v-for="user in allowedUsersList" :key="user.id || user._id" class="flex justify-between items-center border-b py-2">
                <span>{{ user.username }} ({{ user.email }})</span>
                <button @click="removeAllowedUser(user.id || user._id)" class="btn-danger text-sm px-2 py-1">Usuń</button>
              </li>
            </ul>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex-shrink-0">
          <div class="flex justify-end">
            <button @click="closeAllowedUsersModal" class="btn-gray">Zamknij</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import store from "@/store";
import CollectionService from "@/services/CollectionService";
import ItemService from "@/services/ItemService";
import { PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";

export default {
  name: "SingleCollectionView",
  components: { PencilIcon, TrashIcon },
  setup() {
    const route = useRoute();
    const toast = useToast();
    const collection = ref({});
    const items = ref([]);
    const isLoading = ref(true);
    const newItem = ref({ name: "", description: "", imageUrl: "", attributes: {} });
    const isEditingItem = ref(false);
    const loggedUser = computed(() => store.state.auth.user);
    const userId = computed(() => loggedUser.value?._id || loggedUser.value?.id);
    const allowedUsersList = ref([]);
    const newAllowedUser = ref("");
    const showAllowedUsersModal = ref(false);
    const showAddItemForm = ref(false);
    const showEditCollectionModal = ref(false);
    const editedCollection = ref({ name: '', description: '', category: null });
    const categories = ref([]);
    const hasItems = computed(() => items.value.length > 0);

    const canEdit = computed(() => {
      if (!loggedUser.value) return false;
      if (!collection.value || !collection.value.owner) return false;
      const ownerId = typeof collection.value.owner === "object"
          ? (collection.value.owner._id || collection.value.owner.id)
          : collection.value.owner;
      return ownerId && userId.value && ownerId.toString() === userId.value.toString();
    });

    const loadCollection = async () => {
      try {
        const response = await CollectionService.getCollection(route.params.id);
        collection.value = response.data.collection || response.data;
      } catch (error) {
        console.error("Błąd ładowania kolekcji:", error);
        toast.error("Nie udało się załadować kolekcji.");
      }
    };

    const loadItems = async () => {
      try {
        const response = await ItemService.getItemsByCollection(route.params.id);
        items.value = response.data.items || response.data;
      } catch (error) {
        console.error("Błąd ładowania przedmiotów:", error);
        toast.error("Nie udało się załadować przedmiotów.");
      }
    };

    const openAddItemForm = () => {
      newItem.value = { name: "", description: "", imageUrl: "", attributes: {} };
      if (collection.value.category?.attributes) {
        collection.value.category.attributes.forEach(attr => {
          const defaultValue = attr.type === 'number' ? 0 :
              attr.type === 'boolean' ? false :
                  attr.type === 'date' ? new Date().toISOString().split('T')[0] : '';
          newItem.value.attributes[attr.name] = {
            type: attr.type,
            value: attr.required ? defaultValue : null
          };
        });
      }
      showAddItemForm.value = true;
    };

    const handleAddItem = async () => {
      Object.keys(newItem.value.attributes).forEach(key => {
        const catAttr = collection.value.category.attributes.find(a => a.name === key);
        if (catAttr && !newItem.value.attributes[key].type) {
          newItem.value.attributes[key].type = catAttr.type;
        }
      });
      try {
        if (isEditingItem.value) {
          const response = await ItemService.updateItem(newItem.value.id || newItem.value._id, newItem.value);
          const index = items.value.findIndex(item => (item.id || item._id) === (newItem.value.id || newItem.value._id));
          if (index !== -1) {
            items.value[index] = response.data.item || response.data;
          }
          toast.success("Przedmiot został zaktualizowany!");
        } else {
          const response = await ItemService.createItem({
            ...newItem.value,
            parentCollection: collection.value.id || collection.value._id
          });
          items.value.push(response.data.item || response.data);
          toast.success("Przedmiot został dodany!");
        }
        closeAddItemForm();
      } catch (error) {
        console.error("Błąd zapisywania przedmiotu:", error);
        toast.error("Nie udało się zapisać przedmiotu.");
      }
    };

    const updateItem = (item) => {
      isEditingItem.value = true;
      newItem.value = { ...item };
      if (collection.value.category?.attributes) {
        collection.value.category.attributes.forEach(attr => {
          const attrName = attr.name;
          if (newItem.value.attributes[attrName]) {
            if (!newItem.value.attributes[attrName].type) {
              newItem.value.attributes[attrName].type = attr.type;
            }
          } else {
            newItem.value.attributes[attrName] = {
              type: attr.type,
              value: attr.type === 'number' ? 0 : ''
            };
          }
        });
      }
      showAddItemForm.value = true;
    };

    const closeAddItemForm = () => {
      isEditingItem.value = false;
      showAddItemForm.value = false;
      newItem.value = { name: "", description: "", imageUrl: "", attributes: {} };
    };

    const deleteItem = async itemId => {
      try {
        await ItemService.deleteItem(itemId);
        items.value = items.value.filter(item => (item.id || item._id) !== itemId);
        toast.success("Przedmiot został usunięty!");
      } catch (error) {
        console.error("Błąd usuwania przedmiotu:", error);
        toast.error("Nie udało się usunąć przedmiotu.");
      }
    };

    const openEditCollectionModal = async () => {
      editedCollection.value = {
        name: collection.value.name,
        description: collection.value.description,
        category: collection.value.category?.id || collection.value.category?._id || collection.value.category
      };
      try {
        const response = await CollectionService.getCategories();
        categories.value = response.data.categories || response.data;
      } catch (error) {
        toast.error("Nie udało się pobrać kategorii");
      }
      showEditCollectionModal.value = true;
    };

    const handleUpdateCollection = async () => {
      try {
        const updates = {
          name: editedCollection.value.name,
          description: editedCollection.value.description
        };

        if (!hasItems.value) {
          updates.category = editedCollection.value.category;
        }

        const response = await CollectionService.updateCollection(
            collection.value.id || collection.value._id,
            updates
        );

        collection.value = response.data.collection;
        toast.success("Kolekcja zaktualizowana!");
        closeEditCollectionModal();
      } catch (error) {
        console.error("Błąd aktualizacji kolekcji:", error);
        toast.error("Nie udało się zaktualizować kolekcji");
      }
    };

    const closeEditCollectionModal = () => {
      showEditCollectionModal.value = false;
    };

    const openAllowedUsersModal = async () => {
      showAllowedUsersModal.value = true;
      try {
        const response = await CollectionService.getAllowedUsers(collection.value.id || collection.value._id);
        allowedUsersList.value = response.data.users || response.data.allowedUsers || [];
      } catch (error) {
        toast.error("Nie udało się załadować listy użytkowników.");
      }
    };

    const closeAllowedUsersModal = () => {
      showAllowedUsersModal.value = false;
      newAllowedUser.value = "";
    };

    const addAllowedUser = async () => {
      if (!newAllowedUser.value) {
        toast.error("Podaj nazwę użytkownika");
        return;
      }
      try {
        const response = await CollectionService.addAllowedUserByUsername(
            collection.value.id || collection.value._id,
            newAllowedUser.value.trim()
        );
        toast.success("Użytkownik został dodany");
        allowedUsersList.value = response.data.allowedUsers || allowedUsersList.value;
        newAllowedUser.value = "";
      } catch (error) {
        toast.error("Nie udało się dodać użytkownika.");
      }
    };

    const removeAllowedUser = async userIdToRemove => {
      try {
        await CollectionService.removeAllowedUser(collection.value.id || collection.value._id, userIdToRemove);
        toast.success("Użytkownik został usunięty");
        allowedUsersList.value = allowedUsersList.value.filter(user => (user.id || user._id) !== userIdToRemove);
      } catch (error) {
        toast.error("Nie udało się usunąć użytkownika.");
      }
    };

    const getAttributeValue = (attr) => {
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = { type: attr.type, value: attr.type === "number" ? 0 : "" };
      }
      return newItem.value.attributes[attr.name].value;
    };

    const setAttributeValue = (attr, value) => {
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = { type: attr.type, value };
      } else {
        newItem.value.attributes[attr.name].value = value;
      }
    };

    onMounted(async () => {
      isLoading.value = true;
      try {
        await loadCollection();
        await loadItems();
      } catch (error) {
        console.error("Błąd ładowania danych:", error);
      } finally {
        isLoading.value = false;
      }
    });

    return {
      collection,
      items,
      isLoading,
      showAddItemForm,
      newItem,
      isEditingItem,
      canEdit,
      openAddItemForm,
      handleAddItem,
      closeAddItemForm,
      updateItem,
      deleteItem,
      showAllowedUsersModal,
      allowedUsersList,
      newAllowedUser,
      openAllowedUsersModal,
      closeAllowedUsersModal,
      addAllowedUser,
      removeAllowedUser,
      getAttributeValue,
      setAttributeValue,
      showEditCollectionModal,
      editedCollection,
      categories,
      hasItems,
      openEditCollectionModal,
      closeEditCollectionModal,
      handleUpdateCollection
    };
  }
};
</script>

<style scoped>
.input-field {
  @apply w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors;
}
.btn-gray {
  @apply bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors;
}
.btn-primary {
  @apply bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition;
}
.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition;
}
</style>