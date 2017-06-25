<template>
    <div class="player-settings">
        <div class="chevron expand-button" @click="$emit('expand')" v-if="!allowsReroll">
            <i class="ion-chevron-up"></i>
        </div>

        <div class="chevron reroll-button" @click="reroll()" v-else :class="canReroll || 'disabled'">
            <i class="ion-loop" style="margin-right: 15px"></i>
            Reroll {{ rerollState }}
        </div>

        <div class="rune-mastery">
            <select @change="selectRunePage($event)">
                <option :value="rune.id" :selected="rune.current" v-for="rune in runePages">{{ rune.name }}</option>
            </select>

            <select @change="selectMasteryPage($event)">
                <option :value="mastery.id" :selected="mastery.current" v-for="mastery in masteryPages">{{ mastery.name }}</option>
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
    @require "./style.styl"

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

    .rune-mastery
        flex 1
        display flex
        flex-direction column

        select
            box-sizing border-box
            -webkit-appearance none
            font-family "LoL Body"
            color #a09b8c
            font-size 35px
            height player-dropdown-height
            width 100%
            margin 5px
            padding 7px 15px
            border-width 2px
            border-style solid
            border-image linear-gradient(to top,#695625 0%,#a9852d 23%,#b88d35 93%,#c8aa6e 100%) 1
            background url(../../static/dropdown_arrows.png) no-repeat right rgb(30, 35, 40)
            background-size auto player-dropdown-height - 30px
            background-position right 10px center

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