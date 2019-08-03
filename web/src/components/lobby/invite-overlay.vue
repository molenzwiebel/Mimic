<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="invite-overlay" v-show="show">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">Invites</div>

            <div class="invite-summoner">
                <input ref="inviteField" v-model="inviteName" type="text" autocomplete="off" spellcheck="false" placeholder="Summoner Name" maxlength="24" autocorrect="off" autocapitalize="off">
                <div class="circular-button" @click="inviteManually"><i class="ion-plus"></i></div>
            </div>

            <span class="section-header">Invited</span>
            <div class="content">i
                <div class="invite" v-for="invite in state.invitations">
                    <i :class="getInvitationIcon(invite)"></i>
                    <span>{{ invite.toSummoner.displayName }}</span>
                </div>
            </div>

            <span class="section-header">Suggested</span>
            <div class="content">
                <div class="invite" v-for="suggestion in suggestions" @click="invite(suggestion.summonerId)">
                    <i class="ion-plus"></i>
                    <span>{{ suggestion.summonerName }}</span>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./invite-overlay.ts"></script>

<style lang="stylus" scoped>
    @import "../../common.styl"

    search-border-width = 5px

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .invite-overlay
        position absolute
        top 165px
        left 0
        right 0
        bottom 0
        z-index 1
        display flex
        flex-direction column
        color #f0e6d3
        background-image url(../../static/magic-background.jpg)
        background-repeat no-repeat
        background-size cover

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

        .content
            flex 1
            overflow-y scroll
            -webkit-overflow-scrolling touch

    .invite-summoner
        display flex
        align-items center

    .section-header
        font-family "LoL Display"
        font-size 30px
        padding 20px
        text-transform uppercase
        color #f0e6d2
        font-weight 700
        letter-spacing 0.075em

    input
        box-sizing border-box
        flex 1
        height 110px
        padding 20px
        margin 20px 10px 20px 20px
        -webkit-appearance none
        outline none
        border-radius 0px
        color #f0e6d2
        font-size 40px
        font-family "LoL Body"
        border 3px solid #785a28
        background-color black

    .invite
        margin 0 20px
        padding 30px 10px
        display flex
        align-items center
        font-size 45px
        border-bottom 1px solid alpha(#cdbe93, 0.4)

        i
            margin-right 30px
</style>