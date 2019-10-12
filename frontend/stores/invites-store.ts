import { observable } from "mobx";
import socket, { Result } from "../utils/socket";

export interface Invite {
    invitationId: string;
    canAcceptInvitation: boolean;
    fromSummonerId: number;
    fromSummoner: { displayName: string, profileIconId: number }; // added by us
    queueName: string; // added by us
    mapName: string; // added by us
    gameConfig: { mapId: number, queueId: number };
    state: "Pending" | "Declined";
}

export class InvitesStore {
    @observable
    invites: Invite[] = [];

    constructor() {
        socket.observe("/lol-lobby/v2/received-invitations", this.handleInvitationUpdate);
    }

    /**
     * @returns only the pending invites (the ones that can be accepted)
     */
    get pendingInvites(): Invite[] {
        return this.invites.filter(x => x.state === "Pending");
    }

    /**
     * Accepts the specified invite.
     */
    acceptInvite(invite: Invite) {
        socket.request("/lol-lobby/v2/received-invitations/" + invite.invitationId + "/accept", "POST");
    }

    /**
     * Declines the specified invite.
     */
    declineInvite(invite: Invite) {
        socket.request("/lol-lobby/v2/received-invitations/" + invite.invitationId + "/decline", "POST");
    }

    /**
     * @returns details of the invite, showing the gamemode and map.
     */
    getInviteDetails(invite: Invite): string {
        return (invite.queueName || "Unknown Queue") + " - " + (invite.mapName || "Unknown Map");
    }

    private handleInvitationUpdate = async (result: Result) => {
        if (result.status !== 200) {
            this.invites = [];
            return;
        }

        // Load and queue summoner info.
        const newInvites: Invite[] = result.content;
        for (const invite of newInvites) {
            console.dir(invite);
            invite.fromSummoner = (await socket.request("/lol-summoner/v1/summoners/" + invite.fromSummonerId)).content;

            const queueInfo = await socket.request("/lol-game-queues/v1/queues/" + invite.gameConfig.queueId);
            invite.queueName = queueInfo.content.description;

            const mapInfo = await socket.request("/lol-maps/v1/map/" + invite.gameConfig.mapId);
            invite.mapName = mapInfo.content.name;
        }

        this.invites = newInvites;
    };
}

const instance = new InvitesStore();
export default instance;