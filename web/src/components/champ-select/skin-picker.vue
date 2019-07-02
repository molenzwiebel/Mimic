<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="skin-selector" v-show="show">
            <i class="ion-android-close close" @click="$emit('close')"></i>
            <div class="header">Select Your Skin</div>

            <div class="content">
                <div class="skin" :class="!skin.ownership.owned && 'unowned'" v-for="skin in availableSkins" @click="selectSkin(skin)">
                    <div class="skin-image" :style="getSkinImage(skin)"></div>
                    <div class="name">{{ skin.name }}</div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./skin-picker.ts"></script>

<style lang="stylus">
    body.has-notch .skin-selector
        margin-top calc(env(safe-area-inset-top) + 30px)
        padding-bottom calc(env(safe-area-inset-bottom) + 20px)
</style>

<style lang="stylus" scoped>
    @import "../../common.styl"

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .skin-selector
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
            width 90%

        .skin
            height 300px
            box-sizing border-box
            border 3px solid #c8aa6e
            position relative
            display flex
            color white
            width 100%
            margin 25px 0

            &.unowned .skin-image
                filter grayscale()

            .skin-image
                background white
                position absolute
                z-index -1
                left 0
                top 0
                bottom 0
                right 0
                background-repeat no-repeat
                background-size cover
                transition 0.3s ease

                &:after
                    content ""
                    position absolute
                    left 0
                    top 0
                    bottom 0
                    right 0
                    background-image linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%)

            .name
                position absolute
                bottom 30px
                flex 1
                display flex
                flex-direction column
                margin 0 20px
                font-size 45px
                text-shadow 4px 4px 8px #111
</style>