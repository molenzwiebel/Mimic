import Vue from "vue";
import Root from "../root/root";
import { Component, Prop } from "vue-property-decorator";

import RoleUnselected = require("../../static/role-unselected.png");
import RoleTop = require("../../static/role-top.png");
import RoleJungle = require("../../static/role-jungle.png");
import RoleMid = require("../../static/role-mid.png");
import RoleBot = require("../../static/role-bot.png");
import RoleSupport = require("../../static/role-support.png");
import RoleFill = require("../../static/role-fill.png");

export type Role = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "FILL" | "UNSELECTED";

/**
 * Simple role picker. Pressing the X emits the 'selected' event with the same roles.
 */
@Component
export default class RolePicker extends Vue {
    $root: Root;

    // If the picker should be shown.
    @Prop()
    show: boolean;

    // If the user is selecting the first role.
    @Prop()
    selectingFirst: boolean;

    // What the current first role is.
    @Prop()
    firstRole: Role;

    // What the current second role is.
    @Prop()
    secondRole: Role;

    ROLES = [{
        name: "Top",
        key: "TOP",
        image: RoleTop
    }, {
        name: "Jungle",
        key: "JUNGLE",
        image: RoleJungle
    }, {
        name: "Mid",
        key: "MIDDLE",
        image: RoleMid
    }, {
        name: "Bot",
        key: "BOTTOM",
        image: RoleBot
    }, {
        name: "Support",
        key: "UTILITY",
        image: RoleSupport
    }, {
        name: "Fill",
        key: "FILL",
        image: RoleFill
    }];

    /**
     * Closes the modal. Simply emits the 'selected' event with the old roles.
     */
    close() {
        this.$emit("selected", { firstPreference: this.firstRole, secondPreference: this.secondRole });
    }

    /**
     * Computes the new roles and notifies the parent of them.
     */
    select(newRole: Role) {
        const roles = { firstPreference: this.firstRole, secondPreference: this.secondRole };
        if (this.selectingFirst && newRole === roles.secondPreference) {
            roles.secondPreference = roles.firstPreference;
            roles.firstPreference = newRole;
        } else if (newRole === roles.firstPreference) {
            roles.secondPreference = "UNSELECTED";
        } else if (this.selectingFirst) {
            roles.firstPreference = newRole;
            if (newRole === "FILL") roles.secondPreference = "UNSELECTED";
        } else {
            roles.secondPreference = newRole;
        }

        this.$emit("selected", roles);
    }
}