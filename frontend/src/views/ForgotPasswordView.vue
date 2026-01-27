<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
    <div class="max-w-md w-full bg-white shadow rounded-lg p-6">

      <h2 class="text-2xl font-bold mb-4 text-center">Odzyskiwanie hasła</h2>
      <p class="text-gray-600 mb-6 text-center">
        Podaj swój adres e-mail. Jeśli konto istnieje, wyślemy instrukcje resetu hasła.
      </p>

      <div
          v-if="serverError"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-semibold">Błąd:</p>
        <p>{{ serverError }}</p>
      </div>

      <form @submit.prevent="submitEmail" class="space-y-4">

        <div>
          <label class="block font-medium mb-1" for="email">Adres e-mail</label>
          <input
              v-model="email"
              id="email"
              type="email"
              class="input-field"
              :class="{ 'border-red-500': emailError }"
              placeholder="twoj@email.com"
          />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        </div>

        <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
            :disabled="isSubmitting"
            :class="{ 'opacity-60 cursor-not-allowed': isSubmitting }"
        >
          <span v-if="!isSubmitting">Wyślij instrukcje</span>
          <span v-else>Wysyłanie…</span>
        </button>

      </form>

      <div class="text-center mt-4">
        <router-link :to="{ name: 'Login' }" class="text-blue-600 hover:underline">
          Powrót do logowania
        </router-link>
      </div>

    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import AuthService from "@/services/AuthService";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { useToast } from "vue-toastification";

export default {
  name: "ForgotPasswordView",
  setup() {
    const email = ref("");
    const emailError = ref("");
    const serverError = ref("");
    const isSubmitting = ref(false);
    const toast = useToast();

    const validateEmail = () => {
      emailError.value = "";

      if (!email.value) {
        emailError.value = "Podaj adres e-mail.";
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value)) {
        emailError.value = "Podaj poprawny adres e-mail.";
        return false;
      }

      return true;
    };

    const submitEmail = async () => {
      serverError.value = "";

      if (!validateEmail()) return;

      isSubmitting.value = true;

      try {
        const response = await AuthService.forgotPassword(email.value);

        toast.success(response.message || "Jeśli konto istnieje, wysłaliśmy instrukcje resetu hasła.");

        email.value = "";

      } catch (error) {
        const msg = getUserFriendlyErrorMessage(
            error,
            "Nie udało się wysłać instrukcji resetu hasła."
        );
        serverError.value = msg;
        toast.error(msg);
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      email,
      emailError,
      serverError,
      isSubmitting,
      submitEmail
    };
  }
};
</script>

<style scoped>
.min-h-\[60vh\] {
  min-height: 60vh;
}
</style>
