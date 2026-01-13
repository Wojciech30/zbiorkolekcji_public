<template>
  <div class="container mx-auto p-4">
    <div v-if="isLoading" class="text-center py-8">
      Ładowanie danych...
    </div>

    <div v-else-if="!item">
      <p>Nie znaleziono przedmiotu.</p>
    </div>

    <div v-else>
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800">{{ item.name }}</h1>
        <p class="text-gray-600 mt-2">{{ item.description }}</p>
      </header>

      <div class="mb-6">
        <img
          :src="mainImageUrl"
          alt="Zdjęcie przedmiotu"
          class="w-full max-w-md mx-auto rounded"
        />
      </div>

      <div class="mb-6">
        <p><strong>Kategoria:</strong> {{ item.category?.name || "Brak kategorii" }}</p>
        <p><strong>Kolekcja:</strong> {{ item.parentCollection?.name || "Brak kolekcji" }}</p>
        <p><strong>Właściciel:</strong> {{ item.createdBy?.username || "Nieznany" }}</p>
      </div>

      <div class="mb-6">
        <h2 class="text-2xl font-semibold mb-4">Atrybuty</h2>
        <ul v-if="item.attributes && Object.keys(item.attributes).length">
          <li v-for="(attr, key) in item.attributes" :key="key" class="mb-2">
            <strong>{{ key }}:</strong> {{ attr?.value ?? attr }}
          </li>
        </ul>
        <p v-else class="text-gray-500">Brak atrybutów.</p>
      </div>

      <!-- Polubienia -->
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="toggleLike"
          :disabled="isLiking"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          :class="hasLiked 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
          </svg>
          <span>{{ likesCount }}</span>
        </button>
        <span v-if="!isAuthenticated" class="text-sm text-gray-500">
          Zaloguj się, aby polubić
        </span>
      </div>

      <!-- Komentarze -->
      <div class="mb-6">
        <h2 class="text-2xl font-semibold mb-4">Komentarze ({{ comments.length }})</h2>

        <!-- Formularz dodawania komentarza -->
        <div v-if="isAuthenticated" class="mb-4">
          <textarea
            v-model="newComment"
            placeholder="Napisz komentarz..."
            class="w-full p-3 border rounded-lg resize-none"
            rows="3"
          ></textarea>
          <button
            @click="addComment"
            :disabled="!newComment.trim() || isAddingComment"
            class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isAddingComment ? 'Dodawanie...' : 'Dodaj komentarz' }}
          </button>
        </div>
        <p v-else class="text-sm text-gray-500 mb-4">
          Zaloguj się, aby dodać komentarz
        </p>

        <!-- Lista komentarzy -->
        <div v-if="comments.length === 0" class="text-gray-500">
          Brak komentarzy
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment._id"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-800">{{ comment.user?.username || 'Anonim' }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</p>
              </div>
              <button
                v-if="canDeleteComment(comment)"
                @click="deleteComment(comment._id)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                Usuń
              </button>
            </div>
            <p class="mt-2 text-gray-700">{{ comment.text }}</p>
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

export default {
  name: "SingleItemView",
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

    const isAuthenticated = computed(() => store.getters["auth/isAuthenticated"]);
    const currentUser = computed(() => store.state.auth.user);

    const mainImageUrl = computed(() => {
      const images = item.value?.images;
      if (Array.isArray(images) && images.length > 0 && images[0]) {
        return images[0];
      }
      if (item.value?.imageUrl) {
        return item.value.imageUrl;
      }
      return "/placeholder.png";
    });

    const formatDate = (dateString) => {
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

    const loadComments = async () => {
      try {
        const response = await ItemService.getComments(route.params.id);
        comments.value = response.data?.comments || [];
      } catch (error) {
        console.error("Błąd pobierania komentarzy:", error);
      }
    };

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
      } catch (error) {
        console.error("Błąd polubienia:", error);
        toast.error("Nie udało się zaktualizować polubienia");
      } finally {
        isLiking.value = false;
      }
    };

    const addComment = async () => {
      if (!newComment.value.trim() || isAddingComment.value) return;

      try {
        isAddingComment.value = true;
        const response = await ItemService.addComment(route.params.id, newComment.value);
        comments.value.push(response.data.comment);
        newComment.value = "";
        toast.success("Komentarz dodany");
      } catch (error) {
        console.error("Błąd dodawania komentarza:", error);
        toast.error("Nie udało się dodać komentarza");
      } finally {
        isAddingComment.value = false;
      }
    };

    const deleteComment = async (commentId) => {
      try {
        await ItemService.deleteComment(route.params.id, commentId);
        comments.value = comments.value.filter(c => c._id !== commentId);
        toast.success("Komentarz usunięty");
      } catch (error) {
        console.error("Błąd usuwania komentarza:", error);
        toast.error("Nie udało się usunąć komentarza");
      }
    };

    const canDeleteComment = (comment) => {
      if (!isAuthenticated.value) return false;
      const userId = currentUser.value?.id || currentUser.value?._id;
      const isAuthor = comment.user?._id === userId || comment.user?.id === userId;
      const isAdmin = currentUser.value?.role === "admin";
      return isAuthor || isAdmin;
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
      formatDate,
      toggleLike,
      addComment,
      deleteComment,
      canDeleteComment
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
}
img {
  max-width: 100%;
  height: auto;
}
</style>
