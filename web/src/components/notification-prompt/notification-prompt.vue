<template>
    <div class="notification-prompt" v-if="shouldShow" v-show="imageLoaded">
        <div class="text">
            <span class="title">Push Notifications</span>

            <span class="body">
                Receive an instant notification when your queue
                pops and accept it anywhere at any time. No need
                to keep a watchful eye on your phone anymore.<br><br>

                You will receive a notification whenever a ready check
                appears on {{ $root.peerName }}.

                <template v-if="isIOS">
                    Drag down on the notification or long-press to accept
                    or decline without leaving your current app.
                </template>

                <template v-else>
                    Use the notification buttons to instantly accept or
                    decline without leaving your current app.
                </template>
            </span>

            <span class="disclaimer">
                Mimic will use your permission to send queue notifications only.
                You will never receive marketing notifications.
            </span>

            <lcu-button @click="approve" class="button" type="confirm">Allow</lcu-button>
            <lcu-button @click="deny" class="button">No Thanks</lcu-button>
        </div>

        <div class="device-container">
            <img v-if="isIOS" class="device-content" src="../../static/notifications/ios.png" @load="imageLoaded = true">
            <img v-else class="device-content" src="../../static/notifications/android.png" @load="imageLoaded = true">
        </div>
    </div>
</template>

<script lang="ts" src="./notification-prompt.ts"></script>

<style lang="stylus">
    body.has-notch .notification-prompt
        padding-top calc(env(safe-area-inset-top) + 30px)
        height 100vh
</style>

<style lang="stylus" scoped>
    .notification-prompt
        box-sizing border-box
        background-image url(../../static/magic-background.jpg)
        background-size cover
        background-position center
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        display flex
        flex-direction column
        z-index 100

        .text
            margin-bottom 40px
            flex 1
            display flex
            flex-direction column
            align-items center

        .title
            font-family LoL Display
            font-size 100px
            font-weight bold
            color #f0e6d3
            padding 40px

        .body
            flex 1
            display flex
            flex-direction column
            align-items center
            justify-content center

        .body, .disclaimer
            text-align center
            font-family LoL Body
            font-size 40px
            color #dcd2bf
            margin 10px 60px

        .disclaimer
            font-size 30px

        .button
            margin 20px
            width 90vw

        .device-content
            min-width 90vw
            height auto

        .device-container
            flex 0 35vh
            overflow hidden
            display flex
            flex-direction column
            align-items center
</style>