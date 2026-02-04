<!--
  @view ProfileView
  @description Profil zalogowanego użytkownika.
  Zmiany: avatar, hasło, widoczność profilu, usuwanie konta.
  Przeglądanie: polubione kolekcje.
-->
<template>
  <div class="container mx-auto p-4">
    <!-- Header z danymi użytkownika -->
    <header class="mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <!-- Awatar z możliwością zmiany -->
          <div class="relative group mx-auto sm:mx-0">
            <div 
              v-if="user?.avatar"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg"
            >
              <img :src="getImageUrl(user.avatar)" alt="Avatar" class="w-full h-full object-cover" />
            </div>
            <div 
              v-else
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg"
            >
              {{ userInitials }}
            </div>
            

          </div>
          
          <div class="flex-grow text-center sm:text-left">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">{{ user?.username }}</h1>
            <p class="text-gray-500 text-sm sm:text-base">{{ user?.email }}</p>
            <p v-if="user?.createdAt" class="text-sm text-gray-400 mt-1">
              Na platformie od {{ formatRelativeTime(user?.createdAt) }}
            </p>
            <span 
              v-if="user?.role === 'admin'" 
              class="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
            >
              Administrator
            </span>
          </div>
          
          <!-- Ustawienia -->
          <div class="flex justify-center sm:justify-end">
            <button
              @click="showSettingsModal = true"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ustawienia konta"
            >
              <Cog6ToothIcon class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Statystyki w panelach -->
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

    <!-- Polubione kolekcje -->
    <section class="mb-8" v-if="likedCollections.length > 0 || likedPagination.total > 0">
      <h2 class="text-2xl font-semibold mb-4">
        Polubione kolekcje
        <span class="text-gray-400 text-lg font-normal">({{ likedPagination.total }})</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CollectionCard
          v-for="collection in likedCollections"
          :key="collection._id"
          :data="collection"
          type="collection"
          :showStats="true"
          :showOwner="true"
        />
      </div>
      <!-- Paginacja -->
      <div v-if="likedPagination.pages > 1" class="mt-6 flex justify-center gap-2">
        <button
          @click="changeLikedPage(-1)"
          :disabled="likedPagination.page === 1"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Poprzednia
        </button>
        <span class="px-4 py-2 text-gray-600">
          Strona {{ likedPagination.page }} z {{ likedPagination.pages }}
        </span>
        <button
          @click="changeLikedPage(1)"
          :disabled="likedPagination.page >= likedPagination.pages"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Następna →
        </button>
      </div>
    </section>

    <!-- Modal ustawień -->
    <BaseModal
      :show="showSettingsModal"
      title="Ustawienia konta"
      @close="showSettingsModal = false"
    >
      <div class="space-y-6">
        <!-- Zmiana Awatara -->
        <div>
          <h4 class="font-medium text-gray-800 mb-4">Zdjęcie profilowe</h4>
          
          <div class="flex flex-col gap-4">
            <ImageUploader v-model="newAvatarUrl" :max-width="300" :max-height="300" />
            
            <div class="flex gap-3 justify-end">
              <button
                v-if="user?.avatar"
                @click="removeAvatar"
                class="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 transition-colors text-sm font-medium"
                :disabled="isSavingAvatar"
              >
                Usuń zdjęcie
              </button>
              
              <button
                @click="saveAvatar"
                :disabled="!newAvatarUrl || isSavingAvatar"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSavingAvatar ? 'Zapisywanie...' : 'Zapisz nowe zdjęcie' }}
              </button>
            </div>
          </div>
        </div>

        <hr class="border-gray-200" />
        <!-- Widoczność profilu -->
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-gray-800">Widoczność profilu</h4>
            <p class="text-sm text-gray-500">Pozwól innym odwiedzać Twój profil</p>
          </div>
          <button
            @click="toggleProfileVisibility"
            :disabled="isSavingVisibility"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="isProfilePublic ? 'bg-blue-600' : 'bg-gray-200'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="isProfilePublic ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
        
        <hr class="border-gray-200" />
        
        <!-- Zmiana hasła -->
        <div>
          <h4 class="font-medium text-gray-800 mb-3">Zmiana hasła</h4>
          <button
            @click="showSettingsModal = false; showPasswordModal = true"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold transition-colors"
          >
            Zmień hasło
          </button>
        </div>
        
        <hr class="border-gray-200" />
        
        <!-- Usunięcie konta -->
        <div>
          <h4 class="font-medium text-red-600 mb-2">Strefa niebezpieczna</h4>
          <p class="text-sm text-gray-500 mb-3">Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte.</p>
          <button
            v-if="!showDeleteConfirmation"
            @click="showDeleteConfirmation = true"
            class="w-full px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 font-semibold transition-colors"
          >
            Usuń konto
          </button>
          
          <!-- Potwierdzenie usunięcia -->
          <div v-else class="space-y-3">
            <p class="text-sm text-red-600 font-medium">Wpisz swoje hasło, aby potwierdzić usunięcie:</p>
            <input
              v-model="deleteConfirmPassword"
              type="password"
              placeholder="Twoje hasło"
              class="w-full px-3 py-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
            />
            <div class="flex gap-2">
              <button
                @click="showDeleteConfirmation = false; deleteConfirmPassword = ''"
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Anuluj
              </button>
              <button
                @click="deleteAccount"
                :disabled="isDeletingAccount || !deleteConfirmPassword"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition-colors disabled:opacity-50"
              >
                {{ isDeletingAccount ? 'Usuwanie...' : 'Potwierdź usunięcie' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>



    <!-- Modal zmiany hasła -->
    <BaseModal
      :show="showPasswordModal"
      title="Zmiana hasła"
      @close="closePasswordModal"
    >
      <div
        v-if="passwordServerError"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-semibold">Wystąpił błąd:</p>
        <p>{{ passwordServerError }}</p>
      </div>

      <form @submit.prevent="submitChangePassword" class="space-y-4">
        <div>
          <label for="currentPassword" class="block font-medium mb-1">Obecne hasło</label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            id="currentPassword"
            class="input-field"
            :class="{ 'border-red-500': passwordErrors.currentPassword }"
          />
          <p v-if="passwordErrors.currentPassword" class="text-red-500 text-sm mt-1">
            {{ passwordErrors.currentPassword }}
          </p>
        </div>

        <div>
          <label for="newPassword" class="block font-medium mb-1">Nowe hasło</label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            id="newPassword"
            class="input-field"
            :class="{ 'border-red-500': passwordErrors.newPassword }"
          />
          <p v-if="passwordErrors.newPassword" class="text-red-500 text-sm mt-1">
            {{ passwordErrors.newPassword }}
          </p>
        </div>

        <div>
          <label for="confirmPassword" class="block font-medium mb-1">Powtórz nowe hasło</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            id="confirmPassword"
            class="input-field"
            :class="{ 'border-red-500': passwordErrors.confirmPassword }"
          />
          <p v-if="passwordErrors.confirmPassword" class="text-red-500 text-sm mt-1">
            {{ passwordErrors.confirmPassword }}
          </p>
        </div>
      </form>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="closePasswordModal"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Anuluj
          </button>
          <button
            @click="submitChangePassword"
            :disabled="isChangingPassword"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            :class="{ 'opacity-60 cursor-not-allowed': isChangingPassword }"
          >
            <span v-if="!isChangingPassword">Zmień hasło</span>
            <span v-else>Zmiana hasła...</span>
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Feedback Modal -->
    <FeedbackModal 
      :show="showFeedbackModal" 
      @close="showFeedbackModal = false" 
    />
  </div>
</template>

<script>
import AuthService from "@/services/AuthService";
import apiClient from "@/services/apiClient";
import CollectionService from "@/services/CollectionService";
import ImageUploader from "@/components/ImageUploader.vue";
import CollectionCard from "@/components/CollectionCard.vue";
import FeedbackModal from "@/components/FeedbackModal.vue";
import BaseModal from "@/components/BaseModal.vue";
import { Cog6ToothIcon } from "@heroicons/vue/24/outline";
import { useToast } from "vue-toastification";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { getImageUrl } from "@/utils/imageUrl";
import { formatRelativeTime } from "@/utils/dateUtils";
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "ProfileView",
  components: {
    ImageUploader,
    CollectionCard,
    FeedbackModal,
    Cog6ToothIcon,
    BaseModal
  },
  setup() {
    const toast = useToast();
    const store = useStore();
    const router = useRouter();
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
    
    // Widoczność profilu
    const isProfilePublic = ref(true);
    const isSavingVisibility = ref(false);
    
    // Awatar

    const newAvatarUrl = ref("");
    const isSavingAvatar = ref(false);

    // Zdjęcia ulubionych kolekcji z paginacją
    const likedCollections = ref([]);
    const likedPagination = ref({ page: 1, limit: 9, total: 0, pages: 1 });

    // Modal zmiany hasła
    const showPasswordModal = ref(false);
    
    // Modal ustawień
    const showSettingsModal = ref(false);
    const showDeleteConfirmation = ref(false);
    const deleteConfirmPassword = ref("");
    const isDeletingAccount = ref(false);
    
    // Modal feedback
    const showFeedbackModal = ref(false);
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

    // Pobierz dane użytkownika
    const loadUserData = async () => {
      try {
        const response = await CollectionService.getUserCollections({ limit: 100 });
        const collections = response.data?.collections || [];
        
        stats.value.collectionsCount = collections.length;
        stats.value.itemsCount = collections.reduce((sum, c) => sum + (c.itemsCount || 0), 0);
        stats.value.likesReceived = collections.reduce((sum, c) => sum + (c.likesCount || 0), 0);
        stats.value.commentsCount = collections.reduce((sum, c) => sum + (c.commentsCount || 0), 0);
        
        isProfilePublic.value = user.value?.isProfilePublic !== false;
        
        await loadLikedCollections();
      } catch (error) {
        console.error('Błąd ładowania danych profilu:', error);
      }
    };
    
    // Pobierz polubione kolekcje
    const loadLikedCollections = async (page = 1) => {
      try {
        const response = await CollectionService.getLikedCollections({ 
          page, 
          limit: likedPagination.value.limit 
        });
        likedCollections.value = response.data?.collections || [];
        likedPagination.value = {
          ...likedPagination.value,
          page: response.data?.pagination?.page || 1,
          total: response.data?.pagination?.total || 0,
          pages: response.data?.pagination?.pages || 1
        };
      } catch (error) {
        console.error('Błąd ładowania polubionych kolekcji:', error);
      }
    };
    
    // Zmień stronę polubionych kolekcji
    const changeLikedPage = (delta) => {
      const newPage = likedPagination.value.page + delta;
      if (newPage > 0 && newPage <= likedPagination.value.pages) {
        loadLikedCollections(newPage);
      }
    };
    
    // Zmień widoczność profilu
    const toggleProfileVisibility = async () => {
      try {
        isSavingVisibility.value = true;
        const newValue = !isProfilePublic.value;
        await AuthService.updateProfileVisibility(newValue);
        isProfilePublic.value = newValue;
        store.commit('auth/UPDATE_USER', { isProfilePublic: newValue });
        
        toast.success(newValue ? 'Profil jest teraz publiczny' : 'Profil jest teraz ukryty');
      } catch (error) {
        console.error('Błąd zmiany widoczności:', error);
        toast.error('Nie udało się zmienić ustawienia');
      } finally {
        isSavingVisibility.value = false;
      }
    };
    
    // Zapisz nowy avatar
    const saveAvatar = async () => {
      if (!newAvatarUrl.value) return;
      
      isSavingAvatar.value = true;
      try {
        await AuthService.updateAvatar({ avatar: newAvatarUrl.value });
        store.commit('auth/UPDATE_USER', { avatar: newAvatarUrl.value });
        toast.success("Avatar został zmieniony!");
        newAvatarUrl.value = "";
      } catch (error) {
        console.error("Błąd zmiany avatara:", error);
        toast.error("Nie udało się zmienić avatara");
      } finally {
        isSavingAvatar.value = false;
      }
    };

    // Usuń avatar
    const removeAvatar = async () => {
      if (!confirm("Czy na pewno chcesz usunąć zdjęcie profilowe?")) return;

      isSavingAvatar.value = true;
      try {
        // Pusty string oznacza usunięcie
        await AuthService.updateAvatar({ avatar: "" });
        store.commit('auth/UPDATE_USER', { avatar: "" });
        toast.success("Zdjęcie profilowe zostało usunięte");
      } catch (error) {
        console.error("Błąd usuwania avatara:", error);
        toast.error("Nie udało się usunąć zdjęcia");
      } finally {
        isSavingAvatar.value = false;
      }
    };
    
    // Usuń konto
    const deleteAccount = async () => {
      try {
        isDeletingAccount.value = true;
        await AuthService.deleteAccount(deleteConfirmPassword.value);
        toast.success("Twoje konto zostało trwale usunięte");
        await store.dispatch("auth/logout");
        router.push("/");
      } catch (error) {
        console.error("Błąd usuwania konta:", error);
        const msg = getUserFriendlyErrorMessage(error, "Nie udało się usunąć konta");
        toast.error(msg);
      } finally {
        isDeletingAccount.value = false;
      }
    };

    // Walidacja formularza zmiany hasła
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

    // Zmiana hasła
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
        showPasswordModal.value = false;
      } catch (error) {
        console.error("Błąd zmiany hasła:", error);
        const msg = getUserFriendlyErrorMessage(error, "Nie udało się zmienić hasła.");
        passwordServerError.value = msg;
        toast.error(msg);
      } finally {
        isChangingPassword.value = false;
      }
    };

    // Zamknij modal
    const closePasswordModal = () => {
      showPasswordModal.value = false;
      passwordServerError.value = "";
      passwordForm.currentPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      passwordErrors.currentPassword = "";
      passwordErrors.newPassword = "";
      passwordErrors.confirmPassword = "";
    };

    // Funkcja pomocnicza do usuwania pliku z serwera (jeśli nie jest avatarem użytkownika)
    const cleanupUnsavedAvatar = async (url) => {
      // Sprawdź czy url wygląda na plik lokalny z uploads i czy nie jest obecnym avatarem
      if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return;
      if (user.value?.avatar === url) return;

      const filename = url.split('/').pop();
      if (!filename) return;

      try {
        await apiClient.delete(`/uploads/${filename}`);
        console.log(`Usunięto niezatwierdzony plik: ${filename}`);
      } catch (error) {
        // Ignorujemy błędy usuwania plików tymczasowych (mogą już nie istnieć)
        console.warn('Nie udało się usunąć pliku tymczasowego:', filename);
      }
    };

    // Obserwuj zamykanie modala ustawień
    watch(showSettingsModal, async (isOpen) => {
      if (!isOpen && newAvatarUrl.value) {
        // Jeśli zamykamy modal i mamy niezapisany, nowy avatar -> usuń go
        await cleanupUnsavedAvatar(newAvatarUrl.value);
        newAvatarUrl.value = "";
      }
    });

    // Obserwuj zmianę nowego avatara (np. nadpisanie nowym uploadem)
    watch(newAvatarUrl, async (newVal, oldVal) => {
      if (oldVal && oldVal !== newVal) {
        // Jeśli była poprzednia niezapisana wartość -> usuń ją
        await cleanupUnsavedAvatar(oldVal);
      }
    });

    onMounted(() => {
      loadUserData();
    });

    return {
      user,
      userInitials,
      stats,
      likedCollections,
      likedPagination,
      changeLikedPage,
      formatRelativeTime,
      getImageUrl,
      passwordForm,
      passwordErrors,
      submitChangePassword,
      isChangingPassword,
      passwordServerError,
      newAvatarUrl,
      isSavingAvatar,
      saveAvatar,
      removeAvatar,
      showPasswordModal,
      closePasswordModal,
      isProfilePublic,
      isSavingVisibility,
      toggleProfileVisibility,
      showSettingsModal,
      showDeleteConfirmation,
      deleteConfirmPassword,
      isDeletingAccount,
      deleteAccount,
      showFeedbackModal
    };
  }
};
</script>
