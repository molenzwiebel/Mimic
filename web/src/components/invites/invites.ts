import Vue from "vue";
import Root from "../root/root";
import { Component } from "vue-property-decorator";
import { ddragon, MAPS, QUEUES } from "../../constants";

interface Invite {
    id: string;
    eligibility: { eligible: boolean };
    fromSummonerId: number;
    fromSummoner: { displayName: string, profileIconId: number }; // added by us
    invitationMetaData: { gameMode: string, mapId: number, queueId: number };
    state: "Pending" | "Declined";
}

@Component
export default class Invites extends Vue {
    $root: Root;

    invites: Invite[] = [];

    mounted() {
        const handleInvitationUpdate = async () => {
            const result = await this.$root.request("/lol-lobby/v1/received-invitations");

            if (result.status !== 200) {
                this.invites = [];
                return;
            }

            // Load summoner info.
            const newInvites: Invite[] = result.content;
            for (const invite of newInvites) {
                invite.fromSummoner = (await this.$root.request("/lol-summoner/v1/summoners/" + invite.fromSummonerId)).content;
            }

            this.invites = newInvites;
        };

        // Start observing invitation changes.
        this.$root.observe(/^\/lol-lobby\/v1\/received-invitations/, handleInvitationUpdate);

        // Check for initial pending invites.
        handleInvitationUpdate();
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
        this.$root.request("/lol-lobby/v1/received-invitations/" + invite.id + "/accept", "POST");
    }

    /**
     * Declines the specified invite.
     */
    declineInvite(invite: Invite) {
        this.$root.request("/lol-lobby/v1/received-invitations/" + invite.id + "/decline", "POST");
    }

    /**
     * @returns details of the invite, showing the gamemode and map.
     */
    getInviteDetails(invite: Invite): string {
        return (QUEUES[invite.invitationMetaData.queueId] || "Unknown Queue") + " - " + (MAPS[invite.invitationMetaData.mapId] || "Unknown Map");
    }

    /**
     * @returns the path to the summoner icon for the inviter
     */
    getSummonerIcon(invite: Invite): string {
        return `http://ddragon.leagueoflegends.com/cdn/${ddragon()}/img/profileicon/${invite.fromSummoner.profileIconId}.png`;
    }
}