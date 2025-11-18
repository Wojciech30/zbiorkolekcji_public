<template>
  <div class="container mx-auto p-4">
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800">Panel Administratora</h1>
      <p class="text-gray-600 mt-2">Zarządzaj kategoriami i kolekcjami użytkowników</p>
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
              <div class="text-xs text-gray-500">
                <!-- Usunięto informację o wymagalności pola oraz pole wyświetlania -->
              </div>
            </div>
            <div class="flex gap-3">
              <button
                  @click="openEditModal(category)"
                  class="text-blue-600 hover:text-blue-800 transition-colors"
                  :disabled="isProcessing"
              >
                Edytuj
              </button>
              <button
                  @click="deleteCategory(category._id || category.id)"
                  class="text-red-600 hover:text-red-800 transition-colors"
                  :disabled="isProcessing"
              >
                Usuń
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Zarządzanie kolekcjami -->
      <section class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">Wszystkie kolekcje</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
              v-for="collection in collections"
              :key="collection._id"
              class="p-4 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h3 class="font-bold text-lg mb-2">{{ collection.name }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ collection.description || "Brak opisu" }}</p>
            <div class="text-xs text-gray-500">
              <p>Kategoria: {{ collection.category?.name || "Nieprzypisane" }}</p>
              <p>Autor: {{ collection.owner?.username || "Nieznany" }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal dodawania kategorii -->
      <div v-if="isAddModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style="max-height: 90vh;">
          <div class="p-6 border-b border-gray-200 flex-shrink-0">
            <h3 class="text-2xl font-semibold">Nowa kategoria</h3>
          </div>
          <form @submit.prevent="addCategory" class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 min-h-0 overflow-y-auto p-6">
              <div class="space-y-4">
                <!-- Nazwa i opis -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa kategorii *</label>
                  <input
                      v-model="newCategoryData.name"
                      type="text"
                      required
                      class="input-field"
                      :disabled="isProcessing"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                      v-model="newCategoryData.description"
                      class="input-field h-24"
                      :disabled="isProcessing"
                  ></textarea>
                </div>
                <!-- Usunięto opcję ustawiania wymagalności pola "Nazwa przedmiotu" -->
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
                        <label class="block text-sm text-gray-600 mb-1">Nazwa atrybutu *</label>
                        <input
                            v-model="attr.name"
                            type="text"
                            required
                            class="input-field"
                        />
                      </div>
                      <div>
                        <label class="block text-sm text-gray-600 mb-1">Typ *</label>
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
                        Opcje (oddziel przecinkami) *
                      </label>
                      <input
                          v-model="attr.optionsInput"
                          type="text"
                          required
                          class="input-field"
                          @change="updateAddOptions(index, $event.target.value)"
                      />
                    </div>
                    <!-- Usunięto radio button do wyboru pola wyświetlania -->
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
            <div class="p-6 border-t border-gray-200 flex-shrink-0">
              <div class="flex justify-end gap-3">
                <button
                    type="button"
                    @click="closeAddModal"
                    class="btn-gray"
                    :disabled="isProcessing"
                >
                  Anuluj
                </button>
                <button type="submit" class="btn-primary" :disabled="isProcessing">
                  <span v-if="!isProcessing">Utwórz kategorię</span>
                  <Spinner v-else class="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal edycji kategorii -->
      <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style="max-height: 90vh;">
          <div class="p-6 border-b border-gray-200 flex-shrink-0">
            <h3 class="text-2xl font-semibold">Edytuj kategorię</h3>
          </div>
          <form @submit.prevent="saveEditedCategory" class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 min-h-0 overflow-y-auto p-6">
              <div class="space-y-4">
                <!-- Nazwa i opis -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa kategorii *</label>
                  <input
                      v-model="editedCategory.name"
                      type="text"
                      required
                      class="input-field"
                      :disabled="isProcessing"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                      v-model="editedCategory.description"
                      class="input-field h-24"
                      :disabled="isProcessing"
                  ></textarea>
                </div>
                <!-- Usunięto opcję ustawiania wymagalności pola "Nazwa przedmiotu" -->
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
                        <label class="block text-sm text-gray-600 mb-1">Nazwa atrybutu *</label>
                        <input v-model="attr.name" type="text" required class="input-field" />
                      </div>
                      <div>
                        <label class="block text-sm text-gray-600 mb-1">Typ *</label>
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
                      <label class="block text-sm text-gray-600">Opcje (oddziel przecinkami) *</label>
                      <input
                          v-model="attr.optionsInput"
                          type="text"
                          required
                          class="input-field"
                          @change="updateEditOptions(index, $event.target.value)"
                      />
                    </div>
                    <!-- Usunięto radio button do wyboru pola wyświetlania -->
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
            <div class="p-6 border-t border-gray-200 flex-shrink-0">
              <div class="flex justify-end gap-3">
                <button type="button" @click="closeEditModal" class="btn-gray" :disabled="isProcessing">
                  Anuluj
                </button>
                <button type="submit" class="btn-primary" :disabled="isProcessing">
                  <span v-if="!isProcessing">Zapisz zmiany</span>
                  <Spinner v-else class="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import CategoryService from '@/services/CategoryService'
import CollectionService from '@/services/CollectionService'
import Spinner from '@/components/AppSpinner.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'AdminPanelView',
  components: {
    Spinner,
    PlusIcon
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const toast = useToast()

    const categories = ref([])
    const collections = ref([])
    const loading = ref(true)
    const isProcessing = ref(false)
    const attributeTypes = [
      { value: 'string', label: 'Tekst' },
      { value: 'number', label: 'Liczba' },
      { value: 'date', label: 'Data' },
      { value: 'boolean', label: 'Tak/Nie' },
      { value: 'select', label: 'Lista wyboru' }
    ]

    // Modal dodawania kategorii – usunięto requireItemName i displayAttribute
    const isAddModalOpen = ref(false)
    const newCategoryData = ref({
      name: '',
      description: '',
      attributes: []
    })

    // Modal edycji kategorii – usunięto requireItemName i displayAttribute
    const isEditModalOpen = ref(false)
    const editedCategory = ref(null)

    const loadData = async () => {
      try {
        const [categoriesResponse, collectionsResponse] = await Promise.allSettled([
          CategoryService.getCategories(),
          CollectionService.getCollections()
        ])

        categories.value = categoriesResponse.status === 'fulfilled'
            ? categoriesResponse.value.data.categories
            : []

        collections.value = collectionsResponse.status === 'fulfilled'
            ? collectionsResponse.value.data.collections
            : []
      } catch (error) {
        console.error('Błąd ładowania danych:', error)
        toast.error('Problem z pobraniem danych')
      } finally {
        loading.value = false
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
        type: 'text',
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
        type: 'text',
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

    const deleteCategory = async (id) => {
      if (!confirm('Usunięcie kategorii spowoduje również usunięcie powiązanych kolekcji! Kontynuować?')) return

      isProcessing.value = true
      try {
        await CategoryService.deleteCategory(id)
        categories.value = categories.value.filter(c => c._id !== id && c.id !== id)
        collections.value = collections.value.filter(c => (c.category?._id !== id && c.category?.id !== id))
        toast.success('Kategoria i powiązane kolekcje zostały usunięte')
      } catch (error) {
        const message = error.response?.data?.message || 'Nie można usunąć kategorii w użyciu'
        toast.error(message)
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
      loading,
      attributeTypes,
      isProcessing,
      isAddModalOpen,
      newCategoryData,
      isEditModalOpen,
      editedCategory,
      openAddModal,
      closeAddModal,
      addNewAttribute,
      removeAddAttribute,
      updateAddOptions,
      moveAddAttributeUp,
      moveAddAttributeDown,
      addCategory,
      deleteCategory,
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
.input-field {
  @apply w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors;
}

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
