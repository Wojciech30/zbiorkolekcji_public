<template>
  <div class="container mx-auto p-4 min-h-screen flex items-center justify-center">
    <div class="text-center max-w-2xl">
      <div class="mb-8 text-blue-500">
        <svg class="w-32 h-32 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>

      <h1 class="text-4xl font-bold text-gray-800 mb-4">
        404 - Strona nie znaleziona
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Ups! Wygląda na to, że strona której szukasz nie istnieje lub została przeniesiona.
      </p>

      <router-link
          to="/"
          class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
      >
        <span class="flex items-center justify-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Powrót do strony głównej
        </span>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  metaInfo() {
    return {
      title: '404 - Strona nie znaleziona',
      meta: [
        { name: 'description', content: 'Strona nie została znaleziona' }
      ]
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #ffffff;
}

@media (prefers-color-scheme: dark) {
  .container {
    background-color: #1a202c;
  }
  h1 {
    color: #f7fafc;
  }
  p {
    color: #cbd5e0;
  }
}
</style>