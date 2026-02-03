<template>
  <div>
    <h1 class="text-3xl font-bold text-center mb-6">Rejestracja</h1>

    <!-- Success Message -->
    <div v-if="isSuccess" class="max-w-lg mx-auto bg-green-50 p-8 rounded-lg shadow-sm border border-green-200 text-center">
      <div class="mb-4 text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Konto zostało utworzone!</h2>
      <p class="text-gray-600 mb-6">
        Wysłaliśmy link aktywacyjny na Twój adres email: <strong>{{ email }}</strong>.<br>
        Sprawdź skrzynkę odbiorczą (i folder spam), aby aktywować konto.
      </p>
      <router-link to="/login" class="btn-primary inline-block">
        Przejdź do logowania
      </router-link>
    </div>

    <!-- Registration Form -->
    <form
        v-else
        @submit.prevent="registerUser"
        class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <div v-if="serverError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p class="font-semibold">Wystąpił błąd:</p>
        <p>{{ serverError }}</p>
      </div>

      <div>
        <label for="username" class="block font-bold">Nazwa użytkownika</label>
        <input
            v-model="username"
            @blur="usernameBlur"
            id="username"
            type="text"
            class="input-field"
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
            @blur="emailBlur"
            id="email"
            type="email"
            class="input-field"
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
            @blur="passwordBlur"
            id="password"
            type="password"
            class="input-field"
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
import { ref } from "vue";
import { getUserFriendlyErrorMessage } from "@/utils/errorHandler";

export default {
  name: "RegisterView",
  setup() {
    const isSubmitting = ref(false);
    const serverError = ref("");
    const isSuccess = ref(false);

    // Schema walidacji formularza
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

    // Pola formularza z vee-validate
    // Konfiguracja validateOnValueUpdate: false opóźnia walidację do momentu called handleBlur (lub submit)
    const { handleSubmit, errors } = useForm({ validationSchema: schema });
    
    const { value: username, handleBlur: usernameBlur } = useField("username", undefined, { validateOnValueUpdate: false });
    const { value: email, handleBlur: emailBlur } = useField("email", undefined, { validateOnValueUpdate: false });
    const { value: password, handleBlur: passwordBlur } = useField("password", undefined, { validateOnValueUpdate: false });

    // Obsługa rejestracji
    const registerUser = handleSubmit(async (values) => {
      isSubmitting.value = true;
      serverError.value = "";

      try {
        await AuthService.register({
          username: values.username,
          email: values.email,
          password: values.password
        });

        isSuccess.value = true;
      } catch (error) {
        console.error("Błąd rejestracji:", error.response?.data || error.message);

        // Próba pobrania konkretnego komunikatu błędu z backendu
        let message = "Rejestracja nie powiodła się.";
        
        if (error.response?.data?.message) {
             message = error.response.data.message;
        } else {
             message = getUserFriendlyErrorMessage(error, message);
        }

        serverError.value = message;
      } finally {
        isSubmitting.value = false;
      }
    });

    return {
      username,
      email,
      password,
      usernameBlur,
      emailBlur,
      passwordBlur,
      errors,
      registerUser,
      isSubmitting,
      serverError,
      isSuccess
    };
  }
};
</script>
