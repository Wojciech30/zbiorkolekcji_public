<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <!-- Header z danymi użytkownika -->
    <header class="mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center gap-6">
          <!-- Avatar z możliwością zmiany -->
          <div class="relative group">
            <div 
              v-if="user?.avatar"
              class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg"
            >
              <img :src="getImageUrl(user.avatar)" alt="Avatar" class="w-full h-full object-cover" />
            </div>
            <div 
              v-else
              class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            >
              {{ userInitials }}
            </div>
            
            <!-- Przycisk zmiany avatara -->
            <button
              @click="showAvatarModal = true"
              class="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          <div>
            <h1 class="text-3xl font-bold text-gray-800">{{ user?.username }}</h1>
            <p class="text-gray-500">{{ user?.email }}</p>
            <p class="text-sm text-gray-400 mt-1">
              Na platformie od {{ formatDate(user?.createdAt) }}
            </p>
            <span 
              v-if="user?.role === 'admin'" 
              class="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
            >
              Administrator
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Statystyki -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Statystyki</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-3xl font-bold text-blue-600">{{ stats.collectionsCount }}</p>
          <p class="text-gray-500 text-sm">Kolekcje</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-3xl font-bold text-green-600">{{ stats.itemsCount }}</p>
          <p class="text-gray-500 text-sm">Przedmioty</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-3xl font-bold text-red-500">{{ stats.likesReceived }}</p>
          <p class="text-gray-500 text-sm">Otrzymane <span class="text-red-500">❤</span></p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-3xl font-bold text-purple-600">{{ stats.commentsCount }}</p>
          <p class="text-gray-500 text-sm">Komentarze</p>
        </div>
      </div>
    </section>

    <!-- Moje kolekcje (preview) -->
    <section class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">Moje kolekcje</h2>
        <router-link to="/my-collections" class="text-blue-600 hover:underline">
          Zobacz wszystkie →
        </router-link>
      </div>
      
      <div v-if="recentCollections.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Nie masz jeszcze żadnych kolekcji.
        <router-link to="/my-collections" class="text-blue-600 hover:underline ml-1">
          Stwórz pierwszą!
        </router-link>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          v-for="collection in recentCollections"
          :key="collection._id || collection.id"
          :to="`/collections/${collection._id || collection.id}`"
          class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <h3 class="font-semibold text-gray-800">{{ collection.name }}</h3>
          <p class="text-sm text-gray-500 truncate">{{ collection.description }}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{{ collection.itemsCount || 0 }} przedmiotów</span>
            <span>❤ {{ collection.likesCount || 0 }}</span>
          </div>
        </router-link>
      </div>
    </section>

    <!-- Zmiana hasła - WYCENTROWANE -->
    <section class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold mb-6 text-center">Zmiana hasła</h2>

      <div
        v-if="passwordServerError"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md mx-auto"
      >
        <p class="font-semibold">Wystąpił błąd:</p>
        <p>{{ passwordServerError }}</p>
      </div>

      <form @submit.prevent="submitChangePassword" class="space-y-4 max-w-md mx-auto">
        <div>
          <label for="currentPassword" class="block font-medium mb-1">Obecne hasło</label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            id="currentPassword"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': passwordErrors.currentPassword }"
          />
          <p v-if="passwordErrors.currentPassword" class="text-red-500 text-sm">
            {{ passwordErrors.currentPassword }}
          </p>
        </div>

        <div>
          <label for="newPassword" class="block font-medium mb-1">Nowe hasło</label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            id="newPassword"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': passwordErrors.newPassword }"
          />
          <p v-if="passwordErrors.newPassword" class="text-red-500 text-sm">
            {{ passwordErrors.newPassword }}
          </p>
        </div>

        <div>
          <label for="confirmPassword" class="block font-medium mb-1">Powtórz nowe hasło</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            id="confirmPassword"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': passwordErrors.confirmPassword }"
          />
          <p v-if="passwordErrors.confirmPassword" class="text-red-500 text-sm">
            {{ passwordErrors.confirmPassword }}
          </p>
        </div>

        <div class="text-center">
          <button
            type="submit"
            class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold transition-colors"
            :class="{ 'opacity-60 cursor-not-allowed': isChangingPassword }"
            :disabled="isChangingPassword"
          >
            <span v-if="!isChangingPassword">Zmień hasło</span>
            <span v-else>Zmiana hasła...</span>
          </button>
        </div>
      </form>
    </section>

    <!-- Modal zmiany avatara -->
    <div v-if="showAvatarModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-semibold mb-4">Zmień zdjęcie profilowe</h3>
        
        <ImageUploader v-model="newAvatarUrl" />
        
        <div class="flex justify-end gap-3 mt-4">
          <button
            @click="showAvatarModal = false; newAvatarUrl = ''"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Anuluj
          </button>
          <button
            @click="saveAvatar"
            :disabled="isSavingAvatar"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            :class="{ 'opacity-60 cursor-not-allowed': isSavingAvatar }"
          >
            <span v-if="!isSavingAvatar">Zapisz</span>
            <span v-else>Zapisywanie...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/AuthService";
import CollectionService from "@/services/CollectionService";
import ImageUploader from "@/components/ImageUploader.vue";
import { useToast } from "vue-toastification";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { getImageUrl } from "@/utils/imageUrl";
import { ref, reactive, computed, onMounted } from "vue";
import { useStore } from "vuex";

export default {
  name: "ProfileView",
  components: {
    ImageUploader
  },
  setup() {
    const toast = useToast();
    const store = useStore();

    const user = computed(() => store.state.auth.user);
    
    const userInitials = computed(() => {
      if (!user.value?.username) return '?';
      return user.value.username.slice(0, 2).toUpperCase();
    });

    const stats = ref({
      collectionsCount: 0,
      itemsCount: 0,
      likesReceived: 0,
      commentsCount: 0
    });

    const recentCollections = ref([]);
    
    // Avatar
    const showAvatarModal = ref(false);
    const newAvatarUrl = ref("");
    const isSavingAvatar = ref(false);

    const isChangingPassword = ref(false);
    const passwordServerError = ref("");

    const passwordForm = reactive({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });

    const passwordErrors = reactive({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    const loadUserData = async () => {
      try {
        // Pobierz kolekcje użytkownika - endpoint teraz zwraca itemsCount, likesCount, commentsCount
        const response = await CollectionService.getUserCollections({ limit: 100 });
        const collections = response.data?.collections || [];
        
        recentCollections.value = collections.slice(0, 3);
        
        // Oblicz statystyki z danych zwróconych przez backend
        stats.value.collectionsCount = collections.length;
        stats.value.itemsCount = collections.reduce((sum, c) => sum + (c.itemsCount || 0), 0);
        stats.value.likesReceived = collections.reduce((sum, c) => sum + (c.likesCount || 0), 0);
        stats.value.commentsCount = collections.reduce((sum, c) => sum + (c.commentsCount || 0), 0);
      } catch (error) {
        console.error('Błąd ładowania danych profilu:', error);
      }
    };
    
    const saveAvatar = async () => {
      if (!newAvatarUrl.value) {
        toast.warning("Wybierz zdjęcie");
        return;
      }
      
      isSavingAvatar.value = true;
      try {
        await AuthService.updateAvatar({ avatar: newAvatarUrl.value });
        
        // Zaktualizuj user w store
        store.commit('auth/SET_USER', {
          ...user.value,
          avatar: newAvatarUrl.value
        });
        
        toast.success("Avatar został zmieniony!");
        showAvatarModal.value = false;
        newAvatarUrl.value = "";
      } catch (error) {
        console.error("Błąd zmiany avatara:", error);
        toast.error("Nie udało się zmienić avatara");
      } finally {
        isSavingAvatar.value = false;
      }
    };

    const validatePasswordForm = () => {
      passwordErrors.currentPassword = "";
      passwordErrors.newPassword = "";
      passwordErrors.confirmPassword = "";

      let valid = true;

      if (!passwordForm.currentPassword) {
        passwordErrors.currentPassword = "Podaj obecne hasło.";
        valid = false;
      }

      if (!passwordForm.newPassword) {
        passwordErrors.newPassword = "Podaj nowe hasło.";
        valid = false;
      } else if (passwordForm.newPassword.length < 6) {
        passwordErrors.newPassword = "Nowe hasło musi mieć co najmniej 6 znaków.";
        valid = false;
      }

      if (!passwordForm.confirmPassword) {
        passwordErrors.confirmPassword = "Powtórz nowe hasło.";
        valid = false;
      } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
        passwordErrors.confirmPassword = "Hasła muszą być takie same.";
        valid = false;
      }

      return valid;
    };

    const submitChangePassword = async () => {
      passwordServerError.value = "";
      if (!validatePasswordForm()) return;

      isChangingPassword.value = true;

      try {
        await AuthService.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });

        toast.success("Hasło zostało pomyślnie zmienione.");

        passwordForm.currentPassword = "";
        passwordForm.newPassword = "";
        passwordForm.confirmPassword = "";
      } catch (error) {
        console.error("Błąd zmiany hasła:", error);
        const msg = getUserFriendlyErrorMessage(error, "Nie udało się zmienić hasła.");
        passwordServerError.value = msg;
        toast.error(msg);
      } finally {
        isChangingPassword.value = false;
      }
    };

    onMounted(() => {
      loadUserData();
    });

    return {
      user,
      userInitials,
      stats,
      recentCollections,
      formatDate,
      getImageUrl,
      passwordForm,
      passwordErrors,
      submitChangePassword,
      isChangingPassword,
      passwordServerError,
      showAvatarModal,
      newAvatarUrl,
      isSavingAvatar,
      saveAvatar
    };
  }
};
</script>
