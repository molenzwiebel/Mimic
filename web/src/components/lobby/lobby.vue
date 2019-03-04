<template>
    <div style="flex: 1; display: flex;">
        <div v-if="state" class="lobby" :style="backgroundImage">
            <!-- This overlays the lobby if we are currently in queue. -->
            <div class="queue-overlay"></div>

            <lobby-invites :state="state" :show="showingInvites" @close="showingInvites = false"></lobby-invites>

            <!-- Role picker needs to be here because of z-index. -->
            <role-picker
                    :show="showingRolePicker"
                    :selecting-first="pickingFirstRole"
                    :first-role="state.localMember.firstPositionPreference"
                    :second-role="state.localMember.secondPositionPreference"
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
                            :key="member.summonerId"
                            :member="member"
                            :show-positions="state.gameConfig.showPositionSelector"
                            :show-moderation="state.localMember.isLeader"
                            @promote="promoteMember(member)"
                            @invite="toggleInvite(member)"
                            @kick="kickMember(member)"
                            @roles="showRolePicker($event)">
                    </lobby-member>
                </transition-group>

                <!-- Show the invite overlay toggle if we can invite people. -->
                <div class="invite-prompt" v-if="showInvitePrompt" @click="showingInvites = true">
                    <i class="ion-plus"></i>  Invite Others
                </div>
            </div>

            <div class="bottom">
                <!-- We can join matchmaking if we can start, and we are the owner -->
                <lcu-button class="queue-button" @click="joinMatchmaking()" :disabled="!(state.canStartActivity && queueDodgeTime === -1 && state.localMember.isLeader)">
                    <template v-if="queueDodgeTime === -1">Find Match</template>
                    <template v-else>Blocked {{ formatSeconds(queueDodgeTime) }}</template>
                </lcu-button>
            </div>
        </div>

        <!-- No lobby -->
        <div class="no-lobby" v-else>
            <span class="header">No Lobby</span>
            <span class="detail">Wait for an invite, or join a<br> lobby on your desktop.</span>

            <span v-if="!isStandalone" class="tip">
                <b>PRO TIP: </b>

                <template v-if="canTriggerHomescreenPrompt">
                    <span style="text-decoration: underline" @click="triggerInstallPrompt">Add this site to your homescreen</span>
                </template>

                <template v-else>
                    Add this site to your homescreen
                </template>

                <br>to use Mimic in fullscreen.
            </span>
        </div>
    </div>
</template>

<script lang="ts" src="./lobby.ts"></script>

<style lang="stylus" scoped>
    .lobby
        background-image url(../../static/magic-background.jpg)
        background-size cover
        background-position center
        position relative
        flex 1
        transition background-image 0.3s ease // Not a standard, but most mobile browsers (chrome) support it.
        display flex
        flex-direction column
        justify-content space-between

    .lobby-header
        box-sizing border-box
        height 165px
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
            white-space nowrap

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

    .invite-prompt
        margin-left 40px
        display flex
        align-items center
        justify-content center
        height 100px
        font-size 50px
        text-transform uppercase
        color rgba(246, 236, 216, 0.6)
        font-family "LoL Display"
        font-weight 700
        letter-spacing 0.075em

        i
            padding-top 2px
            font-size 40px
            margin-right 10px

    .queue-button
        margin 10px
        margin-left 14px
        margin-bottom 20px

    .no-lobby
        background-image url(../../static/magic-background.jpg)
        background-size cover
        background-position center
        position relative
        flex 1
        display flex
        flex-direction column
        justify-content center
        align-items center

        .header
            color #f0e6d3
            font-family "LoL Display"
            letter-spacing 0.075em
            text-transform uppercase
            font-weight bold
            font-size 70px

        .detail
            margin-top 10px
            color #aaaea0
            font-family "LoL Body"
            font-size 50px
            text-align center

        .tip
            position absolute
            bottom 0
            left 0
            margin 20px
            width 100%
            color #aaaea0
            font-family "LoL Body"
            font-size 40px
            text-align center
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