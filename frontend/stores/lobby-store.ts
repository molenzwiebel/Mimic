import { computed, observable } from "mobx";
import socket, { Result } from "../utils/socket";
import confirm from "../utils/confirm";
import { getMapBackground } from "../utils/constants";

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
    firstPositionPreference: string;
    secondPositionPreference: string;
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

export class LobbyStore {
    @observable
    inviteOverlayOpen = false;

    @observable
    roleOverlayOpen = false;

    @observable
    isPickingFirstRole = true;

    @observable
    mapName = "";

    @observable
    queueName = "";

    @observable
    state: LobbyState | null = null;

    constructor() {
        socket.observe("/lol-lobby/v2/lobby", this.handleLobbyChange.bind(this));
    }

    /**
     * Toggles whether the invite overlay is currently shown.
     */
    public toggleInviteOverlay() {
        this.inviteOverlayOpen = !this.inviteOverlayOpen;
    }

    /**
     * Toggles whether the role overlay is currently shown.
     * @param isFirstRole whether we're picking the first role or not
     */
    public toggleRoleOverlay(isFirstRole: boolean) {
        this.roleOverlayOpen = !this.roleOverlayOpen;
        this.isPickingFirstRole = isFirstRole;
    }

    /**
     * Invites the player with the specified summoner ID.
     */
    public async invitePlayer(summonerId: number) {
        return socket.request("/lol-lobby/v2/lobby/invitations", "POST", JSON.stringify([{
            summonerId
        }]));
    }

    /**
     * Selects the role with the specified name. This takes into account the
     * `isPickingFirstRole` parameter to adjust roles accordingly. This also
     * closes the role picker overlay.
     */
    public selectRole(newRole: string) {
        if (!this.state) return;

        const roles = {
            firstPreference: this.state.localMember.firstPositionPreference,
            secondPreference: this.state.localMember.secondPositionPreference
        };
        if (this.isPickingFirstRole && newRole === roles.secondPreference) {
            roles.secondPreference = roles.firstPreference;
            roles.firstPreference = newRole;
        } else if (newRole === roles.firstPreference) {
            roles.secondPreference = "UNSELECTED";
        } else if (this.isPickingFirstRole) {
            roles.firstPreference = newRole;
            if (newRole === "FILL") roles.secondPreference = "UNSELECTED";
        } else {
            roles.secondPreference = newRole;
        }

        socket.request("/lol-lobby/v2/lobby/members/localMember/position-preferences", "PUT", JSON.stringify(roles));
        this.roleOverlayOpen = false;
    }

    /**
     * Promotes the specified member to lobby owner, after prompting.
     */
    public async promoteMember(member: LobbyMember) {
        if (await confirm("Are you sure?", "Promote " + member.summoner.displayName + " to lobby owner?")) {
            socket.request("/lol-lobby/v2/lobby/members/" + member.summonerId + "/promote", "POST");
        }
    }

    /**
     * Toggles inviting for the specified member.
     */
    public toggleInvite(member: LobbyMember) {
        socket.request("/lol-lobby/v2/lobby/members/" + member.summonerId + (member.allowedInviteOthers ? "/revoke-invite" : "/grant-invite"), "POST");
    }

    /**
     * Kicks the specified member after confirming the users intent.
     */
    public async kickMember(member: LobbyMember) {
        if (await confirm("Are you sure?", "Kick " + member.summoner.displayName + " from the lobby?")) {
            socket.request("/lol-lobby/v2/lobby/members/" + member.summonerId + "/kick", "POST");
        }
    }

    /**
     * Leaves the current lobby, after a confirmation.
     */
    public async leaveLobby() {
        if (await confirm("Are you sure?", "Leave the lobby? You cannot rejoin unless you are invited again.")) {
            socket.request("/lol-lobby/v2/lobby", "DELETE");
        }
    }

    @computed
    get backgroundImage() {
        if (!this.state) return require("../assets/magic-background.jpg");
        return getMapBackground(this.state!.gameConfig.mapId);
    }

    private async handleLobbyChange(result: Result) {
        if (result.status !== 200) {
            this.state = null;
            this.inviteOverlayOpen = false;
            this.roleOverlayOpen = false;
            return;
        }

        // Load summoner info.
        const state: LobbyState = result.content;
        for (const member of state.members) {
            member.isLocalMember = false;
            member.summoner = (await socket.request("/lol-summoner/v1/summoners/" + member.summonerId)).content;
        }

        for (const invite of state.invitations) {
            invite.toSummoner = (await socket.request("/lol-summoner/v1/summoners/" + invite.toSummonerId)).content;
        }

        // Update localMember to also contain the summoner.
        state.localMember = state.members.find(x => x.summonerId === state.localMember.summonerId)!;
        state.localMember.isLocalMember = true;

        // Load queue/map info.
        const queueInfo = await socket.request("/lol-game-queues/v1/queues/" + state.gameConfig.queueId);
        this.queueName = queueInfo.content.description;

        const mapInfo = await socket.request("/lol-maps/v1/map/" + state.gameConfig.mapId);
        this.mapName = mapInfo.content.name;

        // Propagate changes.
        this.state = state;

        // Close the role picker if we can't pick roles.
        if (!state.gameConfig.showPositionSelector) this.roleOverlayOpen = false;
    }
}

const instance = new LobbyStore();
export default instance;