<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Zbiór Kolekcji
        </h1>
        <p class="hero-subtitle">
          Twórz, zarządzaj i dziel się swoimi kolekcjami ze światem
        </p>

        <!-- Stats Banner -->
        <div v-if="stats" class="stats-banner">
          <div class="stat-box">
            <span class="stat-number">{{ stats.collections || 0 }}</span>
            <span class="stat-label">Kolekcji</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ stats.items || 0 }}</span>
            <span class="stat-label">Przedmiotów</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ stats.users || 0 }}</span>
            <span class="stat-label">Użytkowników</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12">
      
      <!-- Search Section -->
      <section class="search-section">
        <div class="search-container">
          <MagnifyingGlassIcon class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Wyszukaj kategorię..."
            class="search-input"
          />
        </div>
      </section>

      <!-- Categories Section -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">Kategorie</h2>
          <p class="section-subtitle">Przeglądaj kolekcje według kategorii</p>
        </div>

        <div v-if="isLoadingCategories" class="loading-state">
          <div class="spinner"></div>
          <span>Ładowanie kategorii...</span>
        </div>

        <div v-else-if="filteredCategories.length === 0" class="empty-state">
          <FolderIcon class="w-12 h-12 text-gray-400" />
          <p>Brak kategorii do wyświetlenia</p>
        </div>

        <div v-else class="categories-grid">
          <router-link
            v-for="category in filteredCategories"
            :key="category._id"
            :to="`/categories/${category._id}/collections`"
            class="category-card"
          >
            <div class="category-icon">
              <FolderIcon class="w-8 h-8" />
            </div>
            <h3 class="category-name">{{ category.name }}</h3>
            <p class="category-description">{{ getCategorySubtitle(category) }}</p>
          </router-link>
        </div>
      </section>

      <!-- Popular Collections Section -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">Najpopularniejsze kolekcje</h2>
          <p class="section-subtitle">Odkryj najczęściej oglądane kolekcje</p>
        </div>

        <div v-if="isLoadingPopular" class="loading-state">
          <div class="spinner"></div>
          <span>Ładowanie kolekcji...</span>
        </div>

        <div v-else-if="popularCollections.length === 0" class="empty-state">
          <ArchiveBoxIcon class="w-12 h-12 text-gray-400" />
          <p>Brak kolekcji do wyświetlenia</p>
        </div>

        <div v-else class="collections-grid">
          <CollectionCard
            v-for="collection in popularCollections"
            :key="collection._id"
            :data="collection"
            type="collection"
            :showStats="true"
            :showOwner="true"
            :hideBadge="true"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { MagnifyingGlassIcon, FolderIcon, ArchiveBoxIcon } from '@heroicons/vue/24/outline'
import CategoryService from '@/services/CategoryService'
import CollectionService from '@/services/CollectionService'
import CollectionCard from '@/components/CollectionCard.vue'

export default {
  name: 'HomeView',

  components: {
    MagnifyingGlassIcon,
    FolderIcon,
    ArchiveBoxIcon,
    CollectionCard
  },

  setup() {
    const store = useStore()
    
    const categories = ref([])
    const popularCollections = ref([])
    const searchQuery = ref('')
    const debouncedSearchQuery = ref('')
    const isLoadingCategories = ref(true)
    const isLoadingPopular = ref(true)
    const stats = ref(null)

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])

    // Debounce search query (300ms delay, minimum 3 characters)
    let debounceTimeout = null
    watch(searchQuery, (newValue) => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        // Only search if empty or at least 3 characters
        if (newValue.trim().length === 0 || newValue.trim().length >= 3) {
          debouncedSearchQuery.value = newValue
        }
      }, 300)
    })

    const filteredCategories = computed(() => {
      const query = debouncedSearchQuery.value.trim().toLowerCase()
      if (!query) return categories.value
      return categories.value.filter(category =>
        category.name.toLowerCase().includes(query)
      )
    })

    const loadCategories = async () => {
      isLoadingCategories.value = true
      try {
        const response = await CategoryService.getCategories()
        categories.value = response.data.categories || []
      } catch (error) {
        console.error('Błąd pobierania kategorii:', error)
      } finally {
        isLoadingCategories.value = false
      }
    }

    const loadPopularCollections = async () => {
      isLoadingPopular.value = true
      try {
        const response = await CollectionService.getPopularCollections()
        popularCollections.value = response.data.collections || []
      } catch (error) {
        console.error('Błąd pobierania kolekcji:', error)
      } finally {
        isLoadingPopular.value = false
      }
    }

    const loadStats = async () => {
      try {
        const response = await CollectionService.getGlobalStats()
        const data = response.data.stats
        stats.value = {
          collections: data.collections || 0,
          items: data.items || 0,
          users: data.users || 0
        }
      } catch (error) {
        console.error('Błąd pobierania statystyk:', error)
        stats.value = { collections: 0, items: 0, users: 0 }
      }
    }

    onMounted(async () => {
      await Promise.all([loadCategories(), loadPopularCollections()])
      await loadStats()
    })

    const getCategorySubtitle = (category) => {
      if (category.description) return category.description
      const count = category.publicCollectionsCount || 0
      if (count === 0) return 'Brak kolekcji'
      if (count === 1) return '1 kolekcja'
      if (count >= 2 && count <= 4) return `${count} kolekcje`
      return `${count} kolekcji`
    }

    return {
      categories,
      popularCollections,
      searchQuery,
      isLoadingCategories,
      isLoadingPopular,
      filteredCategories,
      isAuthenticated,
      stats,
      getCategorySubtitle
    }
  }
}
</script>

<style scoped>
/* Hero Section */
.hero-section {
  @apply relative py-20 px-4 text-center text-white overflow-hidden;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #6366F1 100%);
}

.hero-section::before {
  content: '';
  @apply absolute inset-0 opacity-10;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-content {
  @apply relative z-10 max-w-4xl mx-auto;
}

.hero-title {
  @apply text-5xl md:text-6xl font-extrabold mb-4 tracking-tight;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  @apply text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto;
}

.hero-actions {
  @apply flex flex-wrap justify-center gap-4 mb-12;
}

.btn-hero-primary {
  @apply px-8 py-3 bg-white text-blue-600 font-semibold rounded-full
         hover:bg-gray-100 transition-all duration-300 shadow-lg
         hover:shadow-xl hover:-translate-y-0.5;
}

.btn-hero-secondary {
  @apply px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-full
         hover:bg-white/10 transition-all duration-300;
}

.stats-banner {
  @apply flex justify-center gap-8 md:gap-16;
}

.stat-box {
  @apply flex flex-col items-center;
}

.stat-number {
  @apply text-3xl md:text-4xl font-bold;
}

.stat-label {
  @apply text-sm opacity-80;
}

/* Search Section */
.search-section {
  @apply -mt-8 mb-12;
}

.search-container {
  @apply relative max-w-xl mx-auto;
}

.search-icon {
  @apply absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400;
}

.search-input {
  @apply w-full pl-12 pr-4 py-4 bg-white rounded-full shadow-lg border-0
         focus:ring-4 focus:ring-blue-100 focus:outline-none
         text-gray-800 placeholder-gray-400 transition-all;
}

/* Content Sections */
.content-section {
  @apply mb-16;
}

.section-header {
  @apply text-center mb-8;
}

.section-title {
  @apply text-3xl font-bold text-gray-800;
}

.section-subtitle {
  @apply text-gray-600 mt-2;
}

/* Loading & Empty States */
.loading-state {
  @apply flex flex-col items-center gap-4 py-12 text-gray-500;
}

.spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin;
}

.empty-state {
  @apply flex flex-col items-center gap-4 py-12 text-gray-500;
}

/* Categories Grid */
.categories-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.category-card {
  @apply p-6 bg-white rounded-xl border border-gray-100 shadow-sm
         hover:shadow-lg hover:border-blue-200 transition-all duration-300
         hover:-translate-y-1 text-center;
}

.category-icon {
  @apply w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-600;
}

.category-name {
  @apply font-bold text-gray-800 mb-2;
}

.category-description {
  @apply text-sm text-gray-500 line-clamp-2;
}

/* Collections Grid */
.collections-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Section CTA */
.section-cta {
  @apply text-center mt-8;
}

.btn-outline {
  @apply inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-full
         hover:bg-blue-600 hover:text-white transition-all duration-300;
}

/* Line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
