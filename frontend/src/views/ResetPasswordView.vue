<!--
  @view ResetPasswordView
  @description Formularz ustawiania nowego hasła.
  Wywoływany z linku w emailu (token w query string).
-->
<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
    <div class="max-w-md w-full bg-white shadow rounded-lg p-6">

      <h2 class="text-2xl font-bold mb-4 text-center">Ustaw nowe hasło</h2>

      <div
          v-if="!token && !success"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-semibold">Nieprawidłowy link</p>
        <p>Brakuje tokena resetu hasła. Użyj ponownie linku z e-maila.</p>
        <div class="mt-4 text-center">
          <router-link :to="{ name: 'ForgotPassword' }" class="text-blue-600 hover:underline">
            Wyślij nowy link resetu
          </router-link>
        </div>
      </div>

      <div
          v-if="serverError && token && !success"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-semibold">Błąd:</p>
        <p>{{ serverError }}</p>
      </div>

      <div
          v-if="success"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center"
      >
        <p class="font-semibold">Hasło zostało zmienione</p>
        <p>Możesz teraz zalogować się używając nowego hasła.</p>
        <button
            @click="goToLogin"
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Przejdź do logowania
        </button>
      </div>

      <form
          v-if="token && !success"
          @submit.prevent="submitNewPassword"
          class="space-y-4 mt-4"
      >
        <div>
          <label class="block font-medium mb-1" for="newPassword">Nowe hasło</label>
          <input
              v-model="form.newPassword"
              id="newPassword"
              type="password"
              class="input-field"
              :class="{ 'border-red-500': errors.newPassword }"
              placeholder="Wpisz nowe hasło"
          />
          <p v-if="errors.newPassword" class="text-red-500 text-sm mt-1">
            {{ errors.newPassword }}
          </p>
        </div>
        
        <div>
          <label class="block font-medium mb-1" for="confirmPassword">Powtórz nowe hasło</label>
          <input
              v-model="form.confirmPassword"
              id="confirmPassword"
              type="password"
              class="input-field"
              :class="{ 'border-red-500': errors.confirmPassword }"
              placeholder="Powtórz nowe hasło"
          />
          <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
            :disabled="isSubmitting"
            :class="{ 'opacity-60 cursor-not-allowed': isSubmitting }"
        >
          <span v-if="!isSubmitting">Zmień hasło</span>
          <span v-else>Zapisywanie…</span>
        </button>

        <div class="text-center mt-4">
          <router-link :to="{ name: 'Login' }" class="text-blue-600 hover:underline">
            Powrót do logowania
          </router-link>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthService from "@/services/AuthService";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { useToast } from "vue-toastification";

export default {
  name: "ResetPasswordView",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const token = ref(null);
    const form = reactive({
      newPassword: "",
      confirmPassword: ""
    });
    const errors = reactive({
      newPassword: "",
      confirmPassword: ""
    });
    const serverError = ref("");
    const isSubmitting = ref(false);
    const success = ref(false);

    const goToLogin = () => {
      router.push({ name: "Login" });
    };

    onMounted(() => {
      const t = route.query.token;
      token.value = typeof t === "string" ? t : null;
    });

    // Walidacja formularza
    const validateForm = () => {
      errors.newPassword = "";
      errors.confirmPassword = "";
      serverError.value = "";

      let valid = true;

      if (!form.newPassword) {
        errors.newPassword = "Podaj nowe hasło.";
        valid = false;
      } else if (form.newPassword.length < 6) {
        errors.newPassword = "Hasło musi mieć co najmniej 6 znaków.";
        valid = false;
      }

      if (!form.confirmPassword) {
        errors.confirmPassword = "Powtórz nowe hasło.";
        valid = false;
      } else if (form.confirmPassword !== form.newPassword) {
        errors.confirmPassword = "Hasła muszą być identyczne.";
        valid = false;
      }

      return valid;
    };

    // Przesyłanie nowego hasła
    const submitNewPassword = async () => {
      if (!token.value) return;
      if (!validateForm()) return;

      isSubmitting.value = true;

      try {
        const response = await AuthService.resetPassword({
          token: token.value,
          newPassword: form.newPassword
        });

        toast.success(response.message || "Hasło zostało zmienione.");
        success.value = true;

        form.newPassword = "";
        form.confirmPassword = "";

        setTimeout(() => {
          router.push({ name: "Login" });
        }, 3000);

      } catch (error) {
        const msg = getUserFriendlyErrorMessage(
            error,
            "Nie udało się zmienić hasła."
        );
        serverError.value = msg;
        toast.error(msg);
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      token,
      form,
      errors,
      serverError,
      isSubmitting,
      success,
      submitNewPassword,
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
