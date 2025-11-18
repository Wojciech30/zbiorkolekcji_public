import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store'; // Import Vuex
import './assets/tailwind.css'; // Tailwind CSS
import { configure } from 'vee-validate';
import Toaster from '@meforma/vue-toaster';

configure({
    generateMessage: (ctx) => {
        const messages = {
            required: `${ctx.field} jest wymagane.`,
            email: `${ctx.field} musi być poprawnym adresem email.`,
        };
        return messages[ctx.rule.name] || `${ctx.field} jest nieprawidłowe.`;
    },
});

createApp(App)
    .use(router)
    .use(store)
    .use(Toaster)
    .mount('#app');
