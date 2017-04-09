import Vue from "vue";
import Root from "../root/root";
import { Component, Prop } from "vue-property-decorator";
import Lobby, { InvitationMetadata, LobbyState } from "./lobby";


interface InvitationSuggestion {
    summonerId: number;
    summonerName: string;
}

/**
 * Simple role picker. Pressing the X emits the 'selected' event with the same roles.
 */
@Component
export default class InviteOverlay extends Vue {
    $root: Root;

    @Prop()
    show: boolean;

    @Prop()
    state: LobbyState;

    inviteName: string = "";
    suggestions: InvitationSuggestion[] = [];

    mounted() {
        this.$root.observe("/lol-suggested-players/v1/suggested-players", result => {
            this.suggestions = result.status === 200 ? result.content : [];
        });
    }

    destroyed() {
        this.$root.unobserve("/lol-suggested-players/v1/suggested-players");
    }

    /**
     * Invites the summoner with the specified id.
     */
    invite(toSummonerId: number) {
        this.$root.request("/lol-lobby/v2/lobby/invitations", "POST", JSON.stringify([{ toSummonerId }]));
    }

    /**
     * Searches for the summoner the user entered, inviting them if they exist.
     */
    inviteManually() {
        this.$root.request("/lol-summoner/v1/summoners?name=" + encodeURIComponent(this.inviteName)).then(result => {
            if (result.status !== 200) {
                alert("Summoner " + this.inviteName + " was not found. Did you spell the name properly?");
                return;
            }

            this.invite(result.content.summonerId);
            this.inviteName = ""; // clear field
        });
    }

    /**
     * Returns an icon name that shows the state of the specified invite.
     */
    getInvitationIcon(invite: InvitationMetadata): string {
        if (invite.state === "Declined") return "ion-close";
        if (invite.state === "Accepted") return "ion-checkmark";
        if (invite.state === "Kicked") return "ion-close"; // maybe find a better icon for this?
        return "ion-ios-more";
    }
}