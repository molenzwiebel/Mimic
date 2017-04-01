<template>
    <div v-if="hasLobby" class="lobby" :style="backgroundImage">
        <!-- This overlays the lobby if we are currently in queue -->
        <div class="queue-overlay"></div>

        <transition name="bounce" enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
            <div v-show="displayingRolePicker" class="role-picker">
                <i class="ion-android-close close" @click="displayingRolePicker = false"></i>
                <div class="header">Select {{ selectingFirstRole ? 'First' : 'Second' }} Role</div>
                <div class="role" @click="updatePosition('FILL')">
                    <img :src="roleImage('FILL')">
                    <span>Fill</span>
                </div>
                <div class="role" @click="updatePosition('TOP')">
                    <img :src="roleImage('TOP')">
                    <span>Top</span>
                </div>
                <div class="role" @click="updatePosition('JUNGLE')">
                    <img :src="roleImage('JUNGLE')">
                    <span>Jungle</span>
                </div>
                <div class="role" @click="updatePosition('MIDDLE')">
                    <img :src="roleImage('MIDDLE')">
                    <span>Mid</span>
                </div>
                <div class="role" @click="updatePosition('BOTTOM')">
                    <img :src="roleImage('BOTTOM')">
                    <span>Bot</span>
                </div>
                <div class="role" @click="updatePosition('UTILITY')">
                    <img :src="roleImage('UTILITY')">
                    <span>Support</span>
                </div>
            </div>
        </transition>

        <div class="top">
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
                            <span class="positions" v-if="lobbyData.showPositionSelector && member.id !== lobbyData.localMember.id" v-html="positions(member)"></span>
                        </div>
                    </div>

                    <div class="right" v-if="lobbyData.localMember.isOwner && member.id !== lobbyData.localMember.id">
                        <i class="ion-ribbon-a" @click="makeOwner(member)"></i>
                        <i :class="member.canInviteOthers ? 'ion-person-add' : 'ion-person'" @click="toggleInvite(member)"></i>
                        <i class="ion-close-circled" @click="kick(member)"></i>
                    </div>

                    <div class="right" v-if="lobbyData.showPositionSelector && member.id === lobbyData.localMember.id">
                        <img
                                @click="(displayingRolePicker = true, selectingFirstRole = true)"
                                :src="roleImage(lobbyData.localMember.positionPreferences.firstPreference)">
                        <img
                                v-if="lobbyData.localMember.positionPreferences.firstPreference !== 'FILL'"
                                @click="(displayingRolePicker = true, selectingFirstRole = false)"
                                :src="roleImage(lobbyData.localMember.positionPreferences.secondPreference)">
                    </div>
                </div>
            </transition-group>
        </div>

        <div class="bottom">
            <div class="button" @click="joinQueue()" :disabled="!(lobbyData.canStartMatchmaking && lobbyData.localMember.isOwner)">
                <div class="button-border" :style="buttonCSS"></div>
                Find Match
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { DDRAGON_VERSION, MAPS, QUEUES, POSITION_NAMES, mapBackground } from "../constants";

    import RoleUnselected = require("../static/role-unselected.png");
    import RoleTop = require("../static/role-top.png");
    import RoleJungle = require("../static/role-jungle.png");
    import RoleMid = require("../static/role-mid.png");
    import RoleBot = require("../static/role-bot.png");
    import RoleSupport = require("../static/role-support.png");
    import RoleFill = require("../static/role-fill.png");

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

        displayingRolePicker = false;
        selectingFirstRole = false;

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
            return mapBackground(this.lobbyData ? this.lobbyData.mapId : 0);
        }

        get lobbyMembers() {
            if (!this.lobbyData.members) return;
            return [this.lobbyData.localMember, ...(this.lobbyData.members.filter(x => x.id !== this.lobbyData.localMember.id))];
        }

        get buttonCSS() {
            // Chrome needs the border: transparent, Safari needs to not have it for some reason.
            const border = (<any>window).chrome ? "border: 3px solid transparent;" : "";
            return border + `border-image: linear-gradient(to top,#785b28 0%,#c89c3c 55%,#c8a355 71%,#c8aa6e 100%); border-image-slice: 1;`;
        }

        roleImage(role: string) {
            if (role === "UNSELECTED") return RoleUnselected;
            if (role === "TOP") return RoleTop;
            if (role === "JUNGLE") return RoleJungle;
            if (role === "MIDDLE") return RoleMid;
            if (role === "BOTTOM") return RoleBot;
            if (role === "UTILITY") return RoleSupport;
            if (role === "FILL") return RoleFill;
            return "";
        }

        memberImage(member: LobbyMember) {
            return `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${member.summoner.profileIconId}.png`;
        }

        updatePosition(position: string) {
            const roles: { firstPreference: string, secondPreference: string } = Object.assign({}, this.lobbyData.localMember.positionPreferences);
            if (this.selectingFirstRole && position === roles.secondPreference) {
                // First role was set to the same as the second one, swap.
                roles.secondPreference = roles.firstPreference;
                roles.firstPreference = position;
            } else if (position === roles.firstPreference) {
                // Second role was set to the same as the first one, unselect second one.
                roles.secondPreference = "UNSELECTED";
            } else if (this.selectingFirstRole) {
                roles.firstPreference = position;
                if (position === "FILL") roles.secondPreference = "UNSELECTED";
            } else {
                roles.secondPreference = position;
            }

            this.$root.request("/lol-lobby/v1/lobby/members/localMember/position-preferences", "PUT", JSON.stringify(roles));
            this.displayingRolePicker = false;
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

        joinQueue() {
            this.$root.request("/lol-matchmaking/v1/search", "POST");
        }
    }
</script>

<style lang="stylus">
    .slideInLeft, .slideOutRight, .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    body:not(.in-queue) .queue-overlay
        display none

    body.in-queue .queue-overlay
        position absolute
        left 0
        top 0
        width 100%
        height 100%
        z-index 100
        background-color rgba(0, 0, 0, 0.5)

    .lobby
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        background-size cover
        background-position center
        position relative
        flex 1
        transition background-image 0.3s ease // Not a standard, but most mobile browsers support it.
        font-size 50px
        display flex
        flex-direction column
        justify-content space-between

    .role-picker
        position absolute
        top 0
        left 0
        right 0
        bottom 0
        z-index 2
        display flex
        flex-direction column
        align-items center
        background-color white

        .close
            position absolute
            top 22px
            right 40px
            font-size 70px

        & > .header
            width 100%
            text-align center
            border-bottom 1px solid lightgray
            margin-top 20px
            padding-bottom 20px
            font-family "LoL Body"
            font-size 60px

        .role
            box-sizing border-box
            padding 10px
            width 100%
            display flex
            align-items center
            border-bottom 1px solid lightgray
            font-family "LoL Display"
            font-size 60px

            span
                margin-left 30px

            img
                margin-left 10px

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

        .right img
            width 85px
            height 85px
            margin 0 15px

    .button
        position relative
        margin 10px
        margin-bottom 20px
        width calc(100% - 20px)
        height 120px
        display flex
        justify-content center
        align-items center
        background-color rgb(30, 35, 40)
        text-transform uppercase
        color rgb(205, 190, 145)
        font-size 60px
        font-family "LoL Display Bold"
        transition 0.3s ease

        &[disabled]
            background-color #1e2328
            color #5c5b57

            .button-border
                border 3px solid #5c5b57 !important

        .button-border
            transition 0.3s ease
            position absolute
            top -2px
            left -2px
            width 100%
            height 100%
</style>