<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="bench" v-show="show">
            <i class="ion-android-close close" @click="$emit('close')"></i>
            <div class="header">Reroll Bench</div>

            <div class="content">
                <div class="bench-champion" v-for="championId in state.benchChampionIds" @click="swapWithChampion(championId)">
                    <div class="background" :style="getChampionBackground(championId)"></div>
                    <div class="darken"></div>
                    <div class="name">{{ getChampionName(championId) }}</div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./bench.ts"></script>

<style lang="stylus">
    body.has-notch .bench
        margin-top calc(env(safe-area-inset-top) + 30px)
        padding-bottom calc(env(safe-area-inset-bottom) + 20px)
</style>

<style lang="stylus" scoped>
    @import "../../common.styl"

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .bench
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
            width 100%

        .bench-champion
            position relative
            width 100%
            height 160px
            border-bottom 1px solid #785a28
            display flex
            align-items center

            .name
                font-size 60px
                margin-left 20px
                font-family LoL Display Bold
                color #efe5d1

            .background, .darken
                position absolute
                z-index -1
                left 0
                top 0
                bottom 0
                right 0

            .darken
                background linear-gradient(to left, transparent, rgba(0, 0, 0, 0.8))

            .background
                background-repeat no-repeat
                background-position 0 -80px
                background-size cover
                transition 0.3s ease
</style>