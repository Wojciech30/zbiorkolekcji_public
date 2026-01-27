<template>
  <div class="container mx-auto p-4">
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800">Moje Kolekcje</h1>
      <p class="text-gray-600 mt-2">Zarządzaj swoimi kolekcjami</p>
    </header>

    <div v-if="loading" class="text-center py-8">
      <Spinner class="w-12 h-12 mx-auto text-blue-500" />
    </div>

    <div v-else>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div class="stats-container">
          <span class="stat-item">
            Łącznie kolekcji: <strong>{{ pagination.total }}</strong>
          </span>
          <span class="stat-item" v-if="pagination.pages > 1">
            Strona: <strong>{{ pagination.page }}/{{ pagination.pages }}</strong>
          </span>
        </div>

        <button
            @click="openAddModal"
            class="btn-primary flex items-center gap-2"
        >
          <PlusIcon class="w-5 h-5" />
          Nowa Kolekcja
        </button>
      </div>

      <div v-if="collections.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
        <p class="text-gray-500">Nie masz jeszcze żadnych kolekcji</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
            v-for="collection in collections"
            :key="collection._id"
            class="group relative"
        >
          <CollectionCard
              :data="collection"
              type="collection"
              :showStats="true"
              :showOwner="true"
          >
            <template #actions>
              <button
                  @click.stop.prevent="openEditModal(collection)"
                  class="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                  title="Edytuj"
              >
                <PencilIcon class="w-5 h-5" />
              </button>
              <button
                  @click.stop.prevent="openDeleteModal(collection)"
                  class="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  title="Usuń"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </template>
          </CollectionCard>
        </div>
      </div>

      <!-- Paginacja wyświetlana tylko, gdy jest więcej niż jedna strona -->
      <div v-if="pagination.pages > 1" class="mt-8 flex justify-center gap-2">
        <button
            @click="changePage(-1)"
            :disabled="pagination.page === 1"
            class="btn-pagination"
        >
          &lt;
        </button>

        <span class="px-4 py-2 text-gray-700">
          Strona {{ pagination.page }} z {{ pagination.pages }}
        </span>

        <button
            @click="changePage(1)"
            :disabled="pagination.page >= pagination.pages"
            class="btn-pagination"
        >
          &gt;
        </button>
      </div>
    </div>

    <!-- Modal dodawania kolekcji -->
    <BaseModal
      :show="isAddModalOpen"
      title="Nowa kolekcja"
      @close="closeAddModal"
    >
      <form @submit.prevent="submitCollection" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 overflow-y-auto p-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
              <input
                  v-model="newCollection.name"
                  type="text"
                  required
                  class="input-field"
                  :disabled="isProcessing"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Opis</label>
              <textarea
                  v-model="newCollection.description"
                  class="input-field h-24"
                  :disabled="isProcessing"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
              <select
                  v-model="newCollection.category"
                  class="input-field"
                  required
                  :disabled="isProcessing"
              >
                <option v-for="category in categories" :value="category._id" :key="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prywatność *</label>
              <div class="space-y-2">
                <label class="flex items-center space-x-2">
                  <input
                      type="radio"
                      v-model="newCollection.privacy"
                      value="public"
                      class="radio"
                  />
                  <span>Publiczna</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                      type="radio"
                      v-model="newCollection.privacy"
                      value="private"
                      class="radio"
                  />
                  <span>Prywatna</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zdjęcie okładki</label>
              <ImageUploader v-model="newCollection.coverImage" />
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
          <button
              @click="submitCollection"
              class="btn-primary"
              :disabled="isProcessing"
          >
            <span v-if="!isProcessing">Utwórz kolekcję</span>
            <Spinner v-else class="w-5 h-5 mx-auto" />
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal edycji kolekcji -->
    <BaseModal
      :show="isEditModalOpen"
      title="Edytuj kolekcję"
      @close="closeEditModal"
    >
      <form @submit.prevent="submitEdit" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 overflow-y-auto p-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
              <input
                  v-model="editingCollection.name"
                  type="text"
                  required
                  class="input-field"
                  :disabled="isProcessing"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Opis</label>
              <textarea
                  v-model="editingCollection.description"
                  class="input-field h-24"
                  :disabled="isProcessing"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
              <select
                  v-model="editingCollection.category"
                  class="input-field bg-gray-100 cursor-not-allowed"
                  disabled
              >
                <option v-for="category in categories" :value="category._id" :key="category._id">
                  {{ category.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Kategoria nie może być zmieniona po utworzeniu kolekcji.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prywatność *</label>
              <div class="space-y-2">
                <label class="flex items-center space-x-2">
                  <input
                      type="radio"
                      v-model="editingCollection.privacy"
                      value="public"
                      class="radio"
                  />
                  <span>Publiczna</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                      type="radio"
                      v-model="editingCollection.privacy"
                      value="private"
                      class="radio"
                  />
                  <span>Prywatna</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zdjęcie okładki</label>
              <ImageUploader v-model="editingCollection.coverImage" />
            </div>

            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="hideDescription"
                v-model="editingCollection.hideDescription"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <label for="hideDescription" class="text-sm text-gray-700">
                Ukryj opis kolekcji
              </label>
            </div>
          </div>
        </div>
      </form>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
              type="button"
              @click="closeEditModal"
              class="btn-gray"
              :disabled="isProcessing"
          >
            Anuluj
          </button>
          <button
              @click="submitEdit"
              class="btn-primary"
              :disabled="isProcessing"
          >
            <span v-if="!isProcessing">Zapisz zmiany</span>
            <Spinner v-else class="w-5 h-5 mx-auto" />
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal potwierdzenia usuwania -->
    <BaseModal
      :show="isDeleteModalOpen"
      title="Potwierdź usunięcie kolekcji"
      @close="closeDeleteModal"
    >
      <div>
        <p class="mb-4">
          Aby usunąć kolekcję "<strong>{{ deletingCollection?.name }}</strong>", wpisz jej nazwę:
        </p>

        <input
            v-model="deleteConfirmation"
            type="text"
            class="input-field mb-4"
            placeholder="Wpisz nazwę kolekcji"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="closeDeleteModal" class="btn-gray">
            Anuluj
          </button>
          <button
              @click="confirmDelete"
              class="btn-danger"
              :disabled="deleteConfirmation !== deletingCollection?.name"
          >
            Usuń
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import CollectionService from '@/services/CollectionService'
import CategoryService from '@/services/CategoryService'
import Spinner from '@/components/AppSpinner.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import CollectionCard from '@/components/CollectionCard.vue'
import BaseModal from '@/components/BaseModal.vue'
import { getImageUrl } from '@/utils/imageUrl'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'CollectionsView',
  components: {
    Spinner,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ImageUploader,
    CollectionCard,
    BaseModal
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const toast = useToast()
    const loading = ref(true)
    const isProcessing = ref(false)
    const isAddModalOpen = ref(false)
    const categories = ref([])
    const isDeleteModalOpen = ref(false)
    const deletingCollection = ref(null)
    const deleteConfirmation = ref('')

    const collections = ref([])
    const pagination = ref({
      page: 1,
      limit: 9,
      total: 0,
      pages: 1
    })

    const newCollection = ref({
      name: '',
      description: '',
      category: '',
      privacy: 'public',
      coverImage: null
    })

    const isEditModalOpen = ref(false)
    const editingCollection = ref({
      _id: '',
      name: '',
      description: '',
      category: '',
      privacy: 'public',
      coverImage: '',
      hideDescription: false
    })

    const loadCollections = async () => {
      try {
        loading.value = true
        const response = await CollectionService.getUserCollections({
          page: pagination.value.page,
          limit: pagination.value.limit
        })

        collections.value = response.data.collections
        pagination.value = {
          page: response.data.page,
          limit: pagination.value.limit,
          total: response.data.total,
          pages: Math.ceil(response.data.total / pagination.value.limit)
        }
      } catch (error) {
        handleError(error, 'Błąd pobierania kolekcji')
      } finally {
        loading.value = false
      }
    }

    const openAddModal = async () => {
      try {
        const response = await CategoryService.getCategories()
        categories.value = response.data.categories
        isAddModalOpen.value = true
      } catch (error) {
        toast.error('Błąd ładowania kategorii')
      }
    }

    const closeAddModal = () => {
      isAddModalOpen.value = false
      newCollection.value = {
        name: '',
        description: '',
        category: '',
        privacy: 'public',
        coverImage: null
      }
    }


    const submitCollection = async () => {
      try {
        isProcessing.value = true

        // ImageUploader returns URL string after upload, so we send JSON instead of FormData
        const payload = {
          name: newCollection.value.name,
          description: newCollection.value.description,
          category: newCollection.value.category,
          privacy: newCollection.value.privacy
        }
        
        if (newCollection.value.coverImage) {
          payload.coverImage = newCollection.value.coverImage
        }

        await CollectionService.addCollection(payload)
        toast.success('Kolekcja utworzona pomyślnie!')

        pagination.value.page = 1
        await loadCollections()

        closeAddModal()
      } catch (error) {
        const message = error.response?.data?.message || 'Błąd podczas tworzenia kolekcji'
        toast.error(message)
      } finally {
        isProcessing.value = false
      }
    }

    const openEditModal = async (collection) => {
      try {
        if (categories.value.length === 0) {
          const response = await CategoryService.getCategories()
          categories.value = response.data.categories
        }
        editingCollection.value = {
          _id: collection._id,
          name: collection.name,
          description: collection.description || '',
          category: collection.category?._id || '',
          privacy: collection.privacy,
          coverImage: collection.coverImage || '',
          hideDescription: collection.hideDescription || false
        }
        isEditModalOpen.value = true
      } catch (error) {
        toast.error('Błąd podczas ładowania danych do edycji')
      }
    }

    const closeEditModal = () => {
      isEditModalOpen.value = false
      editingCollection.value = {
        _id: '',
        name: '',
        description: '',
        category: '',
        privacy: 'public',
        coverImage: '',
        hideDescription: false
      }
    }

    const submitEdit = async () => {
      try {
        isProcessing.value = true

        const updates = {
          name: editingCollection.value.name,
          description: editingCollection.value.description,
          privacy: editingCollection.value.privacy,
          hideDescription: editingCollection.value.hideDescription
        }

        if (editingCollection.value.coverImage) {
          updates.coverImage = editingCollection.value.coverImage
        }

        const response = await CollectionService.updateCollection(
            editingCollection.value._id,
            updates
        )

        const index = collections.value.findIndex(c => c._id === editingCollection.value._id)
        if (index !== -1) {
          collections.value.splice(index, 1, response.data.collection)
        }

        toast.success('Kolekcja zaktualizowana!')
        closeEditModal()
      } catch (error) {
        const message = error.response?.data?.message || 'Błąd podczas aktualizacji kolekcji'
        toast.error(message)
      } finally {
        isProcessing.value = false
      }
    }

    const changePage = (delta) => {
      const newPage = pagination.value.page + delta
      if (newPage > 0 && newPage <= pagination.value.pages) {
        pagination.value.page = newPage
        loadCollections()
      }
    }

    const openDeleteModal = (collection) => {
      deletingCollection.value = collection
      isDeleteModalOpen.value = true
    }

    const closeDeleteModal = () => {
      isDeleteModalOpen.value = false
      deletingCollection.value = null
      deleteConfirmation.value = ''
    }

    const confirmDelete = async () => {
      try {
        isProcessing.value = true
        await CollectionService.deleteCollection(deletingCollection.value._id)

        collections.value = collections.value.filter(c => c._id !== deletingCollection.value._id)
        toast.success('Kolekcja została usunięta')
        closeDeleteModal()
        window.location.reload()
      } catch (error) {
        handleError(error, 'Błąd usuwania kolekcji')
      } finally {
        isProcessing.value = false
      }
    }

    const handleError = (error, defaultMessage) => {
      const message = error.response?.data?.message || defaultMessage
      toast.error(message)
      if (error.response?.status === 401) {
        store.dispatch('auth/logout')
        router.push('/login')
      }
    }

    onMounted(async () => {
      if (!store.getters['auth/isAuthenticated']) {
        await router.push({ name: 'Login' })
        return
      }
      await loadCollections()
    })

    return {
      loading,
      collections,
      pagination,
      isAddModalOpen,
      categories,
      newCollection,
      isProcessing,
      isEditModalOpen,
      editingCollection,
      isDeleteModalOpen,
      deletingCollection,
      deleteConfirmation,
      openAddModal,
      closeAddModal,
      submitCollection,
      changePage,
      openEditModal,
      closeEditModal,
      submitEdit,
      openDeleteModal,
      closeDeleteModal,
      confirmDelete,
      getImageUrl
    }
  }
}
</script>

<style scoped>
.stats-container {
  @apply flex gap-4 text-sm text-gray-600;
}

.stat-item {
  @apply bg-gray-100 px-3 py-1 rounded-md;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center;
}

.btn-pagination {
  @apply px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}


.radio {
  @apply text-blue-600 focus:ring-blue-500;
}

.btn-gray {
  @apply bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors;
}
</style>
