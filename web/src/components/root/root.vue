<template>
    <div>
        <div v-if="!connected" class="full-screen-msg">
            <span class="msg">Enter the IP as shown in tray icon right-click menu (this is temporary).</span>
            <input v-model="hostname" placeholder="192.168.1.1">
            <button @click="connect">Connect</button>
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
    .full-screen-msg
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

        input, button
            margin-top 10px
            background-color white
            width 90%
            height 120px
            font-size 60px

        .msg
            margin 20px
            color white
            font-size 100px
            font-family "LoL Body"

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