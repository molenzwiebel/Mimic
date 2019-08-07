import Vue from "vue";
import Root from "../root/root";
import { Component } from "vue-property-decorator";
import * as native from "@/util/native";
import * as device from "@/util/device";

@Component
export default class NotificationPrompt extends Vue {
    $root: Root;

    imageLoaded = false;

    async approve() {
        const code = await native.requestNotificationAccess();
        if (!code) {
            // null means that the user denied the native permission screen.
            // We just treat this as denial and stop bothering the user.
            return this.deny();
        }

        this.$root.registerPushNotification(code[0], code[1]);
        device.setPushNotificationApprovalState(this.$root.peerCode, "approved");
    }

    deny() {
        device.setPushNotificationApprovalState(this.$root.peerCode, "denied");
    }

    /**
     * @returns whether or not we're running on an ios device
     */
    get isIOS() {
        return native.isiOSApp;
    }

    /**
     * @returns whether or not we should ask for approval for the current device
     */
    get shouldShow() {
        return native.areNotificationsSupported() && device.getPushNotificationApprovalState(this.$root.peerCode) === "notAsked";
    }
}