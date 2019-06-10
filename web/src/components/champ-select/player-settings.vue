<template>
    <div class="player-settings">
        <div class="chevron expand-button" @click="$emit('expand')" v-if="!allowsReroll">
            <i class="ion-chevron-up"></i>
        </div>

        <div class="chevron" v-else>
            <div class="reroll bordered" @click="reroll()" :class="canReroll || 'disabled'">
                <i class="ion-loop" style="margin-right: 15px"></i>
                <span>Reroll {{ rerollState }}</span>
            </div>

            <div class="bench bordered" @click="$emit('bench')">
                <i class="ion-chevron-up" style="margin-right: 15px"></i>
                Bench
            </div>
        </div>

        <div class="runes">
            <select class="league" @change="$parent.selectRunePage($event)">
                <option :value="rune.id" :selected="rune.isActive" v-for="rune in $parent.runePages">{{ rune.name }}</option>
            </select>

            <div class="circular-button" @click="$emit('runes')"><i class="ion-edit"></i></div>
        </div>

        <div class="summoners">
            <img :src="getSummonerSpellImage(state.localPlayer.spell1Id)" @click="$emit('spell', true)">
            <img :src="getSummonerSpellImage(state.localPlayer.spell2Id)" @click="$emit('spell', false)">
        </div>
    </div>
</template>

<script lang="ts" src="./player-settings.ts"></script>

<style lang="stylus">
    body.has-notch .player-settings
        padding-bottom calc(env(safe-area-inset-bottom) + 20px) // 10px by default
</style>

<style lang="stylus" scoped>
    @require "../../common.styl"

    .player-settings
        position relative
        box-sizing border-box
        border-top 1px solid rgba(240, 230, 210, 0.5)
        background-color rgba(0, 0, 0, 0.5)
        height player-settings-height
        display flex
        align-items center
        padding 10px

    .chevron
        position absolute
        top 0
        left 50%
        width 100%
        transform translate(-50%, -100%)
        font-size 50px
        border-top-left-radius 8px
        border-top-right-radius 8px
        display flex
        align-items center
        justify-content center
        text-transform uppercase

    .expand-button
        padding 4px 40px
        color white
        border 1px solid rgba(240, 230, 210, 0.7)
        border-bottom-width 0
        background-color rgba(0, 0, 0, 0.5)
        width 40px

    .bordered
        padding 6px 30px
        color #b6dbdb
        border 2px solid #0596aa
        border-bottom-width 0
        background-color rgba(0, 0, 0, 0.7)
        font-family LoL Display

        &.disabled
            color #657a7a

        &.reroll
            margin-right 20px

        &.bench
            margin-left 20px

    .runes
        flex 1
        display flex
        flex-direction row
        align-items center

        select
            flex 1

        .circular-button
            flex 0 90px
            margin 0 0 0 6px

    .summoners
        display flex
        align-items center
        padding 10px

        img
            margin 20px
            border 1px solid #3c3c41
            height player-dropdown-height * 1.8
            width player-dropdown-height * 1.8
</style>