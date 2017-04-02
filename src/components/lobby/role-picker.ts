import Vue from "vue";
import Root from "../root/root";
import { Component, Prop } from "vue-property-decorator";
import { Role, roleImage as constantsRoleImage } from "../../constants";

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
        key: "TOP"
    }, {
        name: "Jungle",
        key: "JUNGLE"
    }, {
        name: "Mid",
        key: "MIDDLE"
    }, {
        name: "Bot",
        key: "BOTTOM"
    }, {
        name: "Support",
        key: "UTILITY"
    }, {
        name: "Fill",
        key: "FILL"
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

    /**
     * @returns the role image for the specified role
     */
    roleImage = constantsRoleImage;
}