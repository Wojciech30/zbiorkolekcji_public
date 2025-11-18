<template>
  <div class="container mx-auto p-4">
    <header>
      <h1 class="text-4xl font-bold">Mój Profil</h1>
      <p class="text-gray-600">Zarządzaj swoimi danymi osobowymi i ustawieniami.</p>
    </header>

    <!-- Formularz edycji danych użytkownika -->
    <section class="mt-8">
      <h2 class="text-2xl font-semibold">Dane osobowe</h2>
      <form @submit.prevent="updateProfile">
        <div class="mt-4">
          <label for="firstName" class="block">Imię:</label>
          <input
              v-model="firstName"
              type="text"
              id="firstName"
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': errors.firstName }"
          />
          <p v-if="errors.firstName" class="text-red-500 text-sm">{{ errors.firstName }}</p>
        </div>
        <div class="mt-4">
          <label for="lastName" class="block">Nazwisko:</label>
          <input
              v-model="lastName"
              type="text"
              id="lastName"
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': errors.lastName }"
          />
          <p v-if="errors.lastName" class="text-red-500 text-sm">{{ errors.lastName }}</p>
        </div>
        <div class="mt-4">
          <label for="email" class="block">Adres e-mail:</label>
          <input
              v-model="email"
              type="email"
              id="email"
              class="w-full p-2 border rounded"
              :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</p>
        </div>
        <button type="submit" class="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Zapisz zmiany
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import AuthService from "@/services/AuthService";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { useToast } from "vue-toastification";

export default {
  setup() {
    const toast = useToast(); // Obsługa powiadomień

    // Walidacja formularza
    const schema = yup.object({
      firstName: yup.string().required("Imię jest wymagane."),
      lastName: yup.string().required("Nazwisko jest wymagane."),
      email: yup.string().email("Podaj poprawny adres email.").required("Email jest wymagany."),
    });

    const { handleSubmit, errors } = useForm({ validationSchema: schema });
    const { value: firstName } = useField("firstName");
    const { value: lastName } = useField("lastName");
    const { value: email } = useField("email");

    // Aktualizacja profilu użytkownika
    const updateProfile = handleSubmit(async (values) => {
      try {
        await AuthService.updateProfile(values);
        toast.success("Profil został zaktualizowany.");
      } catch (error) {
        console.error("Błąd aktualizacji profilu:", error);
        toast.error("Nie udało się zaktualizować profilu.");
      }
    });

    return {
      firstName,
      lastName,
      email,
      errors,
      updateProfile,
    };
  },
};
</script>
