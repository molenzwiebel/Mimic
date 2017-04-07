import Vue from "vue";
import Component from "vue-class-component";
import Root, { Result } from "../root/root";
import { mapBackground, MAPS, QUEUES, Role } from "../../constants";

import LobbyMemberComponent = require("./lobby-member.vue");
import RolePicker = require("./role-picker.vue");
import InviteOverlay = require("./invite-overlay.vue");

/**
 * Represents a member of the lobby. The summoner
 * property is manually fetched by us, and not a part
 * of the original payload.
 */
export interface LobbyMember {
    summoner: { displayName: string, profileIconId: number };
    canInviteOthers: boolean;
    id: number;
    isOwner: boolean;
    isLocalMember: boolean;
    positionPreferences: {
        firstPreference: Role;
        secondPreference: Role;
    }
}

/**
 * Represents a (pending) invitation to the current lobby.
 */
export interface InvitationMetadata {
    id: string;
    state: "Pending" | "Declined" | "Accepted" | "Kicked";
    toSummonerId: number;
    toSummoner: { displayName: string }; // Loaded manually.
}

/**
 * Represents a lobby. Note that this is a non-exhaustive
 * list of properties that only contain the ones we are using.
 */
export interface LobbyState {
    queueId: number;
    mapId: number;
    canStartMatchmaking: boolean;
    showPositionSelector: boolean;
    localMember: LobbyMember;
    maximumParticipantListSize: number;
    members: LobbyMember[];
    invitations: InvitationMetadata[];
}

@Component({
    components: {
        lobbyMember: LobbyMemberComponent,
        rolePicker: RolePicker,
        lobbyInvites: InviteOverlay
    }
})
export default class Lobby extends Vue {
    $root: Root;
    state: LobbyState | null = null;

    showingRolePicker = false;
    pickingFirstRole = false;

    showingInvites = false;

    mounted() {
        // Start observing the lobby.
        this.$root.observe("/lol-lobby/v1/lobby", this.handleLobbyChange.bind(this));
    }

    /**
     * Handles a change to the /lol-lobby/v1/lobby endpoint. Loads
     * summoner information, then delegates diff computing to Vue.
     *
     * Note: this cannot be an arrow function and instead needs to be bound. To quote vue-class-component:
     * "vue-class-component collects class properties as Vue instance data by instantiating the original
     * constructor under the hood. While we can define instance data like native class manner, we sometimes
     * need to know how it works. For example, if you define an arrow function as a class property and access
     * this in it, it will not work. This is because this is just a proxy object to Vue instance when
     * initializing class properties."
     */
    handleLobbyChange = async function(this: Lobby, result: Result) {
        if (result.status !== 200) {
            this.state = null;
            return;
        }

        // Load summoner info.
        const state: LobbyState = result.content;
        for (const member of state.members) {
            member.isLocalMember = false;
            member.summoner = (await this.$root.request("/lol-summoner/v1/summoners/" + member.id)).content;
        }

        for (const invite of state.invitations) {
            invite.toSummoner = (await this.$root.request("/lol-summoner/v1/summoners/" + invite.toSummonerId)).content;
        }

        // Update localMember to also contain the summoner.
        state.localMember = state.members.filter(x => x.id === state.localMember.id)[0];
        state.localMember.isLocalMember = true;

        // Propagate changes.
        this.state = state;
    };

    /**
     * @returns subtitle shown in the lobby view, detailing queue and map
     */
    get lobbySubtitle(): string {
        if (!this.state) return "";
        return (QUEUES[this.state.queueId] || "Unknown Queue") + " - " + (MAPS[this.state.mapId] || "Unknown Map");
    }

    /**
     * @returns the background image for the current map
     */
    get backgroundImage(): string {
        if (!this.state) return "";
        return mapBackground(this.state.mapId);
    }

    /**
     * @returns the lobby members, with the current user on top.
     */
    get lobbyMembers(): LobbyMember[] {
        if (!this.state) return [];
        return [this.state.localMember, ...(this.state.members.filter(x => x !== this.state!!.localMember))];
    }

    /**
     * @returns if the invite prompt should be shown
     */
    get showInvitePrompt(): boolean {
        if (!this.state) return false;
        return this.state.localMember.canInviteOthers;
    }

    /**
     * Confirms if the user wants to leave the lobby, then leaves if neccessary.
     * If the underlying call fails, this will simply do nothing and leave the user in the lobby.
     */
    leaveLobby() {
        if (confirm("Leave the lobby? You cannot rejoin unless you are invited again.")) {
            this.$root.request("/lol-lobby/v1/lobby", "DELETE");
        }
    }

    /**
     * Promotes the specified member to lobby owner, after prompting.
     */
    promoteMember(member: LobbyMember) {
        if (confirm("Promote " + member.summoner.displayName + " to lobby owner?")) {
            this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + "/promote", "POST");
        }
    }

    /**
     * Toggles inviting for the specified member.
     */
    toggleInvite(member: LobbyMember) {
        this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + (member.canInviteOthers ? "/revoke-invite" : "/grant-invite"), "POST");
    }

    /**
     * Kicks the specified member after confirming the users intent.
     */
    kickMember(member: LobbyMember) {
        if (confirm("Kick " + member.summoner.displayName + " from the lobby?")) {
            this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + "/kick", "POST");
        }
    }

    /**
     * Shows the role picker.
     */
    showRolePicker(firstRole: boolean) {
        this.showingRolePicker = true;
        this.pickingFirstRole = firstRole;
    }

    /**
     * Invoked from the role picker, updates the user with the new roles.
     */
    updateRoles(newRoles: any) {
        this.$root.request("/lol-lobby/v1/lobby/members/localMember/position-preferences", "PUT", JSON.stringify(newRoles));
        this.showingRolePicker = false;
    }

    /**
     * Joins the matchmaking queue with the current party.
     */
    joinMatchmaking() {
        this.$root.request("/lol-matchmaking/v1/search", "POST");
    }
}