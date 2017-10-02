<template>
    <div class="lobby-member">
        <div class="left">
            <img :src="summonerIcon">
            <div class="texts">
                <span>
                    <i v-if="member.isOwner" class="ion-ribbon-b"></i>
                    {{ member.summoner.displayName }}
                </span>

                <!-- Positions subtitle. Only shown for other players. -->
                <span class="positions" v-if="showPositions && !member.isLocalMember" v-html="positions"></span>
            </div>
        </div>

        <div class="right" v-if="showModeration && !member.isLocalMember">
            <i class="ion-ribbon-a" @click="$emit('promote')"></i>
            <i :class="member.canInviteOthers ? 'ion-person-add' : 'ion-person'" @click="$emit('invite')"></i>
            <i class="ion-close-circled" @click="$emit('kick')"></i>
        </div>

        <div class="right" v-if="showPositions && member.isLocalMember">
            <img
                    @click="$emit('roles', true)"
                    :src="roleImage(member.positionPreferences.firstPreference)">
            <img
                    v-if="member.positionPreferences.firstPreference !== 'FILL'"
                    @click="$emit('roles', false)"
                    :src="roleImage(member.positionPreferences.secondPreference)">
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Component, Prop } from "vue-property-decorator";
    import { LobbyMember } from "./lobby";
    import { ddragon, POSITION_NAMES, roleImage as constantRoleImage } from "../../constants";

    @Component
    export default class LobbyMemberComponent extends Vue {
        @Prop()
        member: LobbyMember;

        @Prop()
        showPositions: boolean;

        @Prop()
        showModeration: boolean;

        get summonerIcon(): string {
            return `http://ddragon.leagueoflegends.com/cdn/${ddragon()}/img/profileicon/${this.member.summoner.profileIconId}.png`;
        }

        get positions(): string {
            const [first, second] = [this.member.positionPreferences.firstPreference, this.member.positionPreferences.secondPreference];
            if (first === second && first === "UNSELECTED") return "<i>No Roles Selected</i>";
            if (first !== "FILL") {
                return POSITION_NAMES[first] + " - " + (second === "UNSELECTED" ? "<i>Empty</i>" : POSITION_NAMES[second]);
            }

            return "Fill";
        }

        // Import the roleImage helper from constants.
        roleImage = constantRoleImage;
    }
</script>

<style lang="stylus" scoped>
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
            margin-right 4px

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
</style>