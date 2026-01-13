import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";
import SingleItemView from "@/views/SingleItemView.vue";

const routes = [
    {
        path: "/",
        name: "Home",
        component: () => import("@/views/HomeView.vue"),
        meta: { access: "public" }
    },
    {
        path: "/login",
        name: "Login",
        component: () => import("@/views/LoginView.vue"),
        meta: { access: "guest", hideForAuth: true }
    },
    {
        path: "/register",
        name: "Register",
        component: () => import("@/views/RegisterView.vue"),
        meta: { access: "guest", hideForAuth: true }
    },
    {
        path: "/verify-email",
        name: "VerifyEmail",
        component: () => import("@/views/VerifyEmailView.vue"),
        meta: { access: "public" }
    },
    {
        path: "/forgot-password",
        name: "ForgotPassword",
        component: () => import("@/views/ForgotPasswordView.vue"),
        meta: { access: "public" }
    },
    {
        path: "/reset-password",
        name: "ResetPassword",
        component: () => import("@/views/ResetPasswordView.vue"),
        meta: { access: "public" }
    },
    {
        path: "/profile",
        name: "Profile",
        component: () => import("@/views/ProfileView.vue"),
        meta: { access: "user" }
    },
    {
        path: "/my-collections",
        name: "MyCollections",
        component: () => import("@/views/CollectionsView.vue"),
        meta: { access: "user" }
    },
    {
        path: "/collections",
        name: "PublicCollections",
        component: () => import("@/views/CollectionsView.vue"),
        meta: { access: "public" }
    },
    {
        path: "/collections/:id",
        name: "SingleCollection",
        component: () => import("@/views/SingleCollectionView.vue"),
        meta: { access: "public" },
        props: true
    },
    {
        path: "/items/:id",
        name: "SingleItem",
        component: SingleItemView,
        meta: { access: "public" },
        props: true
    },
    {
        path: "/categories/:id/collections",
        name: "CategoryCollections",
        component: () => import("@/views/CategoryView.vue"),
        meta: { access: "public" },
        props: true
    },
    {
        path: "/admin",
        name: "AdminPanel",
        component: () => import("@/views/AdminPanelView.vue"),
        meta: { access: "admin" }
    },
    {
        path: "/blocked",
        name: "BlockedAccount",
        component: () => import("@/views/BlockedAccountView.vue"),
        meta: { access: "blocked" }
    },
    {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: () => import("@/views/NotFoundView.vue"),
        meta: { access: "public" }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(
        record => record.meta.access === "user" || record.meta.access === "admin"
    );
    const requiresAdmin = to.matched.some(
        record => record.meta.access === "admin"
    );
    const isAuthenticated = store.getters["auth/isAuthenticated"];
    const isAdmin = store.getters["auth/isAdmin"];
    const isBlocked = store.getters["auth/isBlocked"];

    // Zablokowany użytkownik może być tylko na stronie /blocked
    if (isBlocked && to.name !== "BlockedAccount") {
        return next({ name: "BlockedAccount" });
    }

    // Niezablokowany użytkownik nie powinien widzieć strony /blocked
    if (!isBlocked && to.name === "BlockedAccount") {
        return next({ name: "Home" });
    }

    if (to.meta.access === "guest" && isAuthenticated) {
        return next({ name: "Home" });
    }

    if (requiresAuth && !isAuthenticated) {
        return next({
            name: "Login",
            query: { redirect: to.fullPath }
        });
    }

    if (requiresAdmin && !isAdmin) {
        return next({ name: "Home" });
    }

    next();
});

export default router;
