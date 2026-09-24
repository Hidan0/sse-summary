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
