<template>
    <div class="create-lobby" style="color: white">
        <div v-for="section in sections">
            Category {{ section }}

            <div v-for="queue in availableQueues[section]">
                {{ queue.description }}
            </div>
        </div>

        <span v-if="!isStandalone" class="tip">
            <b>PRO TIP: </b>

            <template v-if="canTriggerHomescreenPrompt">
                <span style="text-decoration: underline" @click="triggerInstallPrompt">Add this site to your homescreen</span>
            </template>

            <template v-else>
                Add this site to your homescreen
            </template>

            <br>to use Mimic in fullscreen.
        </span>
    </div>
</template>

<script lang="ts" src="./create-lobby.ts"></script>

<style lang="stylus">
    body.has-notch .create-lobby
        height 100vh

        padding-top calc(env(safe-area-inset-top) + 25px)
        padding-bottom calc(env(safe-area-inset-bottom) + 14px)
</style>

<style lang="stylus" scoped>
    .create-lobby
        box-sizing border-box
        background-image url(../../static/magic-background.jpg)
        background-size cover
        background-position center
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        flex 1
        transition background-image 0.3s ease // Not a standard, but most mobile browsers (chrome) support it.
        display flex
        flex-direction column
        justify-content space-between

    .tip
        position absolute
        bottom 0
        left 0
        margin 20px
        width 100%
        color #aaaea0
        font-family "LoL Body"
        font-size 40px
        text-align center
</style>