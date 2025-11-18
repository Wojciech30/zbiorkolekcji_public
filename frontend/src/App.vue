<template>
  <div id="app">
    <!-- Nagłówek -->
    <AppHeader />
    <!-- Dynamiczne wstawianie widoków w zależności od trasy -->
    <router-view />
    <!-- Stopka (opcjonalna) -->
    <footer>
      <p>&copy; 2024 Zbiór Kolekcji. Wszystkie prawa zastrzeżone.</p>
    </footer>
  </div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue"; // Nagłówek aplikacji
import { mapActions } from "vuex";

export default {
  name: "App",
  components: {
    AppHeader,
  },
  created() {
    this.fetchProfile();
  },
  methods: {
    ...mapActions(["fetchProfile"]),
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
  padding: 10px;
  text-align: center;
  font-size: 0.9em;
  border-top: 1px solid #ddd;
}
</style>
