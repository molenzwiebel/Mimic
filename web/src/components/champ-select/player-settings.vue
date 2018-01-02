<template>
    <div class="player-settings">
        <div class="chevron expand-button" @click="$emit('expand')" v-if="!allowsReroll">
            <i class="ion-chevron-up"></i>
        </div>

        <div class="chevron reroll-button" @click="reroll()" v-else :class="canReroll || 'disabled'">
            <i class="ion-loop" style="margin-right: 15px"></i>
            Reroll {{ rerollState }}
        </div>

        <div class="runes">
            <select class="league" @change="$parent.selectRunePage($event)">
                <option :value="rune.id" :selected="rune.isActive" v-for="rune in $parent.runePages">{{ rune.name }}</option>
            </select>
        </div>

        <div class="summoners">
            <img :src="getSummonerSpellImage(state.localPlayer.spell1Id)" @click="$emit('spell', true)">
            <img :src="getSummonerSpellImage(state.localPlayer.spell2Id)" @click="$emit('spell', false)">
        </div>
    </div>
</template>

<script lang="ts" src="./player-settings.ts"></script>

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
        transform translate(-50%, -100%)
        font-size 50px
        border-top-left-radius 8px
        border-top-right-radius 8px
        display flex
        align-items center
        text-transform uppercase

    .expand-button
        padding 4px 40px
        color white
        border 1px solid rgba(240, 230, 210, 0.7)
        border-bottom-width 0
        background-color rgba(0, 0, 0, 0.5)

    .reroll-button
        padding 6px 30px
        color #b6dbdb
        border 2px solid #0596aa
        border-bottom-width 0
        background-color rgba(0, 0, 0, 0.7)
        font-family LoL Display

        &.disabled
            color #657a7a

    .runes
        flex 1
        display flex
        flex-direction column

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