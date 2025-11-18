<template>
  <div class="container mx-auto p-4">
    <header>
      <h1 class="text-4xl font-bold text-gray-800 mb-2">{{ category.name }}</h1>
      <p class="text-gray-600 text-lg italic" v-if="category.description">{{ category.description }}</p>
      <p class="text-gray-500 text-sm" v-else>Brak opisu kategorii</p>
    </header>

    <section class="mt-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold text-gray-700">
          Kolekcje w tej kategorii
          <span class="text-gray-500 text-lg">({{ collections.length }})</span>
        </h2>

        <!-- Paginacja -->
        <div v-if="pagination.pages > 1" class="flex gap-2">
          <button
              @click="changePage(-1)"
              :disabled="pagination.page === 1"
              class="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition"
          >
            &lt;
          </button>
          <span class="px-3 py-1 bg-gray-100 rounded">
            Strona {{ pagination.page }} z {{ pagination.pages }}
          </span>
          <button
              @click="changePage(1)"
              :disabled="pagination.page >= pagination.pages"
              class="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition"
          >
            &gt;
          </button>
        </div>
      </div>

      <!-- Ładowanie -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Ładowanie kolekcji...</p>
      </div>

      <!-- Brak kolekcji -->
      <div v-else-if="collections.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
        <p class="text-gray-500">Brak kolekcji w tej kategorii</p>
      </div>

      <!-- Lista kolekcji -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
            v-for="collection in collections"
            :key="collection._id"
            class="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
        >
          <router-link
              :to="`/collections/${collection._id}`"
              class="block group"
          >
            <div class="mb-4 relative">
              <img
                  :src="collection.coverImage || '/placeholder-collection.jpg'"
                  alt="Okładka kolekcji"
                  class="w-full h-48 object-cover rounded-lg mb-3"
              >
            </div>

            <h3 class="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition">
              {{ collection.name }}
            </h3>
            <p class="text-gray-600 mt-2 line-clamp-2">{{ collection.description }}</p>

            <div class="mt-4 flex items-center text-sm text-gray-500">
              <span class="mx-2">•</span>
              <time :datetime="collection.createdAt">
                {{ formatDate(collection.createdAt) }}
              </time>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import CategoryService from '@/services/CategoryService'

export default {
  data() {
    return {
      category: {},
      collections: [],
      isLoading: true,
      pagination: {
        page: 1,
        limit: 9,
        total: 0,
        pages: 1
      }
    }
  },
  watch: {
    '$route.params.id': {
      handler: 'loadData',
      immediate: true
    }
  },
  methods: {
    async loadData() {
      try {
        this.isLoading = true
        const categoryId = this.$route.params.id

        if (!this.validateCategoryId(categoryId)) {
          this.$toast.error('Nieprawidłowy format ID kategorii')
          this.isLoading = false
          return this.$router.push('/').catch(() => {})
        }

        const [categoryRes, collectionsRes] = await Promise.all([
          CategoryService.getCategory(categoryId),
          CategoryService.getCategoryCollections(categoryId, {
            page: this.pagination.page,
            limit: this.pagination.limit
          })
        ])

        if (!categoryRes?.data?.data || !collectionsRes?.data?.data?.collections) {
          throw new Error('Nieprawidłowa struktura odpowiedzi API')
        }

        this.category = categoryRes.data.data
        this.collections = collectionsRes.data.data.collections
        this.pagination = {
          ...this.pagination,
          total: collectionsRes.data.pagination?.total || 0,
          pages: collectionsRes.data.pagination?.pages || 1
        }

      } catch (error) {
        this.handleError(error)
      } finally {
        this.isLoading = false
      }
    },
    validateCategoryId(id) {
      return /^[0-9a-fA-F]{24}$/.test(id)
    },
    formatDate(isoString) {
      return new Date(isoString).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    changePage(delta) {
      const newPage = this.pagination.page + delta
      if (newPage > 0 && newPage <= this.pagination.pages) {
        this.pagination.page = newPage
        this.loadData()
      }
    },
    handleError(error) {
      console.error('Błąd:', error)

      if (error.response?.status === 404) {
        this.$router.replace('/not-found').catch(() => {})
      } else if (error.response?.status === 400) {
        this.$toast.error('Nieprawidłowe zapytanie')
      } else {
        this.$toast.error('Błąd połączenia z serwerem')
      }

      this.isLoading = false
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>