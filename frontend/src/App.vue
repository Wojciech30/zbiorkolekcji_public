<!--
  @component App
  @description Główny komponent aplikacji.
  Zawiera: AppHeader, router-view, stopkę z przyciskiem zgłaszania problemów.
-->
<template>
  <div id="app">
    <!-- Nagłówek -->
    <AppHeader />
    <!-- Dynamiczne wstawianie widoków w zależności od trasy -->
    <router-view />
    <!-- Stopka -->
    <footer>
      <div class="footer-content">
        <p>&copy; 2024 Zbiór Kolekcji. Wszystkie prawa zastrzeżone.</p>
        <button 
          v-if="isAuthenticated"
          @click="showFeedbackModal = true" 
          class="feedback-btn"
        >
          Zgłoś problem
        </button>
      </div>
    </footer>
    
    <!-- Feedback Modal -->
    <FeedbackModal 
      :show="showFeedbackModal" 
      @close="showFeedbackModal = false" 
    />
  </div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue";
import FeedbackModal from "./components/FeedbackModal.vue";
import { mapGetters } from "vuex";
import { ref } from "vue";

export default {
  name: "App",
  components: {
    AppHeader,
    FeedbackModal,
  },
  setup() {
    const showFeedbackModal = ref(false);
    return { showFeedbackModal };
  },
  computed: {
    ...mapGetters("auth", ["isAuthenticated"]),
  },
};
</script>

<style>
/* Styl globalny dla aplikacji */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

footer {
  margin-top: auto;
  background-color: #f8f9fa;
  padding: 10px 20px;
  text-align: center;
  font-size: 0.9em;
  border-top: 1px solid #ddd;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-content p {
  margin: 0;
}

.feedback-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.9em;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.feedback-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
  text-decoration: underline;
}
</style>

