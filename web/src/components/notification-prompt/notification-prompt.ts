import Vue from "vue";
import Root from "../root/root";
import { Component } from "vue-property-decorator";
import { isAndroidApp, isiOSApp } from "@/util/native";

@Component
export default class NotificationPrompt extends Vue {
    $root: Root;

    imageLoaded = false;

    get isIOS() {
        return isiOSApp;
    }

    get shouldShow() {
        return true; // isAndroidApp || isiOSApp;
    }
}