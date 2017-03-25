<template>
    <div class="invites-overlay">
        <div v-for="invite in pendingInvites" class="invite">
            <div class="left">
                <img :src="inviteImage(invite)">
                <div class="text">
                    <span class="header">Invite</span>
                    <span class="content">{{ invite.fromSummoner.displayName }} - {{ invite.invitationMetaData.gameMode }}</span>
                </div>
            </div>

            <div class="right">
                <i @click="acceptInvite(invite)" v-if="invite.eligibility.eligible" class="fa fa-check" aria-hidden="true"></i>
                <i @click="declineInvite(invite)" class="fa fa-times"></i>
            </div>
        </div>
    </div>
</template>


<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface Invite {
        id: string;
        eligibility: { eligible: boolean };
        fromSummonerId: number;
        fromSummoner: { displayName: string, profileIconId: number };
        invitationMetaData: { gameMode: string, isRanked: boolean };
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
            return `http://ddragon.leagueoflegends.com/cdn/7.5.2/img/profileicon/${invite.fromSummoner.profileIconId}.png`;
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

    .invite
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
                width 100px
                height 100px

        .left .text
            padding-left 10px
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