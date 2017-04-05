<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div v-show="show" class="role-picker">
            <i class="ion-android-close close" @click="close()"></i>
            <div class="header">Select {{ selectingFirst ? 'First' : 'Second' }} Role</div>

            <div class="role" @click="select(role.key)" v-for="role in ROLES">
                <img :src="roleImage(role.key)">
                <span>{{ role.name }}</span>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./role-picker.ts"></script>

<style lang="stylus" scoped>
    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .role-picker
        position absolute
        top 165px
        left 0
        right 0
        bottom 0
        z-index 2
        display flex
        flex-direction column
        align-items center
        background-image url(../../static/magic-background.jpg)
        background-repeat no-repeat
        background-size cover
        color #f0e6d3

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

        .role
            box-sizing border-box
            padding 10px
            width 100%
            display flex
            align-items center
            border-bottom 1px solid #cdbe93
            font-family "LoL Display"
            font-size 60px

            span
                margin-left 30px

            img
                margin-left 10px
</style>