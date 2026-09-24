import { createApp } from "vue";

import App from "./App.vue";
import plugins from "./plugins";

const app = createApp(App).use(plugins);

export default app.mount("#app");
