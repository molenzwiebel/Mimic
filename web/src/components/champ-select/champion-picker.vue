<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="champion-selector" v-show="show">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">{{ header }}</div>

            <input ref="searchInput" v-model="searchTerm" type="text" class="search" autocomplete="off" spellcheck="false" placeholder="Search..." maxlength="24" autocorrect="off" autocapitalize="off">

            <div class="content">
                <div class="champion-option" v-for="champId in selectableChampions">
                    <img @click="selectChampion(champId)" :class="selectedChampion === champId && 'selected'" :src="getChampionImage(champId)">
                    <div class="name">{{ championName(champId) }}</div>
                </div>
            </div>

            <lcu-button @click="completeAction" :disabled="!canCompleteAction" :type="buttonType">
                {{ buttonText }}
            </lcu-button>
        </div>
    </transition>
</template>

<script lang="ts" src="./champion-picker.ts"></script>

<style lang="stylus">
    body.has-notch .champion-selector
        margin-top calc(env(safe-area-inset-top) + 30px)
        padding-bottom calc(env(safe-area-inset-bottom) + 20px)
</style>

<style lang="stylus" scoped>
    @import "../../common.styl"

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

        .champion-option
            display flex
            flex-direction column
            align-items center

            .name
                color #f0e6d3
                font-size 35px
                padding 5px
                font-family LoL Body
                max-width 22vw
                white-space nowrap
                overflow hidden
                text-overflow ellipsis

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

    .search
        box-sizing border-box
        height 110px
        padding 20px
        margin 20px 10px 20px 20px
        -webkit-appearance none
        outline none
        border-radius 0
        color #f0e6d2
        font-size 40px
        font-family "LoL Body"
        border 3px solid #785a28
        background-color black
</style>