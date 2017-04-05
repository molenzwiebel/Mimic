<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="champion-selector" v-show="show">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">{{ header }}</div>

            <div class="content">
                <img @click="selectChampion(champId)" :class="selectedChampion === champId && 'selected'" v-for="champId in selectableChampions" :src="getChampionImage(champId)">
            </div>

            <lcu-button @click="completeAction" :disabled="!canCompleteAction" :type="buttonType">
                {{ buttonText }}
            </lcu-button>
        </div>
    </transition>
</template>

<script lang="ts" src="./champion-picker.ts"></script>

<style lang="stylus" scoped>
    @import "./style.styl"

    button.button
        margin 20px

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .champion-selector
        position absolute
        top timer-status-height
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
            max-height "calc(100vh - %s)" % (timer-status-height + 90px)
            overflow-y scroll
            -webkit-overflow-scrolling touch
            display flex
            flex-wrap wrap
            justify-content center

        img
            box-sizing border-box
            border 2px solid transparent
            margin 15px
            width 200px
            height 200px
            opacity 0.6
            transition 0.3s ease

        img.selected
            border-color #c89c3c
            opacity 1
</style>