<template>
  <div class="container mx-auto p-4">
    <header>
      <h1 class="text-4xl font-bold">Mój Profil</h1>
      <p class="text-gray-600">
        Zmień swoje hasło, podając aktualne.
      </p>
    </header>
    <section class="mt-12 max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-semibold mb-6 text-center">Zmiana hasła</h2>

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
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': passwordErrors.currentPassword }"
          />
          <p v-if="passwordErrors.currentPassword" class="text-red-500 text-sm">
            {{ passwordErrors.currentPassword }}
          </p>
        </div>

        <div>
          <label for="newPassword" class="block font-medium mb-1">Nowe hasło</label>
          <input
              v-model="passwordForm.newPassword"
              type="password"
              id="newPassword"
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': passwordErrors.newPassword }"
          />
          <p v-if="passwordErrors.newPassword" class="text-red-500 text-sm">
            {{ passwordErrors.newPassword }}
          </p>
        </div>

        <div>
          <label for="confirmPassword" class="block font-medium mb-1">Powtórz nowe hasło</label>
          <input
              v-model="passwordForm.confirmPassword"
              type="password"
              id="confirmPassword"
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': passwordErrors.confirmPassword }"
          />
          <p v-if="passwordErrors.confirmPassword" class="text-red-500 text-sm">
            {{ passwordErrors.confirmPassword }}
          </p>
        </div>

        <button
            type="submit"
            class="w-full mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
            :class="{ 'opacity-60 cursor-not-allowed': isChangingPassword }"
            :disabled="isChangingPassword"
        >
          <span v-if="!isChangingPassword">Zmień hasło</span>
          <span v-else>Zmiana hasła...</span>
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import AuthService from "@/services/AuthService";
import { useToast } from "vue-toastification";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";
import { ref, reactive } from "vue";

export default {
  name: "ProfileView",
  setup() {
    const toast = useToast();

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
        passwordErrors.newPassword =
            "Nowe hasło musi mieć co najmniej 6 znaków.";
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
      } catch (error) {
        console.error("Błąd zmiany hasła:", error);
        const msg = getUserFriendlyErrorMessage(
            error,
            "Nie udało się zmienić hasła."
        );
        passwordServerError.value = msg;
        toast.error(msg);
      } finally {
        isChangingPassword.value = false;
      }
    };

    return {
      passwordForm,
      passwordErrors,
      submitChangePassword,
      isChangingPassword,
      passwordServerError
    };
  }
};
</script>
