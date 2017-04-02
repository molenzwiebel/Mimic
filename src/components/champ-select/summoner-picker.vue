<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="spell-selector" v-show="show">
            <i class="ion-android-close close" @click="$emit('close')"></i>
            <div class="header">Select {{ first ? 'First' : 'Second' }} Summoner</div>

            <div class="content">
                <div class="summoner" v-for="summoner in availableSummoners" @click="selectSummoner(summoner.id)">
                    <img :src="getSummonerSpellImage(summoner.id)">
                    <div class="spell-info">
                        <span class="name">{{ summoner.name }}</span>
                        <span class="description">{{ summoner.description }}</span>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./summoner-picker.ts"></script>

<style lang="stylus" scoped>
    @import "./style.styl"

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .spell-selector
        position absolute
        top timer-status-height
        left 0
        right 0
        bottom 0
        z-index 1
        display flex
        flex-direction column
        align-items center
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
            max-height "calc(100vh - %s)" % (timer-status-height + 90px)
            overflow-y scroll
            -webkit-overflow-scrolling touch

        .summoner
            box-sizing border-box
            padding 20px 10px
            width 100%
            display flex
            align-items center
            border-bottom 1px solid alpha(#cdbe93, 0.8)

            img
                margin 10px
                width 120px
                height 120px

            .spell-info
                flex 1
                display flex
                flex-direction column
                margin 0 20px

                .name
                    font-size 45px

                .description
                    font-size 30px
                    color #fffaef
</style>