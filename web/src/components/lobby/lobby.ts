import Vue from "vue";
import Component from "vue-class-component";
import Root, { Result } from "../root/root";
import { mapBackground, Role } from "../../constants";

import LobbyMemberComponent from "./lobby-member.vue";
import RolePicker from "./role-picker.vue";
import InviteOverlay from "./invite-overlay.vue";
import { QueueState } from "../queue/queue";

/**
 * Represents a member of the lobby. The summoner
 * property is manually fetched by us, and not a part
 * of the original payload.
 */
export interface LobbyMember {
    summoner: { displayName: string, profileIconId: number };
    allowedInviteOthers: boolean;
    summonerId: number;
    isLeader: boolean;
    isLocalMember: boolean;
    firstPositionPreference: Role;
    secondPositionPreference: Role;
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
    gameConfig: {
        queueId: number;
        mapId: number;
        showPositionSelector: boolean;
        maxLobbySize: number;
    };
    canStartActivity: boolean;
    localMember: LobbyMember;
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
    matchmakingState: QueueState | null = null;

    queueName = "";
    mapName = "";

    showingRolePicker = false;
    pickingFirstRole = false;

    showingInvites = false;

    mounted() {
        // Start observing the lobby.
        this.$root.observe("/lol-lobby/v2/lobby", this.handleLobbyChange.bind(this));

        // Observe matchmaking state for queue dodge timer.
        this.$root.observe("/lol-matchmaking/v1/search", result => {
            this.matchmakingState = result.status === 200 ? result.content : null;
        });

        // Whenever we should show, set the background image.
        this.$watch(() => [this.state, this.backgroundImage], () => {
            document.body.setAttribute("style", this.backgroundImage);
        });
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
            member.summoner = (await this.$root.request("/lol-summoner/v1/summoners/" + member.summonerId)).content;
        }

        for (const invite of state.invitations) {
            invite.toSummoner = (await this.$root.request("/lol-summoner/v1/summoners/" + invite.toSummonerId)).content;
        }

        // Update localMember to also contain the summoner.
        state.localMember = state.members.filter(x => x.summonerId === state.localMember.summonerId)[0];
        state.localMember.isLocalMember = true;

        // Load queue/map info.
        const queueInfo = await this.$root.request("/lol-game-queues/v1/queues/" + state.gameConfig.queueId);
        this.queueName = queueInfo.content.description;

        const mapInfo = await this.$root.request("/lol-maps/v1/map/" + state.gameConfig.mapId);
        this.mapName = mapInfo.content.name;

        // Propagate changes.
        this.state = state;
    };

    /**
     * @returns subtitle shown in the lobby view, detailing queue and map
     */
    get lobbySubtitle(): string {
        if (!this.state) return "";
        return (this.queueName || "Unknown Queue") + " - " + (this.mapName || "Unknown Map");
    }

    /**
     * @returns the background image for the current map
     */
    get backgroundImage(): string {
        if (!this.state) return "";
        return mapBackground(this.state.gameConfig.mapId);
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
        return this.state.localMember.allowedInviteOthers;
    }

    /**
     * @returns the current queue dodge timer, or -1 if there is none
     */
    get queueDodgeTime(): number {
        if (!this.matchmakingState) return -1;
        return this.matchmakingState.errors.reduce((p, c) => c.penaltyTimeRemaining > p ? c.penaltyTimeRemaining : p, -1);
    }

    /**
     * @returns if the website is currently running in "standalone" mode (e.g. added to homescreen)
     */
    get isStandalone(): boolean {
        return !!((<any>navigator).standalone || window.matchMedia('(display-mode: standalone)').matches);
    }

    /**
     * @returns whether or not we can trigger a prompt for the user to add this application to their homescreen (android only)
     */
    get canTriggerHomescreenPrompt(): boolean {
        return !!((<any>window).installPrompt);
    }

    /**
     * Triggers the Android install prompt for the user to add the current app to their homescreen.
     */
    triggerInstallPrompt() {
        if (!this.canTriggerHomescreenPrompt) return;

        (<any>window).installPrompt.prompt();
    }

    /**
     * Confirms if the user wants to leave the lobby, then leaves if neccessary.
     * If the underlying call fails, this will simply do nothing and leave the user in the lobby.
     */
    leaveLobby() {
        if (confirm("Leave the lobby? You cannot rejoin unless you are invited again.")) {
            this.$root.request("/lol-lobby/v2/lobby", "DELETE");
        }
    }

    /**
     * Promotes the specified member to lobby owner, after prompting.
     */
    promoteMember(member: LobbyMember) {
        if (confirm("Promote " + member.summoner.displayName + " to lobby owner?")) {
            this.$root.request("/lol-lobby/v2/lobby/members/" + member.summonerId + "/promote", "POST");
        }
    }

    /**
     * Toggles inviting for the specified member.
     */
    toggleInvite(member: LobbyMember) {
        this.$root.request("/lol-lobby/v2/lobby/members/" + member.summonerId + (member.allowedInviteOthers ? "/revoke-invite" : "/grant-invite"), "POST");
    }

    /**
     * Kicks the specified member after confirming the users intent.
     */
    kickMember(member: LobbyMember) {
        if (confirm("Kick " + member.summoner.displayName + " from the lobby?")) {
            this.$root.request("/lol-lobby/v2/lobby/members/" + member.summonerId + "/kick", "POST");
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
        this.$root.request("/lol-lobby/v2/lobby/members/localMember/position-preferences", "PUT", JSON.stringify(newRoles));
        this.showingRolePicker = false;
    }

    /**
     * Joins the matchmaking queue with the current party.
     */
    joinMatchmaking() {
        this.$root.request("/lol-lobby/v2/lobby/matchmaking/search", "POST");
    }

    /**
     * Formats the provided number of seconds into a XX:YY format.
     */
    formatSeconds(secs: number) {
        return (Math.floor(secs / 60)) + ":" + ("00" + (Math.round(secs) % 60).toFixed(0)).slice(-2);
    }
}