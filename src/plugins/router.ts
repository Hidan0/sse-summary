import { createRouter, createWebHashHistory } from "vue-router";

import HomePage from "@/pages/HomePage.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomePage
        },
        {
            path: "/riassunti/:slug",
            name: "riassunto",
            component: () => import("@/pages/RiassuntoPage.vue"),
            props: true
        },
        {
            path: "/abcde",
            name: "abcde",
            component: () => import("@/pages/AbcdePage.vue")
        },
        {
            path: "/abcde/schema/:schema",
            name: "schema-abcde",
            component: () => import("@/pages/SchemaAbcdePage.vue"),
            props: true
        },
        {
            path: "/abcde/fase/:sezione",
            name: "lettera-abcde",
            component: () => import("@/pages/LetteraAbcdePage.vue"),
            props: true
        },
        {
            path: "/abcde/:slug",
            name: "scheda-abcde",
            component: () => import("@/pages/SchedaAbcdePage.vue"),
            props: true
        },
        {
            path: "/quiz",
            name: "quiz",
            component: () => import("@/pages/QuizPage.vue")
        },
        {
            path: "/quiz/sessione",
            name: "quiz-sessione",
            component: () => import("@/pages/QuizSessionePage.vue")
        },
        {
            path: "/glossario",
            name: "glossario",
            component: () => import("@/pages/GlossarioPage.vue")
        },
        {
            path: "/glossario/:slug",
            name: "voce-glossario",
            component: () => import("@/pages/VoceGlossarioPage.vue"),
            props: true
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: { name: "home" }
        }
    ],
    scrollBehavior: (to, from, savedPosition) =>
    {
        if (savedPosition) { return savedPosition; }
        if (to.hash) { return { el: to.hash, behavior: "smooth" }; }
        if (to.path !== from.path) { return { top: 0 }; }

        return undefined;
    }
});

export default router;
