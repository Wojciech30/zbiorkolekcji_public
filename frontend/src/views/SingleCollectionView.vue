<!--
  @view SingleCollectionView
  @description Widok szczegółów kolekcji.
  Wyświetla: nagłówek, przedmioty, komentarze, statystyki, polubienia.
  Dla właścicieli: edycja, usuwanie, zarządzanie przedmiotami.
-->
<template>
  <div class="container mx-auto p-4">
    <!-- Header: Tytuł + Informacje meta -->
    <header v-if="collection" class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-800">{{ collection.name }}</h1>
      
      <!-- Meta row: Kategoria, Właściciel, Liczba wyświetleń, Liczba polubień -->
      <div class="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
        <!-- Kategoria -->
        <div v-if="collection.category" class="flex items-center gap-2 text-gray-600">
          <FolderIcon class="w-4 h-4" />
          <router-link
            :to="`/categories/${collection.category.id || collection.category._id}/collections`"
            class="text-blue-600 hover:underline"
          >
            {{ collection.category.name || "Nieznana kategoria" }}
          </router-link>
        </div>

        <!-- Właściciel -->
        <div v-if="collection.owner" class="flex items-center gap-2">
          <router-link 
            :to="`/users/${collection.owner._id || collection.owner.id}`"
            class="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <div class="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img 
                v-if="collection.owner.avatar" 
                :src="getImageUrl(collection.owner.avatar)" 
                :alt="collection.owner.username"
                class="w-full h-full object-cover"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                {{ collection.owner.username?.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span>{{ collection.owner.username }}</span>
          </router-link>
        </div>

        <!-- Liczba wyświetleń -->
        <div class="flex items-center gap-1 text-gray-500">
          <EyeIcon class="w-4 h-4" />
          <span>{{ collection.views || 0 }}</span>
        </div>

        <!-- Przycisk polubienia (integrowany) -->
        <button
          @click="toggleCollectionLike"
          :disabled="isLikingCollection || !isAuthenticated"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors"
          :class="hasLikedCollection 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'"
          :title="!isAuthenticated ? 'Zaloguj się, aby polubić' : ''"
        >
          <HeartIcon class="w-4 h-4" :class="hasLikedCollection ? 'fill-current' : ''" />
          <span>{{ collectionLikesCount }}</span>
        </button>

        <!-- Przycisk udostępnienia -->
        <button
          @click="shareCollection"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          title="Udostępnij kolekcję"
        >
          <ShareIcon class="w-4 h-4" />
          <span>Udostępnij</span>
        </button>

        <!-- Przycisk zarządzania dostępem -->
        <button
          v-if="canEdit && collection.privacy === 'private'"
          @click="openAllowedUsersModal"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        >
          <LockClosedIcon class="w-4 h-4" />
          <span>Zarządzaj dostępem</span>
        </button>
      </div>

      <!-- Opis -->
      <p v-if="collection.description" class="text-gray-600 mt-4">{{ collection.description }}</p>
    </header>

    <!-- Sekcja przedmiotów -->
    <section class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold">
          Przedmioty 
          <span class="text-gray-500 text-lg">({{ items.length }})</span>
        </h2>
        <button
          v-if="canEdit"
          @click="openAddItemForm"
          class="btn-primary flex items-center gap-2"
        >
          <PlusIcon class="w-5 h-5" />
          Dodaj przedmiot
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-8">
        Ładowanie danych...
      </div>

      <div v-else-if="items.length === 0" class="text-center py-8 text-gray-500">
        Brak przedmiotów w tej kolekcji.
      </div>

      <!-- Lista przedmiotów -->
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="item in paginatedItems"
            :key="item.id || item._id"
            class="relative group"
          >
            <ItemCard :data="item">
              <template v-if="canEdit" #actions>
                <button
                  @click.stop.prevent="updateItem(item)"
                  class="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                  title="Edytuj"
                >
                  <PencilIcon class="w-5 h-5" />
                </button>
                <button
                  @click.stop.prevent="deleteItem(item.id || item._id)"
                  class="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  title="Usuń"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
              </template>
            </ItemCard>
          </div>
        </div>

        <!-- Paginacja przedmiotów -->
        <div v-if="totalItemPages > 1" class="flex justify-center gap-2 mt-6">
          <button
            @click="itemsPage--"
            :disabled="itemsPage <= 1"
            class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Poprzednia
          </button>
          <span class="px-4 py-2 text-gray-600">
            {{ itemsPage }} / {{ totalItemPages }}
          </span>
          <button
            @click="itemsPage++"
            :disabled="itemsPage >= totalItemPages"
            class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Następna
          </button>
        </div>
      </template>
    </section>

    <!-- Sekcja komentarzy -->
    <section v-if="collection" class="mb-8">
      <div class="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ChatBubbleLeftRightIcon class="w-6 h-6 text-purple-500" />
          Komentarze <span class="text-gray-400 font-normal">({{ collectionComments.length }})</span>
        </h2>

        <!-- Dodawanie komentarza -->
        <div v-if="isAuthenticated" class="mb-8 flex gap-4">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
              {{ userInitials }}
            </div>
          </div>
          <div class="flex-grow">
            <div class="relative">
              <textarea
                v-model="newCollectionComment"
                placeholder="Podziel się swoją opinią..."
                class="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow min-h-[100px]"
                rows="3"
              ></textarea>
            </div>
            <div class="flex justify-end mt-2">
              <button
                @click="addCollectionComment"
                :disabled="!newCollectionComment.trim() || isAddingCollectionComment"
                class="btn-primary"
              >
                {{ isAddingCollectionComment ? 'Dodawanie...' : 'Opublikuj komentarz' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="mb-8 p-6 bg-blue-50 rounded-xl text-center">
          <p class="text-blue-800">
            <router-link :to="{ name: 'Login', query: { redirect: route.fullPath } }" class="font-bold underline hover:text-blue-900">Zaloguj się</router-link>, aby dodać komentarz.
          </p>
        </div>

        <!-- Lista komentarzy -->
        <div class="space-y-6 text-left">
          <div v-if="collectionComments.length === 0" class="text-center py-8 text-gray-400 italic">
            Brak komentarzy. Bądź pierwszy!
          </div>
          
          <transition-group name="list">
            <div
              v-for="comment in paginatedCollectionComments"
              :key="comment._id"
              class="flex gap-4 group"
            >
              <!-- Autor komentarza -->
              <div class="flex-shrink-0">
                <div v-if="comment.user?.avatar" class="w-10 h-10 rounded-full overflow-hidden">
                  <img :src="getImageUrl(comment.user.avatar)" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                  {{ comment.user?.username?.substring(0,2)?.toUpperCase() || '?' }}
                </div>
              </div>
              
              <!-- Komentarz -->
              <div class="flex-grow bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <span class="font-bold text-gray-900 mr-2">{{ comment.user?.username || 'Anonim' }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <button
                    v-if="canDeleteCollectionComment(comment)"
                    @click="deleteCollectionComment(comment._id)"
                    class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    title="Usuń komentarz"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-gray-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">{{ comment.text }}</p>
              </div>
            </div>
          </transition-group>

          <!-- Komentarze - paginacja -->
          <div v-if="totalCommentsPages > 1" class="flex justify-center gap-2 mt-6 pt-4 border-t">
            <button
              @click="commentsPage--"
              :disabled="commentsPage <= 1"
              class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Poprzednia
            </button>
            <span class="px-4 py-2 text-gray-600">
              {{ commentsPage }} / {{ totalCommentsPages }}
            </span>
            <button
              @click="commentsPage++"
              :disabled="commentsPage >= totalCommentsPages"
              class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Następna
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Modale (Dodawanie przedmiotu, Uprawnieni użytkownicy) -->
    <!-- BaseModal do dodawania/edycji przedmiotu -->
    <BaseModal
      :show="showAddItemForm"
      :title="isEditingItem ? 'Edytuj przedmiot' : 'Dodaj przedmiot'"
      @close="closeAddItemForm"
    >
      <form
        @submit.prevent="handleAddItem"
        class="flex-1 flex flex-col overflow-hidden"
      >
        <div class="flex-1 min-h-0 overflow-y-auto p-1">
          <div class="space-y-4">
            <div>
              <label
                for="itemName"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Nazwa przedmiotu
              </label>
              <input
                v-model="newItem.name"
                id="itemName"
                type="text"
                class="input-field"
                required
              />
            </div>

            <!-- Opis przedmiotu -->
            <div>
              <label
                for="itemDescription"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Opis przedmiotu <span class="text-gray-400 font-normal">(opcjonalne)</span>
              </label>
              <textarea
                v-model="newItem.description"
                id="itemDescription"
                class="input-field h-24"
              ></textarea>
            </div>

            <!-- Zdjęcie przedmiotu -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Zdjęcie przedmiotu <span class="text-gray-400 font-normal">(opcjonalne)</span>
              </label>
              <ImageUploader v-model="newItem.imageUrl" />
            </div>

            <div
              v-if="collection.category && collection.category.attributes && collection.category.attributes.length"
              class="mt-4"
            >
              <h3 class="text-lg font-semibold mb-2">Atrybuty</h3>

              <!-- Atrybuty przedmiotu -->
              <div
                v-for="attr in collection.category.attributes"
                :key="attr.name"
                class="mb-4"
              >
                <label
                  :for="`attr-${attr.name}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {{ attr.name }}<span v-if="!attr.required" class="text-gray-400 font-normal ml-1">(opcjonalne)</span>
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
                    @input="setAttributeValue(attr, $event.target.value === '' ? null : $event.target.valueAsNumber)"
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
      </form>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="closeAddItemForm"
            class="btn-gray"
          >
            Anuluj
          </button>
          <button
            @click="handleAddItem"
            type="button"
            class="btn-primary"
          >
            Zapisz
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal zarządzania dostępem -->
    <BaseModal
      :show="showAllowedUsersModal"
      title="Zarządzaj dostępem"
      @close="closeAllowedUsersModal"
    >
      <div>
        <!-- Dodawanie użytkownika do listy dozwolonych -->
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Dodaj użytkownika (nazwa)
            </label>
            <div class="flex gap-2">
              <input
                v-model="newAllowedUser"
                type="text"
                class="input-field"
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

          <!-- Lista użytkowników z dostępem -->
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
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button
            @click="closeAllowedUsersModal"
            class="btn-gray"
          >
            Zamknij
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import store from "@/store";
import CollectionService from "@/services/CollectionService";
import ItemService from "@/services/ItemService";
import { PencilIcon, TrashIcon, FolderIcon, EyeIcon, HeartIcon, LockClosedIcon, PlusIcon, ShareIcon, ChatBubbleLeftRightIcon } from "@heroicons/vue/24/outline";
import ImageUploader from "@/components/ImageUploader.vue";
import ItemCard from "@/components/ItemCard.vue";
import BaseModal from "@/components/BaseModal.vue";
import { getImageUrl } from "@/utils/imageUrl";
import { formatDate } from "@/utils/dateUtils";

export default {
  name: "SingleCollectionView",
  components: { PencilIcon, TrashIcon, FolderIcon, EyeIcon, HeartIcon, LockClosedIcon, PlusIcon, ShareIcon, ChatBubbleLeftRightIcon, ImageUploader, ItemCard, BaseModal },

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

    // Paginacja przedmiotów
    const itemsPage = ref(1);
    const itemsPerPage = 9;
    const totalItemPages = computed(() => Math.ceil(items.value.length / itemsPerPage));
    const paginatedItems = computed(() => {
      const start = (itemsPage.value - 1) * itemsPerPage;
      return items.value.slice(start, start + itemsPerPage);
    });

    // Polubienia i komentarze kolekcji
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const collectionComments = ref([]);
    const newCollectionComment = ref('');
    const isAddingCollectionComment = ref(false);
    const isLikingCollection = ref(false);
    const hasLikedCollection = ref(false);
    const collectionLikesCount = ref(0);

    // Paginacja komentarzy
    const commentsPage = ref(1);
    const commentsPerPage = 10;
    const sortedCollectionComments = computed(() => {
      return [...collectionComments.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    const totalCommentsPages = computed(() => Math.ceil(sortedCollectionComments.value.length / commentsPerPage));
    const paginatedCollectionComments = computed(() => {
      const start = (commentsPage.value - 1) * commentsPerPage;
      return sortedCollectionComments.value.slice(start, start + commentsPerPage);
    });

    const loggedUser = computed(() => store.state.auth.user);
    const userId = computed(() => loggedUser.value?._id || loggedUser.value?.id);
    const userInitials = computed(() => {
      if (!loggedUser.value?.username) return '?';
      return loggedUser.value.username.slice(0, 2).toUpperCase();
    });

    const allowedUsersList = ref([]);
    const newAllowedUser = ref("");
    const showAllowedUsersModal = ref(false);

    const showAddItemForm = ref(false);

    // Sprawdzanie czy użytkownik może edytować kolekcję
    const canEdit = computed(() => {
      if (!loggedUser.value) return false;
      if (!collection.value || !collection.value.owner) return false;

      const ownerId =
        typeof collection.value.owner === "object"
          ? collection.value.owner._id || collection.value.owner.id
          : collection.value.owner;

      return ownerId && userId.value && ownerId.toString() === userId.value.toString();
    });

    // Pobieranie URL obrazka
    const getItemCoverUrl = (item) => {
      const fromImages = Array.isArray(item?.images) && item.images.length > 0 ? item.images[0] : null;
      const url = fromImages || item?.imageUrl;
      return url ? getImageUrl(url) : "/placeholder.png";
    };

    // Ładowanie kolekcji
    const loadCollection = async () => {
      try {
        const response = await CollectionService.getCollection(route.params.id);
        const data = response.data || response;
        collection.value = data.collection || data;
        
        // Ładowanie polubień kolekcji
        if (collection.value) {
           collectionLikesCount.value = collection.value.likesCount || (collection.value.likes?.length || 0);
           if (userId.value && collection.value.likes) {
             hasLikedCollection.value = collection.value.likes.includes(userId.value);
           }
        }
      } catch (error) {
        console.error("Błąd ładowania kolekcji", error);
        
        // Redirect na 404 przy braku dostępu lub nieistniejącej kolekcji
        const status = error.response?.status;
        // 400 = invalid ID, 401 = unauthorized, 403 = forbidden, 404 = not found
        if (status === 400 || status === 401 || status === 403 || status === 404) {
          router.replace({ name: 'NotFound' });
          return;
        }
        
        toast.error("Nie udało się pobrać kolekcji");
      }
    };

    // Ładowanie przedmiotów
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

    // Otwieranie formularza dodawania nowego przedmiotu
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

    // Dodawanie nowego przedmiotu
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

    // Edycja przedmiotu
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
              value: null
            };
          }
        });
      }

      showAddItemForm.value = true;
    };

    // Zamykanie formularza dodawania przedmiotu
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

    // Usuwanie przedmiotu
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

    // Otwieranie modalu z listą użytkowników dozwolonych
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

    // Zamykanie modalu z listą użytkowników dozwolonych
    const closeAllowedUsersModal = () => {
      showAllowedUsersModal.value = false;
      newAllowedUser.value = "";
    };

    // Dodawanie użytkownika do listy dozwolonych
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

    // Usuwanie użytkownika
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

    // Pobieranie wartości atrybutu
    const getAttributeValue = (attr) => {
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = {
          type: attr.type,
          value: null
        };
      }
      return newItem.value.attributes[attr.name].value;
    };

    // Ustawianie wartości atrybutu
    const setAttributeValue = (attr, value) => {
      // Obsługa NaN (np. gdy użytkownik wyczyści pole liczbowe)
      if (typeof value === 'number' && isNaN(value)) {
        value = null;
      }
      
      if (!newItem.value.attributes[attr.name]) {
        newItem.value.attributes[attr.name] = {
          type: attr.type,
          value
        };
      } else {
        newItem.value.attributes[attr.name].value = value;
      }
    };

    // Inkrementacja liczby wyświetleń
    const incrementViews = async () => {
      try {
        await CollectionService.incrementViews(route.params.id);
      } catch (error) {
        console.error("Błąd aktualizacji liczby wyświetleń:", error);
      }
    };

    // Pobieranie komentarzy
    const loadCollectionComments = async () => {
      try {
        const response = await CollectionService.getComments(route.params.id);
        collectionComments.value = response.data?.comments || [];
      } catch (error) {
        console.error('Błąd pobierania komentarzy:', error);
      }
    };

    // Dodawanie komentarza
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

    // Usuwanie komentarza
    const deleteCollectionComment = async (commentId) => {
      if (!confirm("Czy na pewno chcesz usunąć ten komentarz?")) return;
      
      try {
        await CollectionService.deleteComment(route.params.id, commentId);
        collectionComments.value = collectionComments.value.filter(c => c._id !== commentId);
        toast.success('Komentarz usunięty');
      } catch (error) {
        console.error('Błąd usuwania komentarza:', error);
        toast.error('Nie udało się usunąć komentarza');
      }
    };

    // Sprawdzanie możliwości usuwania komentarza
    const canDeleteCollectionComment = (comment) => {
      if (!loggedUser.value) return false;
      const isAdmin = store.getters['auth/isAdmin'];
      if (isAdmin) return true;
      
      const isOwner = collection.value.owner?._id === userId.value || collection.value.owner === userId.value;
      const isAuthor = comment.user?._id === userId.value || comment.user === userId.value;
      
      return isOwner || isAuthor;
    };

    // Polubienia kolekcji
    const toggleCollectionLike = async () => {
      if (!isAuthenticated.value) {
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

    const shareCollection = () => {
      const url = window.location.href;
      
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        // Kopiowanie nie powiodło się
      }
      
      textArea.remove();
      
      if (copied) {
        toast.success('Skopiowano link do schowka!');
      } else {
        toast.info('Skopiuj link: ' + url);
      }
    };

    onMounted(async () => {
      await loadCollection();
      await loadItems();
      incrementViews();
      loadCollectionComments();
    });

    // Reload data when route params change
    watch(() => route.params.id, async (newId) => {
      if (newId) {
        isLoading.value = true;
        collection.value = {};
        items.value = [];
        await loadCollection();
        await loadItems();
        loadCollectionComments();
      }
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
      getImageUrl,
      itemsPage,
      totalItemPages,
      paginatedItems,
      showAllowedUsersModal,
      allowedUsersList,
      newAllowedUser,
      openAllowedUsersModal,
      closeAllowedUsersModal,
      addAllowedUser,
      removeAllowedUser,
      getAttributeValue,
      setAttributeValue,
      isAuthenticated,
      collectionComments,
      newCollectionComment,
      isAddingCollectionComment,
      isLikingCollection,
      hasLikedCollection,
      collectionLikesCount,
      toggleCollectionLike,
      shareCollection,
      addCollectionComment,
      deleteCollectionComment,
      canDeleteCollectionComment,
      formatDate,
      userInitials,
      route,
      commentsPage,
      totalCommentsPages,
      paginatedCollectionComments
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

/* line-clamp-2 now in global tailwind.css */
</style>
