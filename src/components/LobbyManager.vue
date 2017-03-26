<template>
    <div v-if="hasLobby" class="lobby" :style="backgroundImage">
        <div class="lobby-header">
            <div class="info">
                <span class="header">Lobby</span>
                <span class="info">{{ lobbyInfo }}</span>
            </div>

            <i @click="leaveLobby()" class="ion-android-close"></i>
        </div>

        <transition-group enter-active-class="slideInLeft" leave-active-class="slideOutRight">
            <div class="lobby-member" v-for="member in lobbyMembers" :key="member.id">
                <div class="left">
                    <img :src="memberImage(member)">
                    <div class="texts">
                        <span><i v-if="member.isOwner" class="ion-ribbon-b"></i>{{ member.summoner.displayName }}</span>
                        <span class="positions" v-if="lobbyData.showPositionSelector" v-html="positions(member)"></span>
                    </div>
                </div>

                <div class="right" v-if="lobbyData.localMember.isOwner && member.id !== lobbyData.localMember.id">
                    <i class="ion-ribbon-a" @click="makeOwner(member)"></i>
                    <i :class="member.canInviteOthers ? 'ion-person-add' : 'ion-person'" @click="toggleInvite(member)"></i>
                    <i class="ion-close-circled" @click="kick(member)"></i>
                </div>
            </div>
        </transition-group>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { MAPS, QUEUES } from "../constants";

    import HABackground = require("../static/bg-ha.jpg");
    import TTBackground = require("../static/bg-tt.jpg");
    import SRBackground = require("../static/bg-sr.jpg");

    const POSITION_NAMES: { [key: string]: string } = {
        TOP: "Top",
        JUNGLE: "Jungle",
        MIDDLE: "Mid",
        BOTTOM: "Bottom",
        UTILITY: "Support",
        FILL: "Fill"
    };

    interface LobbyMember {
        summoner: { displayName: string, profileIconId: number };
        canInviteOthers: boolean;
        id: number;
        isOwner: boolean;
        positionPreferences: {
            firstPreference: string;
            secondPreference: string;
        }
    }

    interface Lobby {
        queueId: number;
        mapId: number;
        autoFillEligible: boolean;
        canStartMatchmaking: boolean;
        showPositionSelector: boolean;
        localMember: LobbyMember;
        members: LobbyMember[];
    }

    @Component
    export default class InviteManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        hasLobby: boolean = false;
        lobbyData: Lobby = <Lobby><any>{};

        mounted() {
            this.$root.observe("/lol-lobby/v1/lobby", async (status, data) => {
                if (status !== 200) {
                    this.hasLobby = false;
                    return;
                }

                const lobby: Lobby = <Lobby>data;
                await Promise.all(lobby.members.map(async mem => {
                    mem.summoner = (await this.$root.request("/lol-summoner/v1/summoners/" + mem.id)).content;
                }));
                lobby.localMember.summoner = lobby.members.filter(x => x.id === lobby.localMember.id)[0].summoner;

                this.hasLobby = true;
                this.lobbyData = lobby;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-lobby/v1/lobby");
        }

        get lobbyInfo() {
            return (QUEUES[this.lobbyData.queueId] || "Queue " + this.lobbyData.queueId) + " - " + (MAPS[this.lobbyData.mapId] || "Map " + this.lobbyData.mapId);
        }

        get backgroundImage() {
            if (!this.lobbyData) return "";
            if (this.lobbyData.mapId === 10) return "background-image: url(" + TTBackground + ");";
            if (this.lobbyData.mapId === 11) return "background-image: url(" + SRBackground + ");";
            if (this.lobbyData.mapId === 12) return "background-image: url(" + HABackground + ");";
            return "";
        }

        get lobbyMembers() {
            if (!this.lobbyData.members) return;
            return [this.lobbyData.localMember, ...(this.lobbyData.members.filter(x => x.id !== this.lobbyData.localMember.id))];
        }

        memberImage(member: LobbyMember) {
            return `http://ddragon.leagueoflegends.com/cdn/7.5.2/img/profileicon/${member.summoner.profileIconId}.png`;
        }

        positions(member: LobbyMember) {
            const [first, second] = [member.positionPreferences.firstPreference, member.positionPreferences.secondPreference];
            if (first === second && first === "UNSELECTED") return "<i>No Roles Selected</i>";
            if (first !== "FILL") {
                return POSITION_NAMES[first] + " - " + (second === "UNSELECTED" ? "<i>Empty</i>" : POSITION_NAMES[second]);
            }

            return "Fill";
        }

        leaveLobby() {
            if (confirm("Leave the lobby? You cannot rejoin unless you are invited again.")) {
                this.$root.request("/lol-lobby/v1/lobby", "DELETE");
            }
        }

        makeOwner(member: LobbyMember) {
            if (confirm("Promote " + member.summoner.displayName + " to lobby owner?")) {
                this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + "/promote", "POST");
            }
        }

        toggleInvite(member: LobbyMember) {
            this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + (member.canInviteOthers ? "/revoke-invite" : "/grant-invite"), "POST");
        }

        kick(member: LobbyMember) {
            if (confirm("Kick " + member.summoner.displayName + " from the lobby?")) {
                this.$root.request("/lol-lobby/v1/lobby/members/" + member.id + "/kick", "POST");
            }
        }
    }
</script>

<style lang="stylus" scoped>
    .slideInLeft, .slideOutRight
        animation-duration 0.4s !important

    .lobby
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        background-size cover
        background-position center
        height 100%
        transition background-image 0.3s ease // Not a standard, but most mobile browsers support it.
        font-size 50px

    .lobby-header
        padding 20px
        display flex
        flex-direction row
        color white
        align-items center
        justify-content space-between
        border-bottom 1px solid rgba(240, 230, 210, 0.5)

        .info
            display flex
            flex-direction column

        .header
            color #f0e6d3
            margin 0 0 4px 0
            font-weight bold
            font-size 55px

        .info
            color #aaaea0
            font-size 50px

        i
            margin-right 20px
            font-size 80px

    .lobby-member
        display flex
        flex-direction row
        align-items center
        justify-content space-between
        margin 0 20px
        padding 20px 0
        border-bottom 1px solid rgba(255, 255, 255, 0.3)

        .left
            display flex
            flex-direction row
            align-items center

        .left img
            box-sizing border-box
            width 110px
            height 110px
            border-radius 50%
            border 3px solid #ae8939

        .left .texts
            display flex
            flex-direction column
            justify-content center
            align-items space-between

        .left span
            margin-left 20px
            color white
            font-size 56px

            &.positions
                color #fffaef
                font-size 36px

        .left span i
            color #f0e6d3
            margin-right 20px

        .right
            display flex
            flex-direction row
            justify-content center
            color white
            font-size 70px

        .right i
            margin 20px
</style>