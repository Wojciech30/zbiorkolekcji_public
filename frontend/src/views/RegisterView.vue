<template>
  <div>
    <h1 class="text-3xl font-bold text-center mb-6">Rejestracja</h1>

    <form
        @submit.prevent="registerUser"
        class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <!-- Globalny błąd z backendu -->
      <div v-if="serverError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p class="font-semibold">Wystąpił błąd:</p>
        <p>{{ serverError }}</p>
      </div>

      <div>
        <label for="username" class="block font-bold">Nazwa użytkownika</label>
        <input
            v-model="username"
            id="username"
            type="text"
            class="border w-full p-2 rounded"
            :class="{ 'border-red-500': errors.username }"
        />
        <p v-if="errors.username" class="text-red-500 text-sm">
          {{ errors.username }}
        </p>
      </div>

      <div>
        <label for="email" class="block font-bold">Email</label>
        <input
            v-model="email"
            id="email"
            type="email"
            class="border w-full p-2 rounded"
            :class="{ 'border-red-500': errors.email }"
        />
        <p v-if="errors.email" class="text-red-500 text-sm">
          {{ errors.email }}
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
        <span v-if="!isSubmitting">Zarejestruj się</span>
        <span v-else>Rejestrowanie...</span>
      </button>
    </form>
  </div>
</template>

<script>
import AuthService from "../services/AuthService";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";

export default {
  name: "RegisterView",
  setup() {
    const toast = useToast();
    const router = useRouter();
    const isSubmitting = ref(false);
    const serverError = ref("");

    const schema = yup.object({
      username: yup.string().required("Nazwa użytkownika jest wymagana"),
      email: yup
          .string()
          .email("Podaj poprawny adres email")
          .required("Email jest wymagany"),
      password: yup
          .string()
          .min(6, "Hasło musi mieć co najmniej 6 znaków")
          .required("Hasło jest wymagane")
    });

    const { handleSubmit, errors } = useForm({ validationSchema: schema });
    const { value: username } = useField("username");
    const { value: email } = useField("email");
    const { value: password } = useField("password");

    const registerUser = handleSubmit(async (values) => {
      isSubmitting.value = true;
      serverError.value = "";

      try {
        await AuthService.register({
          username: values.username,
          email: values.email,
          password: values.password
        });

        toast.success("Rejestracja zakończona sukcesem!");
        await router.push("/login");
      } catch (error) {
        console.error("Błąd rejestracji:", error.response?.data || error.message);

        const message = getUserFriendlyErrorMessage(
            error,
            "Rejestracja nie powiodła się."
        );

        serverError.value = message;
        toast.error(message);
      } finally {
        isSubmitting.value = false;
      }
    });

    return {
      username,
      email,
      password,
      errors,
      registerUser,
      isSubmitting,
      serverError
    };
  }
};
</script>
