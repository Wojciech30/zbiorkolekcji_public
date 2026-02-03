<!--
  @view AdminPanelView
  @description Panel administratora.
  Zarządzanie: użytkownicy (blokowanie), kolekcje, kategorie.
  Wymaga roli admin.
-->
<template>
  <div class="container mx-auto p-4">
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800">Panel Administratora</h1>
      <p class="text-gray-600 mt-2">Zarządzaj kategoriami, kolekcjami i użytkownikami</p>
    </header>

    <div v-if="loading" class="text-center py-8">
      <Spinner class="w-12 h-12 mx-auto text-blue-500" />
    </div>

    <div v-else>
      <!-- Zarządzanie kategoriami -->
      <section class="bg-white p-6 rounded-lg shadow-md mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold text-gray-700">Zarządzanie kategoriami</h2>
          <button @click="openAddModal" class="btn-primary flex items-center gap-2">
            <PlusIcon class="w-5 h-5" />
            Dodaj kategorię
          </button>
        </div>

        <!-- Lista kategorii -->
        <ul class="space-y-2">
          <li
              v-for="category in categories"
              :key="category._id || category.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="space-y-1">
              <span class="font-medium text-gray-700 block">{{ category.name }}</span>
              <span class="text-sm text-gray-500 block">{{ category.description || "Brak opisu" }}</span>
              <span class="text-xs text-gray-400">{{ category.attributes?.length || 0 }} atrybutów</span>
            </div>
            <div class="flex gap-3">
              <button
                  @click="openEditModal(category)"
                  class="text-blue-600 hover:text-blue-800 transition-colors"
                  :disabled="isProcessing"
              >
                Edytuj
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Zarządzanie użytkownikami -->
      <section class="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">Zarządzanie użytkownikami</h2>
        
        <!-- Wyszukiwarka -->
        <div class="mb-4">
          <input
              v-model="userSearch"
              @input="debouncedSearchUsers"
              type="text"
              placeholder="Szukaj po nazwie użytkownika..."
              class="input-field max-w-md"
          />
        </div>

        <!-- Lista użytkowników -->
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-3 text-sm font-semibold text-gray-700">Nazwa użytkownika</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Email</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Rola</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Ostatnie logowanie</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                  v-for="user in users" 
                  :key="user._id"
                  class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="p-3 text-gray-800">{{ user.username }}</td>
                <td class="p-3 text-gray-600">{{ user.email }}</td>
                <td class="p-3">
                  <span 
                      :class="user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ user.role === 'admin' ? 'Administrator' : 'Użytkownik' }}
                  </span>
                </td>
                <td class="p-3">
                  <span 
                      :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ user.isActive ? 'Aktywny' : 'Zablokowany' }}
                  </span>
                </td>
                <td class="p-3 text-gray-600 text-sm">
                  {{ user.lastLogin ? formatDate(user.lastLogin) : 'Nigdy' }}
                </td>
                <td class="p-3">
                  <button
                      v-if="user.role !== 'admin' && user.isActive"
                      @click="openBlockConfirmModal(user)"
                      class="text-red-600 hover:text-red-800 transition-colors text-sm"
                      :disabled="isProcessing"
                  >
                    Zablokuj
                  </button>
                  <button
                      v-else-if="user.role !== 'admin' && !user.isActive"
                      @click="unblockUser(user)"
                      class="text-green-600 hover:text-green-800 transition-colors text-sm"
                      :disabled="isProcessing"
                  >
                    Odblokuj
                  </button>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginacja użytkowników -->
        <div v-if="usersPagination.pages > 1" class="flex justify-center gap-2 mt-4">
          <button 
              @click="loadUsers(usersPagination.page - 1)"
              :disabled="usersPagination.page <= 1"
              class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Poprzednia
          </button>
          <span class="px-3 py-1">{{ usersPagination.page }} / {{ usersPagination.pages }}</span>
          <button 
              @click="loadUsers(usersPagination.page + 1)"
              :disabled="usersPagination.page >= usersPagination.pages"
              class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Następna
          </button>
        </div>
      </section>

      <!-- Zarządzanie kolekcjami -->
      <section class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">Zarządzanie kolekcjami</h2>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-3 text-sm font-semibold text-gray-700">Nazwa</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Właściciel</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Kategoria</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Prywatność</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Przedmioty</th>
                <th class="p-3 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                  v-for="collection in collections" 
                  :key="collection._id"
                  class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="p-3">
                  <router-link 
                    :to="`/collections/${collection._id}`" 
                    class="text-blue-600 hover:underline font-medium"
                  >
                    {{ collection.name }}
                  </router-link>
                </td>
                <td class="p-3 text-gray-600">{{ collection.owner?.username || 'Nieznany' }}</td>
                <td class="p-3 text-gray-600">{{ collection.category?.name || '-' }}</td>
                <td class="p-3">
                  <span 
                    :class="collection.privacy === 'public' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ collection.privacy === 'public' ? 'Publiczna' : 'Prywatna' }}
                  </span>
                </td>
                <td class="p-3 text-gray-600">{{ collection.itemsCount || 0 }}</td>
                <td class="p-3">
                  <button
                    @click="openDeleteCollectionModal(collection)"
                    class="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Usuń kolekcję"
                    :disabled="isProcessing"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginacja kolekcji -->
        <div v-if="collectionsPagination.pages > 1" class="flex justify-center gap-2 mt-4">
          <button 
              @click="loadCollections(collectionsPagination.page - 1)"
              :disabled="collectionsPagination.page <= 1"
              class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Poprzednia
          </button>
          <span class="px-3 py-1">{{ collectionsPagination.page }} / {{ collectionsPagination.pages }}</span>
          <button 
              @click="loadCollections(collectionsPagination.page + 1)"
              :disabled="collectionsPagination.page >= collectionsPagination.pages"
              class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Następna
          </button>
        </div>
      </section>

      <!-- Modal potwierdzenia blokady użytkownika -->
      <BaseModal
        :show="isBlockConfirmModalOpen"
        title="Potwierdź blokadę użytkownika"
        @close="closeBlockConfirmModal"
      >
        <div>
          <p class="text-gray-600 mb-2">
            Czy na pewno chcesz zablokować użytkownika <strong>{{ userToBlock?.username }}</strong>?
          </p>
          <p class="text-red-600 text-sm mb-6">
            ⚠️ Ta operacja jest nieodwracalna. Wszystkie kolekcje i przedmioty użytkownika zostaną trwale usunięte.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <button
                @click="closeBlockConfirmModal"
                class="btn-gray"
                :disabled="isProcessing"
            >
              Nie
            </button>
            <button
                @click="confirmBlockUser"
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                :disabled="isProcessing"
            >
              <span v-if="!isProcessing">Tak, zablokuj</span>
              <Spinner v-else class="w-5 h-5 mx-auto" />
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Modal potwierdzenia usunięcia kolekcji -->
      <BaseModal
        :show="isDeleteCollectionModalOpen"
        title="Potwierdź usunięcie kolekcji"
        @close="closeDeleteCollectionModal"
      >
        <div>
          <p class="text-gray-600 mb-2">
            Czy na pewno chcesz usunąć kolekcję <strong>{{ collectionToDelete?.name }}</strong>?
          </p>
          <p class="text-sm text-gray-500 mb-2">
            Właściciel: {{ collectionToDelete?.owner?.username || 'Nieznany' }}
          </p>
          <p class="text-red-600 text-sm mb-6">
            ⚠️ Ta operacja jest nieodwracalna. Wszystkie przedmioty w kolekcji zostaną trwale usunięte.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <button
                @click="closeDeleteCollectionModal"
                class="btn-gray"
                :disabled="isProcessing"
            >
              Anuluj
            </button>
            <button
                @click="confirmDeleteCollection"
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                :disabled="isProcessing"
            >
              <span v-if="!isProcessing">Tak, usuń</span>
              <Spinner v-else class="w-5 h-5 mx-auto" />
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Modal dodawania kategorii -->
      <BaseModal
        :show="isAddModalOpen"
        title="Nowa kategoria"
        @close="closeAddModal"
      >
        <form @submit.prevent="addCategory" class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 min-h-0 overflow-y-auto p-1">
            <div class="space-y-4">
              <!-- Nazwa i opis -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa kategorii</label>
                <input
                    v-model="newCategoryData.name"
                    type="text"
                    required
                    class="input-field"
                    :disabled="isProcessing"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Opis <span class="text-gray-400 font-normal">(opcjonalne)</span></label>
                <textarea
                    v-model="newCategoryData.description"
                    class="input-field h-24"
                    :disabled="isProcessing"
                ></textarea>
              </div>
              <!-- Atrybuty -->
              <div>
                <h3 class="text-lg font-medium text-gray-700 mb-2">Atrybuty</h3>
                <div
                    v-for="(attr, index) in newCategoryData.attributes"
                    :key="index"
                    class="bg-gray-50 p-4 rounded-lg mb-3 space-y-3"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm text-gray-600 mb-1">Nazwa atrybutu</label>
                      <input
                          v-model="attr.name"
                          type="text"
                          required
                          class="input-field"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-gray-600 mb-1">Typ</label>
                      <select v-model="attr.type" class="input-field" required>
                        <option v-for="type in attributeTypes" :value="type.value" :key="type.value">
                          {{ type.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        v-model="attr.required"
                        :id="`attr-required-${index}`"
                        class="checkbox"
                    />
                    <label :for="`attr-required-${index}`" class="text-sm text-gray-600">
                      Wymagany atrybut
                    </label>
                  </div>
                  <!-- Dla typu select -->
                  <div v-if="attr.type === 'select'" class="space-y-2">
                    <label class="block text-sm text-gray-600">
                      Opcje (oddziel przecinkami)
                    </label>
                    <input
                        v-model="attr.optionsInput"
                        type="text"
                        required
                        class="input-field"
                        @change="updateAddOptions(index, $event.target.value)"
                    />
                  </div>
                  <!-- Przycisk zmiany kolejności -->
                  <div class="flex gap-2">
                    <button type="button" @click="moveAddAttributeUp(index)" class="text-gray-500 hover:text-gray-700 text-sm">
                      ↑
                    </button>
                    <button type="button" @click="moveAddAttributeDown(index)" class="text-gray-500 hover:text-gray-700 text-sm">
                      ↓
                    </button>
                  </div>
                  <button type="button" @click="removeAddAttribute(index)" class="text-red-500 text-sm hover:text-red-700">
                    Usuń atrybut
                  </button>
                </div>
                <button type="button" @click="addNewAttribute" class="btn-secondary mt-2">
                  + Dodaj atrybut
                </button>
              </div>
            </div>
          </div>
        </form>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <button
                type="button"
                @click="closeAddModal"
                class="btn-gray"
                :disabled="isProcessing"
            >
              Anuluj
            </button>
            <button @click="addCategory" class="btn-primary" :disabled="isProcessing">
              <span v-if="!isProcessing">Utwórz kategorię</span>
              <Spinner v-else class="w-5 h-5 mx-auto" />
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Modal edycji kategorii -->
      <BaseModal
        :show="isEditModalOpen"
        title="Edytuj kategorię"
        @close="closeEditModal"
      >
        <form @submit.prevent="saveEditedCategory" class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 min-h-0 overflow-y-auto p-1">
            <div class="space-y-4">
              <!-- Nazwa i opis -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa kategorii</label>
                <input
                    v-model="editedCategory.name"
                    type="text"
                    required
                    class="input-field"
                    :disabled="isProcessing"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Opis <span class="text-gray-400 font-normal">(opcjonalne)</span></label>
                <textarea
                    v-model="editedCategory.description"
                    class="input-field h-24"
                    :disabled="isProcessing"
                ></textarea>
              </div>
              <!-- Atrybuty -->
              <div>
                <h3 class="text-lg font-medium text-gray-700 mb-2">Atrybuty</h3>
                <div
                    v-for="(attr, index) in editedCategory.attributes"
                    :key="index"
                    class="bg-gray-50 p-4 rounded-lg mb-3 space-y-3"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm text-gray-600 mb-1">Nazwa atrybutu</label>
                      <input v-model="attr.name" type="text" required class="input-field" />
                    </div>
                    <div>
                      <label class="block text-sm text-gray-600 mb-1">Typ</label>
                      <select v-model="attr.type" class="input-field" required>
                        <option v-for="type in attributeTypes" :value="type.value" :key="type.value">
                          {{ type.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        v-model="attr.required"
                        :id="`edit-attr-required-${index}`"
                        class="checkbox"
                    />
                    <label :for="`edit-attr-required-${index}`" class="text-sm text-gray-600">
                      Wymagany atrybut
                    </label>
                  </div>
                  <div v-if="attr.type === 'select'" class="space-y-2">
                    <label class="block text-sm text-gray-600">Opcje (oddziel przecinkami)</label>
                    <input
                        v-model="attr.optionsInput"
                        type="text"
                        required
                        class="input-field"
                        @change="updateEditOptions(index, $event.target.value)"
                    />
                  </div>
                  <!-- Przycisk zmiany kolejności -->
                  <div class="flex gap-2">
                    <button type="button" @click="moveEditAttributeUp(index)" class="text-gray-500 hover:text-gray-700 text-sm">↑</button>
                    <button type="button" @click="moveEditAttributeDown(index)" class="text-gray-500 hover:text-gray-700 text-sm">↓</button>
                  </div>
                  <button type="button" @click="removeEditAttribute(index)" class="text-red-500 text-sm hover:text-red-700">
                    Usuń atrybut
                  </button>
                </div>
                <button type="button" @click="addEditAttribute" class="btn-secondary mt-2">
                  + Dodaj atrybut
                </button>
              </div>
            </div>
          </div>
        </form>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <button type="button" @click="closeEditModal" class="btn-gray" :disabled="isProcessing">
              Anuluj
            </button>
            <button @click="saveEditedCategory" class="btn-primary" :disabled="isProcessing">
              <span v-if="!isProcessing">Zapisz zmiany</span>
              <Spinner v-else class="w-5 h-5 mx-auto" />
            </button>
          </div>
        </template>
      </BaseModal>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import CategoryService from '@/services/CategoryService'
import AdminService from '@/services/AdminService'
import CollectionService from '@/services/CollectionService'
import Spinner from '@/components/AppSpinner.vue'
import BaseModal from '@/components/BaseModal.vue'
import { formatDateTime } from '@/utils/dateUtils'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'AdminPanelView',
  components: {
    Spinner,
    PlusIcon,
    TrashIcon,
    BaseModal
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const toast = useToast()

    const categories = ref([])
    const collections = ref([])
    const users = ref([])
    const loading = ref(true)
    const isProcessing = ref(false)
    
    // Paginacja
    const usersPagination = ref({ page: 1, pages: 1, total: 0 })
    const collectionsPagination = ref({ page: 1, pages: 1, total: 0 })
    
    // Wyszukiwanie użytkowników
    const userSearch = ref('')
    let searchTimeout = null
    
    // Modal blokady użytkownika
    const isBlockConfirmModalOpen = ref(false)
    const userToBlock = ref(null)

    // Modal usuwania kolekcji
    const isDeleteCollectionModalOpen = ref(false)
    const collectionToDelete = ref(null)

    const attributeTypes = [
      { value: 'string', label: 'Tekst' },
      { value: 'number', label: 'Liczba' },
      { value: 'date', label: 'Data' },
      { value: 'boolean', label: 'Tak/Nie' },
      { value: 'select', label: 'Lista wyboru' }
    ]

    // Modal dodawania kategorii
    const isAddModalOpen = ref(false)
    const newCategoryData = ref({
      name: '',
      description: '',
      attributes: []
    })
    const isEditModalOpen = ref(false)
    const editedCategory = ref(null)

    // Formatowanie daty
    const formatDate = (dateString) => {
      if (!dateString) return 'Nigdy';
      return formatDateTime(dateString);
    };

    // Ładowanie danych
    const loadData = async () => {
      try {
        const categoriesResponse = await CategoryService.getCategories()
        categories.value = categoriesResponse.data.categories || []
        
        await Promise.all([
          loadUsers(1),
          loadCollections(1)
        ])
      } catch (error) {
        console.error('Błąd ładowania danych:', error)
        toast.error('Problem z pobraniem danych')
      } finally {
        loading.value = false
      }
    }

    // Ładowanie użytkowników
    const loadUsers = async (page = 1) => {
      try {
        const response = await AdminService.getUsers({ 
          page, 
          limit: 20,
          search: userSearch.value || undefined
        })
        users.value = response.data.users || []
        usersPagination.value = response.data.pagination || { page: 1, pages: 1 }
      } catch (error) {
        console.error('Błąd ładowania użytkowników:', error)
        toast.error('Problem z pobraniem listy użytkowników')
      }
    }

    // Ładowanie kolekcji
    const loadCollections = async (page = 1) => {
      try {
        const response = await AdminService.getAllCollections({ page, limit: 20 })
        collections.value = response.data.collections || []
        collectionsPagination.value = response.data.pagination || { page: 1, pages: 1 }
      } catch (error) {
        console.error('Błąd ładowania kolekcji:', error)
        toast.error('Problem z pobraniem kolekcji')
      }
    }

    // Wyszukiwanie użytkowników
    const debouncedSearchUsers = () => {
      if (searchTimeout) clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        loadUsers(1)
      }, 300)
    }

    // Blokowanie użytkownika
    const openBlockConfirmModal = (user) => {
      userToBlock.value = user
      isBlockConfirmModalOpen.value = true
    }

    const closeBlockConfirmModal = () => {
      isBlockConfirmModalOpen.value = false
      userToBlock.value = null
    }

    const confirmBlockUser = async () => {
      if (!userToBlock.value) return

      try {
        isProcessing.value = true
        const response = await AdminService.blockUser(userToBlock.value._id)
        
        toast.success(`Użytkownik ${userToBlock.value.username} został zablokowany. Usunięto ${response.data.deletedCollections} kolekcji.`)
        
        closeBlockConfirmModal()
        await loadUsers(usersPagination.value.page)
        await loadCollections(collectionsPagination.value.page)
      } catch (error) {
        const message = error.response?.data?.message || 'Błąd blokowania użytkownika'
        toast.error(message)
      } finally {
        isProcessing.value = false
      }
    }

    // Odblokowywanie użytkownika
    const unblockUser = async (user) => {
      try {
        isProcessing.value = true
        await AdminService.unblockUser(user._id)
        
        toast.success(`Użytkownik ${user.username} został odblokowany.`)
        await loadUsers(usersPagination.value.page)
      } catch (error) {
        const message = error.response?.data?.message || 'Błąd odblokowywania użytkownika'
        toast.error(message)
      } finally {
        isProcessing.value = false
      }
    }

    // Usuwanie kolekcji
    const openDeleteCollectionModal = (collection) => {
      collectionToDelete.value = collection
      isDeleteCollectionModalOpen.value = true
    }

    const closeDeleteCollectionModal = () => {
      isDeleteCollectionModalOpen.value = false
      collectionToDelete.value = null
    }

    const confirmDeleteCollection = async () => {
      if (!collectionToDelete.value) return

      try {
        isProcessing.value = true
        await CollectionService.deleteCollection(collectionToDelete.value._id)
        
        toast.success(`Kolekcja "${collectionToDelete.value.name}" została usunięta.`)
        
        closeDeleteCollectionModal()
        await loadCollections(collectionsPagination.value.page)
      } catch (error) {
        const message = error.response?.data?.message || 'Błąd usuwania kolekcji'
        toast.error(message)
      } finally {
        isProcessing.value = false
      }
    }

    // Modal dodawania kategorii
    const openAddModal = () => {
      newCategoryData.value = {
        name: '',
        description: '',
        attributes: []
      }
      isAddModalOpen.value = true
    }

    const closeAddModal = () => {
      isAddModalOpen.value = false
    }

    const addNewAttribute = () => {
      newCategoryData.value.attributes.push({
        name: '',
        type: 'string',
        required: false,
        options: [],
        optionsInput: ''
      })
    }

    const removeAddAttribute = (index) => {
      newCategoryData.value.attributes.splice(index, 1)
    }

    const updateAddOptions = (index, value) => {
      newCategoryData.value.attributes[index].options = value.split(',').map(opt => opt.trim()).filter(opt => opt)
    }

    const moveAddAttributeUp = (index) => {
      if (index <= 0) return
      const attrs = newCategoryData.value.attributes;
      [attrs[index - 1], attrs[index]] = [attrs[index], attrs[index - 1]];
    }

    const moveAddAttributeDown = (index) => {
      if (index >= newCategoryData.value.attributes.length - 1) return
      const attrs = newCategoryData.value.attributes;
      [attrs[index], attrs[index + 1]] = [attrs[index + 1], attrs[index]];
    }

    // Dodawanie kategorii
    const addCategory = async () => {
      try {
        isProcessing.value = true

        const categoryData = {
          name: newCategoryData.value.name.trim(),
          description: newCategoryData.value.description.trim(),
          attributes: newCategoryData.value.attributes.map(attr => {
            const cleanedAttr = {
              name: attr.name,
              type: attr.type,
              required: attr.required
            }
            if (attr.type === 'select') {
              cleanedAttr.options = attr.optionsInput.split(',').map(o => o.trim())
            }
            return cleanedAttr
          })
        }

        const response = await CategoryService.createCategory(categoryData)
        categories.value = [...categories.value, response.data.category]
        toast.success('Kategoria dodana pomyślnie!')
        closeAddModal()
      } catch (error) {
        handleError(error, 'Błąd podczas dodawania kategorii')
      } finally {
        isProcessing.value = false
      }
    }

    // Modal edycji kategorii
    const openEditModal = (category) => {
      editedCategory.value = {
        _id: category._id || category.id,
        name: category.name,
        description: category.description,
        attributes: category.attributes.map(attr => ({
          ...attr,
          optionsInput: attr.options ? attr.options.join(', ') : ''
        }))
      }
      isEditModalOpen.value = true
    }

    const closeEditModal = () => {
      isEditModalOpen.value = false
      editedCategory.value = null
    }

    const addEditAttribute = () => {
      editedCategory.value.attributes.push({
        name: '',
        type: 'string',
        required: false,
        options: [],
        optionsInput: ''
      })
    }

    const removeEditAttribute = (index) => {
      editedCategory.value.attributes.splice(index, 1)
    }

    const updateEditOptions = (index, value) => {
      editedCategory.value.attributes[index].options = value.split(',').map(opt => opt.trim()).filter(opt => opt)
    }

    const moveEditAttributeUp = (index) => {
      if (index <= 0) return
      const attrs = editedCategory.value.attributes;
      [attrs[index - 1], attrs[index]] = [attrs[index], attrs[index - 1]];
    }

    const moveEditAttributeDown = (index) => {
      if (index >= editedCategory.value.attributes.length - 1) return
      const attrs = editedCategory.value.attributes;
      [attrs[index], attrs[index + 1]] = [attrs[index + 1], attrs[index]];
    }

    const saveEditedCategory = async () => {
      try {
        isProcessing.value = true

        const updateData = {
          name: editedCategory.value.name,
          description: editedCategory.value.description,
          attributes: editedCategory.value.attributes.map(attr => {
            const cleanedAttr = { ...attr }
            if (cleanedAttr.type === 'select') {
              cleanedAttr.options = cleanedAttr.optionsInput.split(',').map(o => o.trim())
              delete cleanedAttr.optionsInput
            }
            return cleanedAttr
          })
        }

        const response = await CategoryService.updateCategory(editedCategory.value._id, updateData)

        categories.value = categories.value.map(c =>
            (c._id === editedCategory.value._id || c.id === editedCategory.value._id)
                ? response.data.category
                : c
        )

        closeEditModal()
        toast.success('Kategoria zaktualizowana pomyślnie!')
      } catch (error) {
        handleError(error, 'Błąd aktualizacji kategorii')
      } finally {
        isProcessing.value = false
      }
    }

    const handleError = (error, defaultMessage) => {
      const errorMap = {
        CATEGORY_NOT_FOUND: 'Kategoria nie istnieje',
        DUPLICATE_CATEGORY: 'Kategoria o tej nazwie już istnieje',
        VALIDATION_ERROR: 'Nieprawidłowe dane formularza'
      }

      const code = error.response?.data?.code;
      const message = errorMap[code] || error.response?.data?.message || defaultMessage;
      toast.error(message);
      if (error.response?.status === 401) {
        store.dispatch('auth/logout');
        router.push('/login');
      }
    };

    // Sprawdzenie uprawnień administratora
    const checkAdminAccess = () => {
      if (!store.getters['auth/isAdmin']) {
        toast.error('Brak uprawnień administratora');
        router.push({ name: 'Home' });
      }
    };

    onMounted(() => {
      checkAdminAccess();
      loadData();
    });

    return {
      categories,
      collections,
      users,
      loading,
      attributeTypes,
      isProcessing,
      usersPagination,
      collectionsPagination,
      userSearch,
      isBlockConfirmModalOpen,
      userToBlock,
      isAddModalOpen,
      newCategoryData,
      isEditModalOpen,
      editedCategory,
      formatDate,
      loadUsers,
      loadCollections,
      debouncedSearchUsers,
      openBlockConfirmModal,
      closeBlockConfirmModal,
      confirmBlockUser,
      unblockUser,
      isDeleteCollectionModalOpen,
      collectionToDelete,
      openDeleteCollectionModal,
      closeDeleteCollectionModal,
      confirmDeleteCollection,
      openAddModal,
      closeAddModal,
      addNewAttribute,
      removeAddAttribute,
      updateAddOptions,
      moveAddAttributeUp,
      moveAddAttributeDown,
      addCategory,
      openEditModal,
      closeEditModal,
      addEditAttribute,
      removeEditAttribute,
      updateEditOptions,
      moveEditAttributeUp,
      moveEditAttributeDown,
      saveEditedCategory
    };
  }
};
</script>

<style scoped>


.checkbox {
  @apply w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors;
}

.btn-gray {
  @apply bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors;
}
</style>
