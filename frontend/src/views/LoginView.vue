<template>
  <div>
    <h1 class="text-3xl font-bold text-center mb-6">Logowanie</h1>

    <form
        @submit.prevent="loginUser"
        class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <div
          v-if="serverError"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
      >
        <p class="font-semibold">Wystąpił błąd:</p>
        <p>{{ serverError }}</p>

        <div
          v-if="canResendVerification"
          class="mt-3 pt-3 border-t border-red-200 text-sm"
        >
          <p class="mb-2">
            Twój adres e-mail nie został potwierdzony.
            Jeśli nie otrzymałeś wiadomości aktywacyjnej, możesz wysłać link ponownie.
          </p>

          <button
            type="button"
            @click="resendVerification"
            class="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isResending"
          >
            <span v-if="!isResending">Wyślij link ponownie</span>
            <span v-else>Wysyłanie...</span>
          </button>

          <p v-if="resendInfo" class="mt-2 text-red-800">
            {{ resendInfo }}
          </p>
        </div>
      </div>

      <div>
        <label for="identifier" class="block font-bold">
          Adres e-mail lub nazwa użytkownika
        </label>
        <input
            v-model="identifier"
            id="identifier"
            type="text"
            class="input-field"
            :class="{ 'border-red-500': errors.identifier }"
        />
        <p v-if="errors.identifier" class="text-red-500 text-sm">
          {{ errors.identifier }}
        </p>
      </div>

      <div>
        <label for="password" class="block font-bold">Hasło</label>
        <div class="relative">
          <input
              v-model="password"
              id="password"
              :type="showPassword ? 'text' : 'password'"
              class="input-field pr-10"
              :class="{ 'border-red-500': errors.password }"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <!-- Eye icon (visible) -->
            <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <!-- Eye-off icon (hidden) -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="text-red-500 text-sm">
          {{ errors.password }}
        </p>
      </div>

      <div class="flex items-center">
        <input
          v-model="rememberMe"
          id="rememberMe"
          type="checkbox"
          class="h-4 w-4 text-blue-600 rounded"
        />
        <label for="rememberMe" class="ml-2 text-gray-700">
          Nie wylogowuj mnie
        </label>
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold"
          :class="{ 'opacity-60 cursor-not-allowed': isSubmitting }"
          :disabled="isSubmitting"
      >
        <span v-if="!isSubmitting">Zaloguj się</span>
        <span v-else>Logowanie...</span>
      </button>
    </form>

    <div class="text-center mt-4">
      <router-link :to="{ name: 'ForgotPassword' }" class="text-blue-600 hover:underline">
        Nie pamiętasz hasła?
      </router-link>
    </div>
  </div>
</template>

<script>
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { useToast } from "vue-toastification";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { ref } from "vue";
import { normalizeApiError, getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import apiClient from "@/services/apiClient";

export default {
  name: "LoginView",
  setup() {
    const toast = useToast();
    const router = useRouter();
    const route = useRoute();
    const store = useStore();

    const isSubmitting = ref(false);
    const serverError = ref("");
    const showPassword = ref(false);
    const rememberMe = ref(false);

    const canResendVerification = ref(false);
    const isResending = ref(false);
    const resendInfo = ref("");

    const schema = yup.object({
      identifier: yup
          .string()
          .required("Nazwa użytkownika lub e-mail jest wymagana"),
      password: yup.string().required("Hasło jest wymagane")
    });

    const { handleSubmit, errors } = useForm({ validationSchema: schema });
    const { value: identifier } = useField("identifier");
    const { value: password } = useField("password");

    const loginUser = handleSubmit(async (values) => {
      isSubmitting.value = true;
      serverError.value = "";
      canResendVerification.value = false;
      resendInfo.value = "";

      try {
        await store.dispatch("auth/login", { ...values, rememberMe: rememberMe.value });
        toast.success("Zalogowano pomyślnie!");
        
        // Redirect to original page or home
        const redirectTo = route.query.redirect || "/";
        await router.push(redirectTo);
      } catch (error) {
        const normalized = normalizeApiError(
          error,
          "Nie udało się zalogować."
        );

        const message = normalized.message || getUserFriendlyErrorMessage(
          error,
          "Nie udało się zalogować."
        );

        serverError.value = message;
        toast.error(message);

        canResendVerification.value = normalized.code === "EMAIL_NOT_VERIFIED";
      } finally {
        isSubmitting.value = false;
      }
    });

    const resendVerification = async () => {
      resendInfo.value = "";

      if (!identifier.value) {
        resendInfo.value = "Podaj swój adres e-mail w polu logowania.";
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.value)) {
        resendInfo.value =
          "Aby wysłać link aktywacyjny, podaj swój adres e-mail (nie samą nazwę użytkownika).";
        return;
      }

      isResending.value = true;

      try {
        const response = await apiClient.post("/auth/resend-verification", {
          email: identifier.value
        });

        const msg =
          response.data?.message ||
          "Jeśli konto istnieje, wysłaliśmy ponownie link aktywacyjny.";
        resendInfo.value = msg;
        toast.success(msg);
      } catch (error) {
        const msg = getUserFriendlyErrorMessage(
          error,
          "Nie udało się wysłać linku aktywacyjnego."
        );
        resendInfo.value = msg;
        toast.error(msg);
      } finally {
        isResending.value = false;
      }
    };

    return {
      identifier,
      password,
      errors,
      loginUser,
      isSubmitting,
      serverError,
      showPassword,
      rememberMe,
      canResendVerification,
      isResending,
      resendInfo,
      resendVerification
    };
  }
};
</script>
