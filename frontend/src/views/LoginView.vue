<template>
  <div>
    <h1 class="text-3xl font-bold text-center mb-6">Logowanie</h1>
    <form @submit.prevent="loginUser" class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <div>
        <label for="username" class="block font-bold">Nazwa użytkownika</label>
        <input
            v-model="username"
            id="username"
            type="text"
            class="border w-full p-2 rounded"
            :class="{ 'border-red-500': errors.username }"
        />
        <p v-if="errors.username" class="text-red-500 text-sm">{{ errors.username }}</p>
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
        <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
      </div>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-full">
        Zaloguj się
      </button>
    </form>
  </div>
</template>

<script>
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

export default {
  name: "LoginView",
  setup() {
    const toast = useToast();
    const router = useRouter();
    const store = useStore();

    // Rozszerzona walidacja
    const schema = yup.object({
      username: yup.string().required("Nazwa użytkownika jest wymagana"),
      password: yup.string()
          .required("Hasło jest wymagane")
    });

    const { handleSubmit, errors } = useForm({ validationSchema: schema });
    const { value: username } = useField("username");
    const { value: password } = useField("password");

    const loginUser = handleSubmit(async (values) => {
      try {
        await store.dispatch("auth/login", values);
        toast.success("Zalogowano pomyślnie!");
        await router.push({name: "Home"});
      } catch (error) {
        toast.error(error.message || "Błąd serwera");
      }
    });

    return { username, password, errors, loginUser };
  }
};
</script>