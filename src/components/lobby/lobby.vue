<template>
    <div v-if="state" class="lobby" :style="backgroundImage">
        <!-- This overlays the lobby if we are currently in queue. -->
        <div class="queue-overlay"></div>

        <!-- Role picker needs to be here because of z-index. -->
        <role-picker
            :show="showingRolePicker"
            :selecting-first="pickingFirstRole"
            :first-role="state.localMember.positionPreferences.firstPreference"
            :second-role="state.localMember.positionPreferences.secondPreference"
            @selected="updateRoles($event)">
        </role-picker>

        <div class="top">
            <div class="lobby-header">
                <div class="info">
                    <span class="header">Lobby</span>
                    <span class="info">{{ lobbySubtitle }}</span>
                </div>

                <i @click="leaveLobby()" class="ion-android-close"></i>
            </div>

            <transition-group enter-active-class="slideInLeft" leave-active-class="slideOutRight">
                <lobby-member
                        v-for="member in lobbyMembers"
                        :key="member.id"
                        :member="member"
                        :show-positions="state.showPositionSelector"
                        :show-moderation="state.localMember.isOwner"
                        @promote="promoteMember(member)"
                        @invite="toggleInvite(member)"
                        @kick="kickMember(member)"
                        @roles="showRolePicker($event)">
                </lobby-member>
            </transition-group>
        </div>

        <div class="bottom">
            <!-- We can join matchmaking if we can start, and we are the owner -->
            <lcu-button class="queue-button" @click="joinMatchmaking()" :disabled="!(state.canStartMatchmaking && state.localMember.isOwner)">
                Find Match
            </lcu-button>
        </div>
    </div>
</template>

<script lang="ts" src="./lobby.ts"></script>

<style lang="stylus" scoped>
    .lobby
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        background-size cover
        background-position center
        position relative
        flex 1
        transition background-image 0.3s ease // Not a standard, but most mobile browsers (chrome) support it.
        display flex
        flex-direction column
        justify-content space-between

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

    .queue-button
        margin 10px
        margin-left 14px
        margin-bottom 20px
</style>

<!-- Note that this style tag is _not_ scoped. -->
<!-- This is needed because of the body class. -->
<style lang="stylus">
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
</style>