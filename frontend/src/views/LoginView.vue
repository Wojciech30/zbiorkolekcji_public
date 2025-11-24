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
      </div>

      <div>
        <label for="identifier" class="block font-bold">
          Adres e-mail lub nazwa użytkownika
        </label>
        <input
            v-model="identifier"
            id="identifier"
            type="text"
            class="border w-full p-2 rounded"
            :class="{ 'border-red-500': errors.identifier }"
        />
        <p v-if="errors.identifier" class="text-red-500 text-sm">
          {{ errors.identifier }}
        </p>
      </div>

      <div>
        <label for="password" class="block font-bold">Hasło</label>
        <input
            v-model="password"
            id="password"
            type="password"
            class="border w-full p-2 rounded"
            :class="{ 'border-red-500': errors.password }"
        />
        <p v-if="errors.password" class="text-red-500 text-sm">
          {{ errors.password }}
        </p>
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
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ref } from "vue";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";

export default {
  name: "LoginView",
  setup() {
    const toast = useToast();
    const router = useRouter();
    const store = useStore();

    const isSubmitting = ref(false);
    const serverError = ref("");

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

      try {
        await store.dispatch("auth/login", values);
        toast.success("Zalogowano pomyślnie!");
        await router.push({ name: "Home" });
      } catch (error) {
        const message = getUserFriendlyErrorMessage(
            error,
            "Nie udało się zalogować."
        );

        serverError.value = message;
        toast.error(message);
      } finally {
        isSubmitting.value = false;
      }
    });

    return {
      identifier,
      password,
      errors,
      loginUser,
      isSubmitting,
      serverError
    };
  }
};
</script>
