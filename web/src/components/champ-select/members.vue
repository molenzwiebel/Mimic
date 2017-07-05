<template>
    <div class="members">
        <div class="team">
            <span class="team-name">Your Team</span>
            <div class="team-member my" v-for="member in state.myTeam">
                <div class="member-background" :style="getBackgroundStyle(member)"></div>
                <div class="active-background" :class="getActiveOverlayClass(member)"></div>
                <div class="info">
                    <span class="name">{{ member.displayName }}</span>
                    <span class="state">{{ getMemberSubtext(member) }}</span>
                </div>
                <div class="summoner-spells" v-if="member.spell1Id != 0 || member.spell2Id != 0">
                    <img v-if="member.spell1Id != 0" :src="getSummonerSpellImage(member.spell1Id)">
                    <img v-if="member.spell2Id != 0" :src="getSummonerSpellImage(member.spell2Id)">
                </div>
            </div>
        </div>
    
        <div class="team enemy-team" v-if="state.theirTeam.length > 0">
            <span class="team-name">Enemy Team</span>
            <div class="team-member enemy" v-for="member in state.theirTeam">
                <div class="member-background" :style="getBackgroundStyle(member)"></div>
                <div class="active-background" :class="getActiveOverlayClass(member)"></div>
                <div class="info">
                    <span class="name">{{ member.displayName }}</span>
                    <span class="state">{{ getMemberSubtext(member) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./members.ts"></script>

<style lang="stylus" scoped>
    @require "./style.styl"

    .members
        max-height "calc(100% - %s)" % (timer-status-height + player-settings-height)
        min-height "calc(100% - %s)" % (timer-status-height + player-settings-height)

        display flex
        -webkit-overflow-scrolling touch // smooth scrolling on ios

    .team
        flex 0 0 50%
        display flex
        flex-direction column

    .team-name
        padding 5px 20px
        flex 0 0 50px
        font-size 40px
        color #f0e6d2
        letter-spacing 0.05em
        font-family "LoL Display Bold"
        text-align center
        text-transform uppercase

    .team-member
        flex 1
        max-height 400px
        box-sizing border-box
        border-bottom 1px solid #cdbe93
        position relative
        display flex
        flex-direction column
        align-items flex-start
        justify-content space-between
        color white

        &:first-of-type
            border-top 1px solid #cdbe93

    .enemy
        flex-direction row-reverse

    .summoner-spells
        margin 10px 10px
        display flex
        flex-direction column
        align-items center
        justify-content space-around

        img
            width 64px
            height 64px
            margin-top 10px

    .info
        margin 5px 20px
        display flex
        flex-direction column
        font-family "LoL Body"

        .name
            font-size 45px

        .state
            display inline-block
            transition 0.3s ease
            font-size 30px
            color #fffaef

        .state:empty
            height 0
    
    .enemy .info
        align-items: flex-end;

    .member-background
        position absolute
        z-index -1
        left 0
        top 0
        bottom 0
        right 0
        background-repeat no-repeat
        background-position 40% 8%
        background-size 200%
        transition 0.3s ease

        &:after
            content ""
            position absolute
            left 0
            top 0
            bottom 0
            right 0
            background-image linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%)

    .enemy .member-background
        background-position-x 60%

    @keyframes champ-select-active-background
        0% { background-position: 100% 0; }
        50% { background-position: 0 100%; }
        100% { background-position: 100% 0; }

    .active-background
        transition 0.3s ease
        position absolute
        z-index -1
        left 0
        top 0
        bottom 0
        right 0
        opacity 0
        animation champ-select-active-background 5s ease infinite

        &.picking
            opacity 1
            background linear-gradient(186deg, alpha(#197e99, 0.5), alpha(#134b6d, 0.3), alpha(#197e99, 0.6), alpha(#1e465d, 0.4))
            background-size 400% 400%

        &.banning
            opacity 1
            background linear-gradient(186deg, alpha(#c6403b, 0.4), alpha(#f9413f, 0.2), alpha(#ec3930, 0.5), alpha(#ee241d, 0.3))
            background-size 400% 400%
</style>