<!--
  @view UserProfileView
  @description Publiczny profil innego użytkownika.
  Wyświetla: avatar, username, publiczne kolekcje, statystyki.
-->
<template>
  <div class="container mx-auto p-4">
    <!-- Ładowanie -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Ładowanie profilu...</p>
    </div>

    <!-- Profil prywatny -->
    <div v-else-if="isPrivate" class="text-center py-16">
      <div class="bg-gray-100 w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6">
        <LockClosedIcon class="w-12 h-12 text-gray-400" />
      </div>
      <h2 class="text-2xl font-semibold text-gray-700 mb-2">Profil prywatny</h2>
      <p class="text-gray-500 mb-6">Ten użytkownik ma wyłączoną widoczność profilu.</p>
      <router-link 
        to="/" 
        class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Wróć do strony głównej
      </router-link>
    </div>

    <!-- Błąd -->
    <div v-else-if="error" class="text-center py-12">
      <UserIcon class="w-16 h-16 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">{{ error }}</p>
      <router-link to="/" class="mt-4 inline-block text-blue-600 hover:underline">
        Wróć do strony głównej
      </router-link>
    </div>

    <!-- Profil -->
    <template v-else-if="user">
      <!-- Nagłówek -->
      <header class="mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <!-- Awatar -->
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mx-auto sm:mx-0">
              <img 
                v-if="user.avatar" 
                :src="getImageUrl(user.avatar)" 
                :alt="user.username"
                class="w-full h-full object-cover"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-blue-500 text-white text-2xl sm:text-3xl font-bold">
                {{ user.username?.charAt(0).toUpperCase() }}
              </div>
            </div>

            <!-- Informacje -->
            <div class="text-center sm:text-left flex-grow">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">{{ user.username }}</h1>
              <p class="text-gray-500 mt-1 text-sm sm:text-base">
                Na platformie od {{ formatRelativeTime(user.createdAt) }}
              </p>
            </div>

            <!-- Przycisk udostępnienia -->
            <div class="flex justify-center sm:justify-end">
              <button
                @click="shareProfile"
                class="flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="Udostępnij profil"
              >
                <ShareIcon class="w-4 h-4" />
                <span>Udostępnij</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Statystyki w panelach -->
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <p class="text-3xl font-bold text-blue-600">{{ stats.collections }}</p>
            <p class="text-gray-500 text-sm">Kolekcje</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <p class="text-3xl font-bold text-green-600">{{ stats.views }}</p>
            <p class="text-gray-500 text-sm">Wyświetleń</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <p class="text-3xl font-bold text-red-500">{{ stats.likes }}</p>
            <p class="text-gray-500 text-sm">Polubień</p>
          </div>
        </div>
      </header>

      <!-- Kolekcje -->
      <section>
        <h2 class="text-2xl font-semibold mb-4">
          Publiczne kolekcje 
          <span class="text-gray-500 text-lg">({{ pagination.total }})</span>
        </h2>

        <div v-if="collections.length === 0" class="text-center py-8 text-gray-500">
          Ten użytkownik nie ma jeszcze publicznych kolekcji.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CollectionCard
            v-for="collection in collections"
            :key="collection._id"
            :data="collection"
            type="collection"
            :showStats="true"
            :showOwner="false"
            :hideBadge="true"
          />
        </div>
        
        <!-- Paginacja -->
        <div v-if="pagination.pages > 1" class="mt-6 flex justify-center gap-2">
          <button
            @click="changePage(-1)"
            :disabled="pagination.page === 1"
            class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Poprzednia
          </button>
          <span class="px-4 py-2 text-gray-600">
            Strona {{ pagination.page }} z {{ pagination.pages }}
          </span>
          <button
            @click="changePage(1)"
            :disabled="pagination.page >= pagination.pages"
            class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Następna →
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { UserIcon, LockClosedIcon, ShareIcon } from '@heroicons/vue/24/outline'
import CollectionCard from '@/components/CollectionCard.vue'
import { getImageUrl } from '@/utils/imageUrl'
import { formatRelativeTime } from '@/utils/dateUtils'
import apiClient from '@/services/apiClient'

export default {
  name: 'UserProfileView',
  
  components: {
    UserIcon,
    LockClosedIcon,
    ShareIcon,
    CollectionCard
  },

  setup() {
    const route = useRoute()
    const toast = useToast()
    const user = ref(null)
    const stats = ref({ collections: 0, views: 0, likes: 0 })
    const collections = ref([])
    const pagination = ref({ page: 1, limit: 9, total: 0, pages: 1 })
    const isLoading = ref(true)
    const error = ref(null)
    const isPrivate = ref(false)

    // Ładowanie profilu użytkownika
    const loadProfile = async (page = 1) => {
      try {
        isLoading.value = true
        error.value = null
        isPrivate.value = false

        const response = await apiClient.get(`/users/${route.params.id}`, {
          params: { page, limit: pagination.value.limit }
        })
        
        user.value = response.data.user
        stats.value = response.data.stats
        collections.value = response.data.collections || []
        pagination.value = {
          ...pagination.value,
          page: response.data.pagination?.page || 1,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1
        }

      } catch (err) {
        console.error('Błąd ładowania profilu:', err)
        if (err.response?.status === 404) {
          error.value = 'Użytkownik nie istnieje'
        } else if (err.response?.status === 403) {
          isPrivate.value = true
        } else {
          error.value = 'Nie udało się załadować profilu'
        }
      } finally {
        isLoading.value = false
      }
    }

    // Zmiana strony
    const changePage = (delta) => {
      const newPage = pagination.value.page + delta
      if (newPage > 0 && newPage <= pagination.value.pages) {
        loadProfile(newPage)
      }
    }

    // Udostępnienie profilu
    const shareProfile = () => {
      const url = window.location.href
      
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      let copied = false
      try {
        copied = document.execCommand('copy')
      } catch (error) {
        console.error('Copy failed:', error)
      }
      
      textArea.remove()
      
      if (copied) {
        toast.success('Skopiowano link do schowka!')
      } else {
        toast.info('Skopiuj link: ' + url)
      }
    }

    onMounted(() => {
      loadProfile()
    })

    return {
      user,
      stats,
      collections,
      pagination,
      isLoading,
      error,
      isPrivate,
      changePage,
      formatRelativeTime,
      getImageUrl,
      shareProfile
    }
  }
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
