import Vue from "vue";

import Root = require("./components/root/root.vue");
import "vue2-animate/dist/vue2-animate.min.css";

import LcuButton = require("./components/common/lcu-button.vue");
Vue.component("lcu-button", LcuButton);

new (<any>Root)().$mount("#root");