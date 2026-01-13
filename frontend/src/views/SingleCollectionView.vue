<template>
  <div class="container mx-auto p-4">
    <header v-if="collection" class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800">{{ collection.name }}</h1>
      <p class="text-gray-600 mt-2">{{ collection.description }}</p>

      <p
        v-if="collection && collection.category"
        class="text-sm text-gray-500 mt-2"
      >
        Kategoria:
        <router-link
          :to="`/categories/${collection.category.id || collection.category._id}/collections`"
          class="text-blue-500 hover:underline"
        >
          {{ collection.category.name || "Nieznana kategoria" }}
        </router-link>
      </p>

      <div class="mt-4 flex gap-2">
        <button
          v-if="canEdit && collection.privacy === 'private'"
          @click="openAllowedUsersModal"
          class="btn-primary"
        >
          Zarządzaj dostępem
        </button>
      </div>
    </header>

    <!-- Polubienia i komentarze kolekcji -->
    <section v-if="collection" class="mb-8 space-y-6">
      <!-- Polubienia -->
      <div class="flex items-center gap-4">
        <button
          @click="toggleCollectionLike"
          :disabled="isLikingCollection"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          :class="hasLikedCollection 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
          </svg>
          <span>{{ collectionLikesCount }}</span>
        </button>
        <span v-if="!isAuthenticated" class="text-sm text-gray-500">
          Zaloguj się, aby polubić
        </span>
      </div>

      <!-- Komentarze -->
      <div>
        <h3 class="text-xl font-semibold mb-4">Komentarze ({{ collectionComments.length }})</h3>

        <!-- Dodaj komentarz -->
        <div v-if="isAuthenticated" class="mb-4">
          <textarea
            v-model="newCollectionComment"
            placeholder="Napisz komentarz do kolekcji..."
            class="w-full p-3 border rounded-lg resize-none"
            rows="3"
          ></textarea>
          <button
            @click="addCollectionComment"
            :disabled="!newCollectionComment.trim() || isAddingCollectionComment"
            class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isAddingCollectionComment ? 'Dodawanie...' : 'Dodaj komentarz' }}
          </button>
        </div>
        <p v-else class="text-sm text-gray-500 mb-4">
          Zaloguj się, aby dodać komentarz
        </p>

        <!-- Lista komentarzy -->
        <div v-if="collectionComments.length === 0" class="text-gray-500">
          Brak komentarzy
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="comment in collectionComments"
            :key="comment._id"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-800">{{ comment.user?.username || 'Anonim' }}</p>
                <p class="text-xs text-gray-500">{{ formatCommentDate(comment.createdAt) }}</p>
              </div>
              <button
                v-if="canDeleteCollectionComment(comment)"
                @click="deleteCollectionComment(comment._id)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                Usuń
              </button>
            </div>
            <p class="mt-2 text-gray-700">{{ comment.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-4">Przedmioty w tej kolekcji</h2>

      <div v-if="isLoading" class="text-center py-8">
        Ładowanie danych...
      </div>

      <div v-else-if="items.length === 0" class="text-center py-8">
        Brak przedmiotów w tej kolekcji.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="item in items"
          :key="item.id || item._id"
          class="relative group"
        >
          <router-link :to="`/items/${item.id || item._id}`" class="block">
            <div
              class="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div class="mb-4 relative h-48 overflow-hidden rounded-lg bg-gray-100">
                <img
                  :src="getItemCoverUrl(item)"
                  alt="Zdjęcie przedmiotu"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="$event.target.src = '/placeholder.png'"
                />
              </div>
              <h3
                class="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition"
              >
                {{ item.name }}
              </h3>
              <p class="text-sm text-gray-600 mt-2 line-clamp-2">
                {{ item.description }}
              </p>
              
              <!-- Statystyki przedmiotu (polubienia i komentarze) -->
              <div class="mt-4 flex gap-4 text-xs text-gray-500">
                <div class="flex items-center gap-1">
                   <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ item.likesCount || (item.likes ? item.likes.length : 0) }}</span>
                </div>
                <div class="flex items-center gap-1">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>{{ item.comments?.length || 0 }}</span>
                </div>
              </div>

            </div>
          </router-link>

          <div
            v-if="canEdit"
            class="absolute top-2 right-2 flex items-start justify-end p-2 z-30 pointer-events-none"
          >
            <div class="flex gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="updateItem(item)"
                class="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                title="Edytuj"
              >
                <PencilIcon class="w-5 h-5" />
              </button>
              <button
                @click.stop="deleteItem(item.id || item._id)"
                class="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                title="Usuń"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <button
      v-if="canEdit"
      @click="openAddItemForm"
      class="fixed bottom-12 right-4 btn-primary"
    >
      Dodaj przedmiot
    </button>

   <!-- Modals (AddItem, AllowedUsers) and Script Logic remain, handled via replacement content -->
    <div
      v-if="showAddItemForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
        style="max-height: 90vh;"
      >
        <div class="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-2xl font-semibold">
            {{ isEditingItem ? "Edytuj przedmiot" : "Dodaj przedmiot" }}
          </h2>
        </div>

        <form
          @submit.prevent="handleAddItem"
          class="flex-1 flex flex-col overflow-hidden"
        >
          <div class="flex-1 min-h-0 overflow-y-auto p-6">
            <div class="space-y-4">
              <div>
                <label
                  for="itemName"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nazwa przedmiotu*
                </label>
                <input
                  v-model="newItem.name"
                  id="itemName"
                  type="text"
                  class="input-field"
                  required
                />
              </div>

              <div>
                <label
                  for="itemDescription"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Opis przedmiotu
                </label>
                <textarea
                  v-model="newItem.description"
                  id="itemDescription"
                  class="input-field h-24"
                ></textarea>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Zdjęcie przedmiotu
                </label>
                <ImageUploader v-model="newItem.imageUrl" />
              </div>

              <div
                v-if="collection.category && collection.category.attributes && collection.category.attributes.length"
                class="mt-4"
              >
                <h3 class="text-lg font-semibold mb-2">Atrybuty</h3>

                <div
                  v-for="attr in collection.category.attributes"
                  :key="attr.name"
                  class="mb-4"
                >
                  <label
                    :for="`attr-${attr.name}`"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {{ attr.name }}<span v-if="attr.required" class="text-red-500">*</span>
                  </label>

                  <template v-if="attr.type === 'string' || attr.type === 'text'">
                    <input
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @input="setAttributeValue(attr, $event.target.value)"
                      type="text"
                      class="input-field"
                      :required="attr.required"
                    />
                  </template>

                  <template v-else-if="attr.type === 'number'">
                    <input
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @input="setAttributeValue(attr, $event.target.valueAsNumber)"
                      type="number"
                      class="input-field"
                      :required="attr.required"
                    />
                  </template>

                  <template v-else-if="attr.type === 'date'">
                    <input
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @input="setAttributeValue(attr, $event.target.value)"
                      type="date"
                      class="input-field"
                      :required="attr.required"
                    />
                  </template>

                  <template v-else-if="attr.type === 'boolean'">
                    <select
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @change="setAttributeValue(attr, $event.target.value === 'true')"
                      class="input-field"
                      :required="attr.required"
                    >
                      <option value="true">Tak</option>
                      <option value="false">Nie</option>
                    </select>
                  </template>

                  <template v-else-if="attr.type === 'url'">
                    <input
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @input="setAttributeValue(attr, $event.target.value)"
                      type="url"
                      class="input-field"
                      :required="attr.required"
                    />
                  </template>

                   <template v-else-if="attr.type === 'select'">
                    <select
                      :id="`attr-${attr.name}`"
                      :value="getAttributeValue(attr)"
                      @change="setAttributeValue(attr, $event.target.value)"
                      class="input-field"
                      :required="attr.required"
                    >
                      <option value="" disabled>Wybierz opcję</option>
                      <option v-for="option in attr.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </select>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-gray-200 flex-shrink-0">
            <div class="flex justify-end gap-3">
              <button
                type="button"
                @click="closeAddItemForm"
                class="btn-gray"
              >
                Anuluj
              </button>
              <button
                type="submit"
                class="btn-primary"
              >
                Zapisz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal zarządzania dostępem -->
    <div
      v-if="showAllowedUsersModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
        style="max-height: 90vh;"
      >
        <div class="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-2xl font-semibold">Zarządzaj dostępem</h2>
          <p class="text-sm text-gray-500 mt-1">
            Dla kolekcji prywatnej: {{ collection.name }}
          </p>
        </div>

        <div class="p-6 flex-1 min-h-0 overflow-y-auto">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Dodaj użytkownika (nazwa)
            </label>
            <div class="flex gap-2">
              <input
                v-model="newAllowedUser"
                type="text"
                class="input-field"
                placeholder="np. jan_kowalski"
                @keyup.enter="addAllowedUser"
              />
              <button
                @click="addAllowedUser"
                class="btn-primary whitespace-nowrap"
              >
                Dodaj
              </button>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-gray-700 mb-2">
              Użytkownicy z dostępem ({{ allowedUsersList.length }})
            </h3>
            <ul>
              <li
                v-for="user in allowedUsersList"
                :key="user.id || user._id"
                class="flex justify-between items-center border-b py-2"
              >
                <span>{{ user.username }} ({{ user.email }})</span>
                <button
                  @click="removeAllowedUser(user.id || user._id)"
                  class="btn-danger text-sm px-2 py-1"
                >
                  Usuń
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 flex-shrink-0">
          <div class="flex justify-end">
            <button
              @click="closeAllowedUsersModal"
              class="btn-gray"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import store from "@/store";
import CollectionService from "@/services/CollectionService";
import ItemService from "@/services/ItemService";
import { PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";
import ImageUploader from "@/components/ImageUploader.vue";
import { getImageUrl } from "@/utils/imageUrl";

export default {
  name: "SingleCollectionView",
  components: { PencilIcon, TrashIcon, ImageUploader },

  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const collection = ref({});
    const items = ref([]);
    const isLoading = ref(true);

    const newItem = ref({
      name: "",
      description: "",
      imageUrl: "",
      attributes: {}
    });

    const isEditingItem = ref(false);

    // Collection likes/comments
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const collectionComments = ref([]);
    const newCollectionComment = ref('');
    const isAddingCollectionComment = ref(false);
    const isLikingCollection = ref(false);
    const hasLikedCollection = ref(false);
    const collectionLikesCount = ref(0);

    const loggedUser = computed(() => store.state.auth.user);
    const userId = computed(() => loggedUser.value?._id || loggedUser.value?.id);

    const allowedUsersList = ref([]);
    const newAllowedUser = ref("");
    const showAllowedUsersModal = ref(false);

    const showAddItemForm = ref(false);

    const canEdit = computed(() => {
      if (!loggedUser.value) return false;
      if (!collection.value || !collection.value.owner) return false;

      const ownerId =
        typeof collection.value.owner === "object"
          ? collection.value.owner._id || collection.value.owner.id
          : collection.value.owner;

      return ownerId && userId.value && ownerId.toString() === userId.value.toString();
    });

    const getItemCoverUrl = (item) => {
      const fromImages = Array.isArray(item?.images) && item.images.length > 0 ? item.images[0] : null;
      const url = fromImages || item?.imageUrl;
      return url ? getImageUrl(url) : "/placeholder.png";
    };

    const loadCollection = async () => {
      try {
        const response = await CollectionService.getCollection(route.params.id);
        const data = response.data || response;
        collection.value = data.collection || data;
        
        // Load likes
        if (collection.value) {
           collectionLikesCount.value = collection.value.likesCount || (collection.value.likes?.length || 0);
           if (userId.value && collection.value.likes) {
             hasLikedCollection.value = collection.value.likes.includes(userId.value);
           }
        }
      } catch (error) {
        console.error("Błąd ładowania kolekcji", error);
        toast.error("Nie udało się pobrać kolekcji");
      }
    };

    const loadItems = async () => {
      try {
        const response = await ItemService.getItemsByCollection(route.params.id);
        const data = response.data || response;
        items.value = data.items || data;
      } catch (error) {
         console.error("Błąd ładowania przedmiotów", error);
      } finally {
        isLoading.value = false;
      }
    };

    const openAddItemForm = () => {
      newItem.value = {
        name: "",
        description: "",
        imageUrl: "",
        attributes: {}
      };

      if (collection.value.category?.attributes) {
        collection.value.category.attributes.forEach((attr) => {
          const defaultValue =
            attr.type === "number"
              ? 0
              : attr.type === "boolean"
              ? false
              : attr.type === "date"
              ? new Date().toISOString().split("T")[0]
              : "";

          newItem.value.attributes[attr.name] = {
            type: attr.type,
            value: attr.required ? defaultValue : null
          };
        });
      }

      isEditingItem.value = false;
      showAddItemForm.value = true;
    };

    const handleAddItem = async () => {
      if (collection.value.category?.attributes) {
        Object.keys(newItem.value.attributes).forEach((key) => {
          const catAttr = collection.value.category.attributes.find((a) => a.name === key);
          if (catAttr && !newItem.value.attributes[key].type) {
            newItem.value.attributes[key].type = catAttr.type;
          }
        });
      }

      try {
        const firstImageUrl = String(newItem.value.imageUrl || "").trim();
        const imagesPayload = firstImageUrl ? [firstImageUrl] : [];

        if (isEditingItem.value) {
          const payload = {
            name: newItem.value.name,
            description: newItem.value.description,
            images: imagesPayload,
            attributes: newItem.value.attributes
          };

          const response = await ItemService.updateItem(
            newItem.value.id || newItem.value._id,
            payload
          );

          const data = response.data || response;
          const updated = data.item || data;

          if (updated && Array.isArray(updated.images) && updated.images.length) {
            updated.imageUrl = updated.images[0];
          }

          const idx = items.value.findIndex(
            (it) => (it.id || it._id) === (newItem.value.id || newItem.value._id)
          );
          if (idx !== -1) {
            items.value[idx] = updated;
          }

          toast.success("Przedmiot został zaktualizowany!");
        } else {
          const payload = {
            name: newItem.value.name,
            description: newItem.value.description,
            images: imagesPayload,
            attributes: newItem.value.attributes,
            parentCollection: collection.value.id || collection.value._id
          };

          const response = await ItemService.createItem(payload);
          const data = response.data || response;
          const created = data.item || data;

          if (created && Array.isArray(created.images) && created.images.length) {
            created.imageUrl = created.images[0];
          }

          items.value.push(created);
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

      const firstImage =
        Array.isArray(item?.images) && item.images.length ? item.images[0] : "";

      newItem.value = {
        ...item,
        imageUrl: firstImage || item.imageUrl || ""
      };

      if (!newItem.value.attributes) {
        newItem.value.attributes = {};
      }

      if (collection.value.category?.attributes) {
        collection.value.category.attributes.forEach((attr) => {
          const attrName = attr.name;

          if (newItem.value.attributes[attrName]) {
            if (!newItem.value.attributes[attrName].type) {
              newItem.value.attributes[attrName].type = attr.type;
            }
          } else {
            newItem.value.attributes[attrName] = {
              type: attr.type,
              value: attr.type === "number" ? 0 : ""
            };
          }
        });
      }

      showAddItemForm.value = true;
    };

    const closeAddItemForm = () => {
      isEditingItem.value = false;
      showAddItemForm.value = false;
      newItem.value = {
        name: "",
        description: "",
        imageUrl: "",
        attributes: {}
      };
    };

    const deleteItem = async (itemId) => {
      try {
        await ItemService.deleteItem(itemId);
        items.value = items.value.filter((it) => (it.id || it._id) !== itemId);
        toast.success("Przedmiot został usunięty!");
      } catch (error) {
        console.error("Błąd usuwania przedmiotu:", error);
        toast.error("Nie udało się usunąć przedmiotu.");
      }
    };

    const openAllowedUsersModal = async () => {
      showAllowedUsersModal.value = true;
      try {
        const response = await CollectionService.getAllowedUsers(
          collection.value.id || collection.value._id
        );
        const data = response.data || response;
        allowedUsersList.value = data.users || data.allowedUsers || [];
      } catch (error) {
        console.error("Błąd ładowania użytkowników z dostępem:", error);
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
        const data = response.data || response;
        allowedUsersList.value = data.allowedUsers || data.users || allowedUsersList.value;
        toast.success("Użytkownik został dodany");
        newAllowedUser.value = "";
      } catch (error) {
        console.error("Błąd dodawania użytkownika:", error);
        toast.error("Nie udało się dodać użytkownika.");
      }
    };

    const removeAllowedUser = async (userIdToRemove) => {
      try {
        await CollectionService.removeAllowedUser(
          collection.value.id || collection.value._id,
          userIdToRemove
        );
        allowedUsersList.value = allowedUsersList.value.filter(
          (user) => (user.id || user._id) !== userIdToRemove
        );
        toast.success("Użytkownik został usunięty");
      } catch (error) {
        console.error("Błąd usuwania użytkownika:", error);
        toast.error("Nie udało się usunąć użytkownika.");
      }
    };

    const getAttributeValue = (attr) => {
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = {
          type: attr.type,
          value: attr.type === "number" ? 0 : ""
        };
      }
      return newItem.value.attributes[attr.name].value;
    };

    const setAttributeValue = (attr, value) => {
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = {
          type: attr.type,
          value
        };
      } else {
        newItem.value.attributes[attr.name].value = value;
      }
    };

    const incrementViews = async () => {
      try {
        await CollectionService.incrementViews(route.params.id);
      } catch (error) {
        console.error("Błąd aktualizacji liczby wyświetleń:", error);
      }
    };

    const formatCommentDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const loadCollectionComments = async () => {
      try {
        const response = await CollectionService.getComments(route.params.id);
        collectionComments.value = response.data?.comments || [];
      } catch (error) {
        console.error('Błąd pobierania komentarzy:', error);
      }
    };

    const addCollectionComment = async () => {
       if (!newCollectionComment.value.trim()) return;
       try {
         isAddingCollectionComment.value = true;
         const response = await CollectionService.addComment(route.params.id, newCollectionComment.value);
         collectionComments.value.push(response.data.comment);
         newCollectionComment.value = '';
         toast.success('Komentarz dodany');
       } catch (error) {
         console.error('Błąd dodawania komentarza:', error);
         toast.error('Nie udało się dodać komentarza');
       } finally {
         isAddingCollectionComment.value = false;
       }
    };

    const deleteCollectionComment = async (commentId) => {
      try {
        await CollectionService.deleteComment(route.params.id, commentId);
        collectionComments.value = collectionComments.value.filter(c => c._id !== commentId);
        toast.success('Komentarz usunięty');
      } catch (error) {
        console.error('Błąd usuwania komentarza:', error);
        toast.error('Nie udało się usunąć komentarza');
      }
    };

    const canDeleteCollectionComment = (comment) => {
      if (!loggedUser.value) return false;
      const isAdmin = store.getters['auth/isAdmin'];
      if (isAdmin) return true;
      
      const isOwner = collection.value.owner?._id === userId.value || collection.value.owner === userId.value;
      const isAuthor = comment.user?._id === userId.value || comment.user === userId.value;
      
      return isOwner || isAuthor;
    };

    const toggleCollectionLike = async () => {
      if (!isAuthenticated.value) {
        // Redirect to login similar to item like
        router.push({ 
          path: "/login", 
          query: { redirect: route.fullPath } 
        });
        return;
      }
      if (isLikingCollection.value) return;

      try {
        isLikingCollection.value = true;
        const response = await CollectionService.likeCollection(route.params.id);
        hasLikedCollection.value = response.data.liked;
        collectionLikesCount.value = response.data.likesCount;
      } catch (error) {
        console.error('Błąd polubienia:', error);
        toast.error('Nie udało się zaktualizować polubienia');
      } finally {
        isLikingCollection.value = false;
      }
    };

    onMounted(async () => {
      await loadCollection();
      await loadItems();
      incrementViews();
      loadCollectionComments();
    });

    return {
      collection,
      items,
      isLoading,
      newItem,
      showAddItemForm,
      isEditingItem,
      canEdit,
      openAddItemForm,
      handleAddItem,
      closeAddItemForm,
      updateItem,
      deleteItem,
      getItemCoverUrl,
      
      // Allowed users stats
      showAllowedUsersModal,
      allowedUsersList,
      newAllowedUser,
      openAllowedUsersModal,
      closeAllowedUsersModal,
      addAllowedUser,
      removeAllowedUser,
      
      getAttributeValue,
      setAttributeValue,

      // Comments and Likes
      isAuthenticated,
      collectionComments,
      newCollectionComment,
      isAddingCollectionComment,
      isLikingCollection,
      hasLikedCollection,
      collectionLikesCount,
      toggleCollectionLike,
      addCollectionComment,
      deleteCollectionComment,
      canDeleteCollectionComment,
      formatCommentDate
    };
  }
};
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
}
.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors;
}
.btn-gray {
  @apply bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors;
}
.input-field {
  @apply w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
