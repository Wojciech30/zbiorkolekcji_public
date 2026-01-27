<!--
  @view SingleItemView
  @description Widok szczegółów przedmiotu.
  Wyświetla: atrybuty, galerię, komentarze, polubienia.
  Dla właścicieli: edycja, usuwanie.
-->
<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <!-- Stan ładowania -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <AppSpinner class="w-12 h-12 text-blue-600" />
    </div>

    <!-- Błąd -->
    <div v-else-if="!item" class="text-center py-20 bg-white rounded-xl shadow-sm">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <ExclamationCircleIcon class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Nie znaleziono przedmiotu</h2>
      <p class="text-gray-500 mb-6">Przedmiot, którego szukasz, nie istnieje lub został usunięty.</p>
      <router-link :to="{ name: 'Home' }" class="btn-primary inline-flex items-center">
        Wróć do strony głównej
      </router-link>
    </div>

    <!-- Treść -->
    <div v-else>
      <!-- Okruszki nawigacyjne -->
      <nav class="flex text-sm text-gray-500 mb-6 space-x-2 items-center">
        <router-link :to="{ name: 'Home' }" class="hover:text-blue-600 transition-colors">Główna</router-link>
        <span>/</span>
        <router-link 
          v-if="item.parentCollection" 
          :to="{ name: 'SingleCollection', params: { id: item.parentCollection._id || item.parentCollection.id } }" 
          class="hover:text-blue-600 transition-colors font-medium text-gray-700"
        >
          {{ item.parentCollection.name }}
        </router-link>
        <span v-else class="text-gray-400">Kolekcja</span>
        <span>/</span>
        <span class="text-gray-900 font-semibold truncate">{{ item.name }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Lewa kolumna: Obrazek -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
            <div class="relative aspect-square bg-gray-100">
              <img
                :src="mainImageUrl"
                :alt="item.name"
                class="w-full h-full object-cover"
                @error="$event.target.src = '/placeholder-collection.svg'"
              />
              
              <!-- Przycisk polubienia (Mobile) -->
              <button
                @click="toggleLike"
                :disabled="isLiking"
                class="absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-all transform hover:scale-105 active:scale-95 lg:hidden"
                :class="hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'"
              >
                <HeartIcon v-if="!hasLiked" class="w-6 h-6" />
                <HeartSolidIcon v-else class="w-6 h-6" />
              </button>
            </div>
            
            <div class="p-6 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div class="flex items-center gap-2">
                  <UserCircleIcon class="w-5 h-5" />
                  <span>{{ item.createdBy?.username || "Nieznany" }}</span>
                </div>
                <div class="flex items-center gap-2" v-if="item.createdAt">
                  <CalendarDaysIcon class="w-5 h-5" />
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              
              <!-- Akcje (Desktop) -->
              <div class="flex gap-3 mt-4">
                <button
                  @click="toggleLike"
                  :disabled="isLiking"
                  class="flex-1 btn-white flex items-center justify-center gap-2 group border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  <HeartIcon v-if="!hasLiked" class="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <HeartSolidIcon v-else class="w-5 h-5 text-red-500" />
                  <span :class="hasLiked ? 'text-red-600' : 'text-gray-600 group-hover:text-red-600'">
                    {{ likesCount }} {{ likesCount === 1 ? 'polubienie' : (likesCount > 1 && likesCount < 5 ? 'polubienia' : 'polubień') }}
                  </span>
                </button>
                
                <button
                  @click="shareItem"
                  class="btn-white px-4 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Udostępnij"
                >
                  <ShareIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Prawa kolumna: Szczegóły & Komentarze -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Szczegóły przedmiotu -->
          <div class="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <div class="border-b border-gray-100 pb-6 mb-6">
              <div class="flex items-start justify-between">
                <div>
                   <span v-if="item.category" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                    {{ item.category.name }}
                  </span>
                  <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">{{ item.name }}</h1>
                </div>
              </div>
              <p class="text-gray-600 text-lg leading-relaxed">{{ item.description || "Brak opisu przedmiotu." }}</p>
            </div>

            <!-- Atrybuty -->
            <div v-if="item.attributes && Object.keys(item.attributes).length > 0">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TagIcon class="w-5 h-5 text-blue-500" />
                Cechy przedmiotu
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="(attr, key) in item.attributes" 
                  :key="key" 
                  class="bg-gray-50 rounded-lg p-3 flex flex-col hover:bg-gray-100 transition-colors"
                >
                  <span class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{{ key }}</span>
                  <span class="text-gray-800 font-medium">{{ formatAttribute(attr?.value ?? attr) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p class="text-gray-500 text-sm">Ten przedmiot nie posiada dodatkowych atrybutów.</p>
            </div>
          </div>

          <!-- Komentarze -->
          <div class="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ChatBubbleLeftRightIcon class="w-6 h-6 text-purple-500" />
              Komentarze <span class="text-gray-400 font-normal">({{ comments.length }})</span>
            </h3>

            <!-- Formularz dodawania komentarza -->
            <div v-if="isAuthenticated" class="mb-8 flex gap-4">
              <div class="flex-shrink-0">
                 <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                  {{ userInitials }}
                </div>
              </div>
              <div class="flex-grow">
                <div class="relative">
                  <textarea
                    v-model="newComment"
                    placeholder="Podziel się swoją opinią..."
                    class="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow min-h-[100px]"
                    rows="3"
                  ></textarea>
                </div>
                <div class="flex justify-end mt-2">
                  <button
                    @click="addComment"
                    :disabled="!newComment.trim() || isAddingComment"
                    class="btn-primary"
                  >
                    {{ isAddingComment ? 'Dodawanie...' : 'Opublikuj komentarz' }}
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
            <div class="space-y-6">
              <div v-if="comments.length === 0" class="text-center py-8 text-gray-400 italic">
                Brak komentarzy. Bądź pierwszy!
              </div>
              
              <transition-group name="list">
                <div
                  v-for="comment in paginatedComments"
                  :key="comment._id"
                  class="flex gap-4 group"
                >
                  <div class="flex-shrink-0">
                    <div v-if="comment.user?.avatar" class="w-10 h-10 rounded-full overflow-hidden">
                       <img :src="getImageUrl(comment.user.avatar)" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {{ comment.user?.username?.substring(0,2)?.toUpperCase() || '?' }}
                    </div>
                  </div>
                  
                  <div class="flex-grow bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="font-bold text-gray-900 mr-2">{{ comment.user?.username || 'Anonim' }}</span>
                        <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                      </div>
                      <button
                        v-if="canDeleteComment(comment)"
                        @click="deleteComment(comment._id)"
                        class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Usuń komentarz"
                      >
                         <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <p class="text-gray-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">{{ comment.text }}</p>
                  </div>
                </div>
              </transition-group>

              <!-- Strona komentarzy -->
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useStore } from "vuex";
import ItemService from "@/services/ItemService";
import AppSpinner from "@/components/AppSpinner.vue";
import { getImageUrl } from "@/utils/imageUrl";
import { formatDate } from "@/utils/dateUtils";
import { 
  HeartIcon, 
  ShareIcon, 
  UserCircleIcon, 
  CalendarDaysIcon, 
  TagIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationCircleIcon,
  TrashIcon
} from "@heroicons/vue/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/vue/24/solid";

export default {
  name: "SingleItemView",
  components: {
    AppSpinner,
    HeartIcon,
    HeartSolidIcon,
    ShareIcon,
    UserCircleIcon,
    CalendarDaysIcon,
    TagIcon,
    ChatBubbleLeftRightIcon,
    ExclamationCircleIcon,
    TrashIcon
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const store = useStore();
    const isLoading = ref(true);
    const item = ref(null);
    const comments = ref([]);
    const newComment = ref("");
    const isAddingComment = ref(false);
    const isLiking = ref(false);
    const likesCount = ref(0);
    const hasLiked = ref(false);

    // Paginacja komentarzy
    const commentsPage = ref(1);
    const commentsPerPage = 10;
    const sortedComments = computed(() => {
      return [...comments.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    const totalCommentsPages = computed(() => Math.ceil(sortedComments.value.length / commentsPerPage));
    const paginatedComments = computed(() => {
      const start = (commentsPage.value - 1) * commentsPerPage;
      return sortedComments.value.slice(start, start + commentsPerPage);
    });

    const isAuthenticated = computed(() => store.getters["auth/isAuthenticated"]);
    const currentUser = computed(() => store.state.auth.user);
    const userInitials = computed(() => {
        if (!currentUser.value?.username) return '?';
        return currentUser.value.username.slice(0, 2).toUpperCase();
    });

    // Obsługa struktur obrazów z backendu (uploads/...) i zewnętrznych URL
    const mainImageUrl = computed(() => {
      const images = item.value?.images;
      const img = (Array.isArray(images) && images.length > 0 && images[0]) 
                  ? images[0] 
                  : item.value?.imageUrl;
      
      if (!img) return "/placeholder-collection.svg";
      return getImageUrl(img);
    });

    // Formatowanie dat
    const formatAttribute = (value) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (typeof value === 'string' && dateRegex.test(value)) {
        return formatDate(value);
      }
      return value;
    };

    // Pobieranie danych
    const loadItem = async () => {
      try {
        const response = await ItemService.getItem(route.params.id);
        item.value = response.data?.item || response.data || null;
        
        if (item.value) {
          likesCount.value = item.value.likesCount || 0;
          hasLiked.value = item.value.likes?.some(
            id => id === currentUser.value?.id || id === currentUser.value?._id
          ) || false;
        }
      } catch (error) {
        console.error("Błąd pobierania przedmiotu:", error);
        toast.error("Nie udało się pobrać danych przedmiotu");
      } finally {
        isLoading.value = false;
      }
    };

    // Pobieranie komentarzy
    const loadComments = async () => {
      try {
        const response = await ItemService.getComments(route.params.id);
        comments.value = response.data?.comments || [];
      } catch (error) {
        console.error("Błąd pobierania komentarzy:", error);
      }
    };

    // Dodawanie/Usuwanie polubienia
    const toggleLike = async () => {
      if (!isAuthenticated.value) {
        router.push({ name: 'Login', query: { redirect: route.fullPath } });
        return;
      }
      if (isLiking.value) return;
      
      try {
        isLiking.value = true;
        const response = await ItemService.toggleLike(route.params.id);
        hasLiked.value = response.data.liked;
        likesCount.value = response.data.likesCount;
        
        if (hasLiked.value) {
          toast.success("Polubiono przedmiot!");
        } else {
          toast.success("Anulowano polubienie!");
        }
      } catch (error) {
        console.error("Błąd polubienia:", error);
        toast.error("Nie udało się zaktualizować polubienia");
      } finally {
        isLiking.value = false;
      }
    };

    const shareItem = () => {
      const url = window.location.href;
      
      try {
          if (navigator.share) {
              navigator.share({
                  title: item.value.name,
                  text: `Zobacz ${item.value.name} w aplikacji Zbiór Kolekcji!`,
                  url: url
              }).catch((e) => console.log('Udostępnianie anulowane', e));
          } else {
              copyToClipboard(url);
          }
      } catch (e) {
         copyToClipboard(url);
      }
    };

    // Kopiowanie linku do schowka (nowoczesne API)
    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success("Link skopiowany do schowka!");
            }).catch(() => {
                 fallbackCopy(text);
            });
        } else {
             fallbackCopy(text);
        }
    };
    
    // Kopiowanie linku do schowka (stary sposób)
    const fallbackCopy = (text) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                toast.success("Link skopiowany do schowka!");
            } else {
                 prompt("Skopiuj link:", text);
            }
        } catch (err) {
            prompt("Skopiuj link:", text);
        }
    };

    // Dodawanie komentarza
    const addComment = async () => {
      if (!newComment.value.trim() || isAddingComment.value) return;

      try {
        isAddingComment.value = true;
        const response = await ItemService.addComment(route.params.id, newComment.value);
        comments.value.unshift(response.data.comment); // Add to top
        newComment.value = "";
        toast.success("Komentarz dodany");
      } catch (error) {
        console.error("Błąd dodawania komentarza:", error);
        toast.error("Nie udało się dodać komentarza");
      } finally {
        isAddingComment.value = false;
      }
    };

    // Usuwanie komentarza
    const deleteComment = async (commentId) => {
      if(!confirm("Czy na pewno chcesz usunąć ten komentarz?")) return;
      
      try {
        await ItemService.deleteComment(route.params.id, commentId);
        comments.value = comments.value.filter(c => c._id !== commentId);
        toast.success("Komentarz usunięty");
      } catch (error) {
        console.error("Błąd usuwania komentarza:", error);
        toast.error("Nie udało się usunąć komentarza");
      }
    };

    // Sprawdzanie możliwości usuwania komentarza
    const canDeleteComment = (comment) => {
      if (!isAuthenticated.value) return false;
      const userId = currentUser.value?.id || currentUser.value?._id;
      const isAuthor = comment.user?._id === userId || comment.user?.id === userId;
      const isAdmin = currentUser.value?.role === "admin";
      const collectionOwnerId = item.value?.parentCollection?.owner?._id || item.value?.parentCollection?.owner;
      const isCollectionOwner = collectionOwnerId && (collectionOwnerId === userId || collectionOwnerId.toString?.() === userId);
      return isAuthor || isAdmin || isCollectionOwner;
    };

    onMounted(async () => {
      await loadItem();
      await loadComments();
    });

    return {
      item,
      isLoading,
      mainImageUrl,
      isAuthenticated,
      comments,
      newComment,
      isAddingComment,
      isLiking,
      likesCount,
      hasLiked,
      userInitials,
      route,
      formatDate,
      formatAttribute,
      getImageUrl,
      toggleLike,
      shareItem,
      addComment,
      deleteComment,
      canDeleteComment,
      commentsPage,
      totalCommentsPages,
      paginatedComments
    };
  }
};
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center;
}

.btn-white {
  @apply bg-white rounded-lg py-2 font-medium transition-all shadow-sm active:scale-95;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>