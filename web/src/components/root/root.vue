<template>
    <div style="height: 100%">
        <div v-if="!connected || !peerVersion" class="intro">
            <!-- TODO -->
            <socket-state
                    :socket="socket"
                    @connect="connect"
                    @reset="socket = null"
            ></socket-state>
        </div>

        <div v-else="" class="body">
            <champ-select />
            <ready-check />
            <notification-prompt />
            <invites />
            <queue />
            <lobby />
        </div>

        <transition enter-active-class="slideInUp" leave-active-class="slideOutDown">
            <div v-if="notification" class="notification">
                {{ notification }}
            </div>
        </transition>
    </div>
</template>

<script lang="ts" src="./root.ts"></script>

<style lang="stylus" scoped>
    // Position the message in the center.
    .intro
        position absolute
        background-image url(../../static/magic-background.jpg)
        left 0
        top 0
        right 0
        bottom 0
        display flex
        flex-direction column
        justify-content center
        align-items center

    // Make sure the body has the full size.
    .body
        display flex
        flex-direction column
        height 100%

    .notification
        z-index 1000
        position absolute
        background-color black
        padding 10px
        text-transform uppercase
        border-top 2px solid #785a28
        bottom 0
        left 0
        right 0
        color #d5d9c9
        font-family "LoL Body"
        font-size 40px
        text-align center
</style>