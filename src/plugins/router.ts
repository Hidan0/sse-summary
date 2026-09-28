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
        /*
         * Le skill TSS erano riassunti: i vecchi link portano alle schede.
         */
        { path: "/riassunti/skill-blsd-adulto", redirect: "/skill/tss-blsd-adulto" },
        { path: "/riassunti/skill-disostruzione-adulto", redirect: "/skill/tss-disostruzione-adulto" },
        { path: "/riassunti/skill-disostruzione-infante", redirect: "/skill/tss-disostruzione-infante" },
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
            path: "/skill",
            name: "skill",
            component: () => import("@/pages/SkillPage.vue")
        },
        {
            path: "/skill/:slug",
            name: "skill-dettaglio",
            component: () => import("@/pages/SkillDettaglioPage.vue"),
            props: true
        },
        {
            path: "/scenari",
            name: "scenari",
            component: () => import("@/pages/ScenariPage.vue")
        },
        {
            path: "/scenari/:slug",
            name: "scenario",
            component: () => import("@/pages/ScenarioPage.vue"),
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
            path: "/quiz/sfida",
            name: "quiz-sfida",
            component: () => import("@/pages/QuizSfidaPage.vue")
        },
        {
            path: "/quiz/risultato",
            name: "quiz-risultato",
            component: () => import("@/pages/QuizRisultatoPage.vue")
        },
        {
            path: "/avvertenze",
            name: "avvertenze",
            component: () => import("@/pages/AvvertenzePage.vue")
        },
        {
            path: "/cerca",
            name: "cerca",
            component: () => import("@/pages/CercaPage.vue")
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
