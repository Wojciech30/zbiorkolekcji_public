<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
      <div class="mb-6">
        <div class="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
        </div>
      </div>
      
      <h1 class="text-2xl font-bold text-gray-800 mb-4">
        Konto zablokowane
      </h1>
      
      <p class="text-gray-600 mb-8">
        Twoje konto zostało zablokowane przez administratora. 
        Wszystkie Twoje kolekcje i przedmioty zostały usunięte.
      </p>
      
      <p class="text-sm text-gray-500 mb-6">
        Jeśli uważasz, że to pomyłka, skontaktuj się z administratorem serwisu.
      </p>
      
      <button 
          @click="handleLogout"
          class="w-full bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors font-medium"
      >
        Wyloguj się
      </button>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex'

export default {
  name: 'BlockedAccountView',
  setup() {
    const store = useStore()

    const handleLogout = async () => {
      await store.dispatch('auth/logout')
    }

    return {
      handleLogout
    }
  }
}
</script>
