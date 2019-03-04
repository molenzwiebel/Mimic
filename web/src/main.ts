import Vue from "vue";

import Root from "./components/root/root.vue";
import "vue2-animate/dist/vue2-animate.min.css";
import "./registerServiceWorker";

import LcuButton from "./components/common/lcu-button.vue";
Vue.component("lcu-button", LcuButton);

// Catch the Android install prompt so that it can be triggered from the tip.
window.addEventListener("beforeinstallprompt", e => {
    (<any>window).installPrompt = e;
});

new (<any>Root)().$mount("#root");