<!--
  @component AppHeader
  @description Główny nagłówek aplikacji z nawigacją.
  Wyświetla różne linki w zależności od stanu autentykacji.
  Obsługuje responsywne menu mobilne.
  
  @features
  - Logo z linkiem do strony głównej
  - Linki nawigacyjne (desktop): Zaloguj, Zarejestruj lub Moje Kolekcje, Profil, Admin
  - Menu mobilne (hamburger) dla mniejszych ekranów
  - Przycisk wylogowania z potwierdzeniem
-->
<template>
  <header class="bg-gray-800 text-white shadow-lg">
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link
            to="/"
            class="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
        >
          Zbiór Kolekcji
        </router-link>

        <!-- Nawigacja desktop -->
        <div class="hidden md:flex items-center space-x-8">
          <!-- Niezalogowany -->
          <template v-if="!isAuthenticated">
            <router-link
                to="/login"
                class="nav-link"
                active-class="nav-link-active"
            >
              Zaloguj
            </router-link>
            <router-link
                to="/register"
                class="nav-link"
                active-class="nav-link-active"
            >
              Zarejestruj
            </router-link>
          </template>

          <!-- Zalogowany -->
          <template v-else>
            <router-link
                to="/my-collections"
                class="nav-link"
                active-class="nav-link-active"
            >
              Moje Kolekcje
            </router-link>
            <router-link
                to="/profile"
                class="nav-link"
                active-class="nav-link-active"
            >
              Mój Profil
            </router-link>
            <!-- Link do panelu admina (tylko dla adminów) -->
            <router-link
                v-if="isAdmin"
                to="/admin"
                class="nav-link"
                active-class="nav-link-active"
            >
              Panel Admina
            </router-link>
            <button
                @click="handleLogout"
                class="nav-link hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              Wyloguj
            </button>
          </template>
        </div>

        <!-- Przycisk menu mobilnego (hamburger) -->
        <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Menu mobilne -->
      <div v-show="isMobileMenuOpen" class="md:hidden pb-4">
        <div class="pt-4 space-y-4">
          <!-- Niezalogowany -->
          <template v-if="!isAuthenticated">
            <router-link
                to="/login"
                class="mobile-nav-link"
                active-class="mobile-nav-link-active"
                @click="isMobileMenuOpen = false"
            >
              Zaloguj
            </router-link>
            <router-link
                to="/register"
                class="mobile-nav-link"
                active-class="mobile-nav-link-active"
                @click="isMobileMenuOpen = false"
            >
              Zarejestruj
            </router-link>
          </template>

          <!-- Zalogowany -->
          <template v-else>
            <router-link
                to="/my-collections"
                class="mobile-nav-link"
                active-class="mobile-nav-link-active"
                @click="isMobileMenuOpen = false"
            >
              Moje Kolekcje
            </router-link>
            <router-link
                to="/profile"
                class="mobile-nav-link"
                active-class="mobile-nav-link-active"
                @click="isMobileMenuOpen = false"
            >
              Mój Profil
            </router-link>
            <router-link
                v-if="isAdmin"
                to="/admin"
                class="mobile-nav-link"
                active-class="mobile-nav-link-active"
                @click="isMobileMenuOpen = false"
            >
              Panel Admina
            </router-link>
            <button
                @click="handleLogout"
                class="w-full mobile-nav-link hover:bg-red-600"
            >
              Wyloguj
            </button>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
/**
 * @module AppHeader
 * @description Główny nagłówek aplikacji
 * 
 * Używa Vuex store do sprawdzania stanu autentykacji:
 * - auth/isAuthenticated - czy użytkownik jest zalogowany
 * - auth/isAdmin - czy użytkownik ma rolę admin
 * - auth/logout - akcja wylogowania
 */
import {computed, ref} from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

const store = useStore();
const toast = useToast();

/** @type {Ref<boolean>} Stan menu mobilnego */
const isMobileMenuOpen = ref(false);

/** @type {ComputedRef<boolean>} Czy użytkownik jest zalogowany */
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

/** @type {ComputedRef<boolean>} Czy użytkownik jest adminem */
const isAdmin = computed(() => store.getters['auth/isAdmin']);

// Obsługa wylogowania z potwierdzeniem
const handleLogout = async () => {
  if (!window.confirm('Czy na pewno chcesz się wylogować?')) return;

  try {
    await store.dispatch('auth/logout');
  } catch (error) {
    toast.error('Błąd podczas wylogowywania');
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>
/* Styl linków nawigacyjnych (desktop) */
.nav-link {
  @apply px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors;
}

/* Styl linków nawigacyjnych (mobile) */
.mobile-nav-link {
  @apply block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white;
}
</style>