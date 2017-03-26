<template>
    <transition-group tag="div" class="invites-overlay" enter-active-class="slideInLeft" leave-active-class="slideOutRight">
        <div v-for="invite in pendingInvites" class="invite" :key="invite.id">
            <div class="left">
                <img :src="inviteImage(invite)">
                <div class="text">
                    <span class="header">Invite</span>
                    <span class="content">{{ invite.fromSummoner.displayName }}</span>
                    <span class="content">{{ inviteSubtext(invite) }}</span>
                </div>
            </div>

            <div class="right">
                <i @click="acceptInvite(invite)" v-if="invite.eligibility.eligible" class="ion-checkmark"></i>
                <i @click="declineInvite(invite)" class="ion-close"></i>
            </div>
        </div>
    </transition-group>
</template>


<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { DDRAGON_VERSION, MAPS, QUEUES } from "../constants";

    interface Invite {
        id: string;
        eligibility: { eligible: boolean };
        fromSummonerId: number;
        fromSummoner: { displayName: string, profileIconId: number };
        invitationMetaData: { gameMode: string, isRanked: boolean, mapId: number, queueId: number };
        state: "Pending" | "Declined";
    }

    @Component
    export default class InviteManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        invites: Invite[] = [];

        mounted() {
            this.$root.observe("/lol-lobby/v1/received-invitations", async (state, data) => {
                const invites = <Invite[]>data;

                await Promise.all(invites.map(async inv => {
                    inv.fromSummoner = (await this.$root.request("/lol-summoner/v1/summoners/" + inv.fromSummonerId)).content;
                }));

                this.invites = invites;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-lobby/v1/received-invitations");
        }

        get pendingInvites() {
            return this.invites.filter(x => x.state === "Pending");
        }

        inviteImage(invite: Invite) {
            return `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${invite.fromSummoner.profileIconId}.png`;
        }

        inviteSubtext(invite: Invite) {
            return (QUEUES[invite.invitationMetaData.queueId] || "Queue " + invite.invitationMetaData.queueId) + " - " + (MAPS[invite.invitationMetaData.mapId] || "Map " + invite.invitationMetaData.mapId);
        }

        acceptInvite(invite: Invite) {
            this.$root.request("/lol-lobby/v1/received-invitations/" + invite.id + "/accept", "POST");
        }

        declineInvite(invite: Invite) {
            this.$root.request("/lol-lobby/v1/received-invitations/" + invite.id + "/decline", "POST");
        }
    }
</script>

<style lang="stylus" scoped>
    .invites-overlay
        position absolute
        left 0
        top 0
        width 100%
        height 100%
        overflow-y scroll

        display flex
        flex-direction column
        justify-content flex-end
        pointer-events none

    .invite
        pointer-events all
        background linear-gradient(to right, #0e213b, #0c2e49)
        padding 10px
        display flex
        font-size 18px
        flex-direction row
        justify-content space-between
        align-items center
        color white

        .left
            display flex
            justify-content center
            align-items center

            img
                width 140px
                height 140px

        .left .text
            padding-left 20px
            display flex
            flex-direction column

            .header
                font-weight bold
                font-size 50px

            .content
                font-size 40px

        .right i
            padding-right 20px
            font-size 80px
</style>