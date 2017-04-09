<template>
    <div class="ready-check" v-show="shouldShow">
        <transition enter-active-class="zoomIn" leave-active-class="zoomOut">
            <div class="ready-prompt" v-if="shouldShow">
                <div class="progress-bar">
                    <div class="progress" :style="progressWidth" :class="{ 'accepted': state.playerResponse === 'Accepted', 'declined': state.playerResponse === 'Declined' }"></div>
                </div>

                <div class="header">Match Found</div>

                <lcu-button @click="accept" type="confirm" class="accept-button">
                    Accept!
                </lcu-button>

                <lcu-button @click="decline" class="decline-button">
                    Decline
                </lcu-button>
            </div>
        </transition>
    </div>
</template>

<script lang="ts" src="./ready-check.ts"></script>

<style lang="stylus" scoped>
    .zoomIn, .zoomOut
        animation-duration 0.4s !important

    .ready-check
        z-index 1000
        position absolute
        top 0
        bottom 0
        left 0
        right 0
        background-color rgba(0, 0, 0, 0.8)
        display flex
        justify-content center
        align-items center

    .ready-prompt
        position relative
        height 450px
        width 85%
        border-style solid
        border-width 8px
        border-image linear-gradient(to top, #614a1f 0, #463714 5px, #463714 100%) 2 stretch
        background-color #010a13
        text-align center
        display flex
        flex-direction column
        align-items center

    .progress-bar
        box-sizing border-box
        height 68px
        width 100%
        border-style solid
        border-image linear-gradient(to top, #614a1f 0, #463714 5px, #463714 100%) 2 stretch
        border-width 0
        border-bottom-width 8px

    .progress
        height 100%
        transition 1s linear
        background linear-gradient(186deg, #197e99, #134b6d, #197e99, #1e465d)
        background-size 400% 400%
        animation queue-background 3s ease infinite

        &.accepted
            background linear-gradient(186deg, #349954, #a1e08f, #31bd2d, #47a96e)
            background-size 400% 400%

        &.declined
            background linear-gradient(186deg, #c6403b, #f9413f, #ec3930, #ee241d)
            background-size 400% 400%

    .header
        margin 20px
        font-family "LoL Body"
        -webkit-font-feature-settings "kern" 1
        -webkit-font-smoothing antialiased
        color #f0e6d2
        font-weight bold
        text-transform uppercase
        font-size 80px
        letter-spacing 0.05em

    // This has an over-specific selector to make sure it gets precedence over normal styles.
    button.button.accept-button
        margin-top 30px
        width 92%
        height 120px
        font-size 80px

    button.button.decline-button
        position absolute
        bottom -50px
        left 50%
        transform translateX(-50%)
        width 70%
        height 80px
        font-size 50px
</style>