<!--
  @view VerifyEmailView
  @description Strona weryfikacji emaila.
  Obsługuje token z URL i wyświetla status weryfikacji.
-->
<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
    <div class="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">

      <template v-if="isLoading">
        <h2 class="text-xl font-semibold mb-2">Potwierdzanie adresu e-mail…</h2>
        <p class="text-gray-600">Proszę czekać…</p>
      </template>

      <template v-else>
        <h2 class="text-xl font-semibold mb-2">{{ title }}</h2>
        <p :class="success ? 'text-green-600' : 'text-red-600'">
          {{ message }}
        </p>

        <button
            v-if="success"
            @click="goToLogin"
            class="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Przejdź do logowania
        </button>
      </template>

    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthService from "@/services/AuthService";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { useToast } from "vue-toastification";

export default {
  name: "VerifyEmailView",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const isLoading = ref(true);
    const success = ref(false);
    const title = ref("");
    const message = ref("");

    const goToLogin = () => {
      router.push({ name: "Login" });
    };

    onMounted(async () => {
      const token = route.query.token;

      if (!token) {
        isLoading.value = false;
        success.value = false;
        title.value = "Brak tokena";
        message.value =
            "Nieprawidłowy link potwierdzający. Poproś o nowy link.";
        return;
      }

      try {
        const response = await AuthService.verifyEmail(token);

        success.value = true;
        title.value = "E-mail został potwierdzony!";
        message.value = response.message || "Możesz się teraz zalogować.";

        setTimeout(() => {
          router.push({ name: "Login" });
        }, 3000);

      } catch (error) {
        const msg = getUserFriendlyErrorMessage(
            error,
            "Nie udało się potwierdzić adresu e-mail."
        );

        success.value = false;
        title.value = "Niepowodzenie";
        message.value = msg;

        toast.error(msg);

      } finally {
        isLoading.value = false;
      }
    });

    return {
      isLoading,
      success,
      title,
      message,
      goToLogin
    };
  }
};
</script>

<style scoped>
.min-h-\[60vh\] {
  min-height: 60vh;
}
</style>
