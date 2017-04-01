<template>
    <div>
        <div v-if="!connected" class="full-screen-msg">
            <span class="msg">Connecting...</span>
        </div>

        <div v-else="" class="body">
            <champ-select></champ-select>
            <ready></ready>
            <queue></queue>
            <lobby></lobby>
            <invites></invites>
        </div>
    </div>
</template>

<script lang="ts" src="./root.ts"></script>

<style lang="stylus" scoped>
    // Position the message in the center.
    .full-screen-msg
        position absolute
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        left 0
        top 0
        right 0
        bottom 0
        display flex
        justify-content center
        align-items center

        .msg
            color white
            font-size 100px
            font-family "LoL Body"

    // Make sure the body has the full size.
    .body
        display flex
        flex-direction column
        height 100%
</style>