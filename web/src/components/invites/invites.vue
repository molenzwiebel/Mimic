<template>
    <div class="invites" :class="pendingInvites.length > 0 && 'some'">
        <span v-if="pendingInvites.length > 0" class="invite-header">Game Invites</span>

        <transition-group name="expand">
            <div v-for="invite in pendingInvites" :key="invite.invitationId" class="invite">
                <img :src="getSummonerIcon(invite)">

                <div class="info">
                    <span class="name">{{ invite.fromSummoner.displayName }}</span>
                    <span class="details">{{ getInviteDetails(invite) }}</span>
                </div>

                <div class="actions">
                    <highlightable><i @click="acceptInvite(invite)" v-if="invite.canAcceptInvitation" class="ion-checkmark"></i></highlightable>
                    <highlightable><i @click="declineInvite(invite)" class="ion-close"></i></highlightable>
                </div>
            </div>
        </transition-group>
    </div>
</template>

<script lang="ts" src="./invites.ts"></script>

<style lang="stylus">
    body.has-notch .invites.some
        padding-top calc(env(safe-area-inset-top) + 30px)
</style>

<style lang="stylus" scoped>
    @keyframes magic-background
        0%
            background-position 100% 0
        50%
            background-position 0 100%
        100%
            background-position 100% 0

    .invites
        z-index 1
        transition 0.3s ease
        background linear-gradient(186deg, #197e99, #134b6d, #197e99, #1e465d)
        background-size 400% 400%
        animation magic-background 10s ease infinite

    .invite-header
        display inline-block
        padding 20px 20px 10px 20px
        font-family "LoL Display"
        color #f0e6d3
        font-size 40px
        font-weight bold
        text-transform uppercase
        letter-spacing 0.075em

    .invite
        display flex
        align-items center
        padding 20px 0
        border-bottom 1px solid rgba(255, 255, 255, 0.3)

        img
            box-sizing border-box
            margin-left 20px
            width 110px
            height 110px
            border-radius 50%
            border 4px solid #ae8939

        .info
            flex 1
            margin-left 20px
            display flex
            flex-direction column
            justify-content center

        .name
            font-size 50px
            color #f0e6d2

        .details
            font-size 40px
            color #0acbe6
            white-space nowrap

        .actions
            flex 140px 0
            margin-right 30px
            font-size 70px
            color #f0e6d2

        .actions > i:first-child
            margin-right 20px

    .expand-enter-active, .expand-leave-active
        transition max-height 0.3s ease

    .expand-enter, .expand-leave-to
        max-height 0
</style>