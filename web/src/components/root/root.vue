<template>
    <div>
        <div v-if="!connected" class="intro">
            <span class="header">Welcome to Mimic!<br><small>How would you like to connect?</small></span>

            <div class="automatic">
                <span>Try to find your computer automatically.<br>This is not recommended on shared networks.</span>
                <lcu-button :disabled="discoveringConduit" :type="discoveryButtonType" @click="discoverConduit()">Find Conduit</lcu-button>
            </div>

            <div class="or">
                <div></div>
                <span>OR</span>
                <div></div>
            </div>

            <div class="manual">
                <span>Enter your computer's IP address.<br>You can find this in Conduit's right-click menu.</span>
                <input v-model="hostname" placeholder="192.168.1.1">
                <lcu-button :disabled="(!hostname) || connecting" :type="manualButtonType" @click="connect()">Connect</lcu-button>
            </div>
        </div>

        <div v-else="" class="body">
            <champ-select></champ-select>
            <ready-check></ready-check>
            <invites></invites>
            <queue></queue>
            <lobby></lobby>
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

        .header
            position absolute
            top 100px
            left 0
            right 0
            text-align center
            font-family "LoL Header"
            font-size 80px
            color #f0e6d3
            padding 50px

            & > small
                font-size 60px
                color #dcd2bf

        .automatic, .manual
            width 95%
            display flex
            flex-direction column
            justify-content center
            align-items center
            padding 20px 0

        .automatic > span, .manual > span
            color #f0e6d3
            font-family "LoL Body"
            font-size 40px
            padding 10px 10px 20px 20px
            align-self flex-start

        .or
            width 100%
            display flex
            align-items center
            justify-content space-around
            flex-direction row

        .or div
            flex 1 0
            height 3px
            background-color alpha(#fffce1, 0.6)

        .or span
            flex 0
            padding 10px
            color #d5d9c9
            font-family "LoL Body"
            font-size 40px

        .manual input
            width 100%
            box-sizing border-box
            height 110px
            padding 20px
            margin 10px 60px 30px 60px
            -webkit-appearance none
            outline none
            border-radius 0
            color #f0e6d2
            font-size 40px
            font-family "LoL Body"
            border 3px solid #785a28
            background-color black

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