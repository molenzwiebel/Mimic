<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="invite-overlay" v-show="show">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">Invites</div>

            <div class="invite-summoner">
                <input v-model="inviteName" type="text" autocomplete="off" spellcheck="false" placeholder="Summoner Name" maxlength="24" autocorrect="off" autocapitalize="off">
                <div class="search-button" @click="inviteManually"><i class="ion-plus"></i></div>
            </div>

            <span class="section-header">Invited</span>
            <div class="content">
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

    .search-button
        position relative
        box-sizing border-box
        display flex
        align-items center
        justify-content center
        width 90px
        height 90px
        margin 10px 20px 10px 10px
        border search-border-width solid transparent
        background-color #1e2328
        background-clip padding-box
        font-size 40px
        color #cebf93
        border-radius 50%

        &:after
            position absolute
            content ""
            left -(search-border-width)
            top -(search-border-width)
            bottom -(search-border-width)
            right -(search-border-width)
            border-radius 50%
            background linear-gradient(to top, #785b28 0%, #c89c3c 55%, #c8a355 71%, #c8aa6e 100%)
            z-index -1

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