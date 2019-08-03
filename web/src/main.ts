import Vue from "vue";

import Root from "./components/root/root.vue";
import "vue2-animate/dist/vue2-animate.min.css";
import "./registerServiceWorker";
import "./root.styl";

import LcuButton from "./components/common/lcu-button.vue";
Vue.component("lcu-button", LcuButton);

// Catch the Android install prompt so that it can be triggered from the tip.
window.addEventListener("beforeinstallprompt", e => {
    (<any>window).installPrompt = e;
});

// Register a dummy event listener to enable use of :active on iOS.
document.addEventListener("touchstart", () => {},false);

// Check for some things we require that aren't in all browsers.
if (typeof window.crypto === "undefined"
    || (typeof window.crypto.subtle === "undefined" && typeof window.crypto.webkitSubtle === "undefined")
    || typeof TextEncoder === "undefined"
    || typeof [].includes === "undefined"
    || typeof Uint8Array === "undefined") {
    alert("Your device is missing critical features required for Mimic to work. Please make sure that you have updated your phone to the newest version. You can proceed on your own risk, but it is very likely that things will break.");
}

new (<any>Root)().$mount("#root");