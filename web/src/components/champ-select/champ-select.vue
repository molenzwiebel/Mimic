<template>
    <div class="champ-select" v-if="state && state.localPlayer" :style="background">
        <summoner-picker :state="state" :show="pickingSummonerSpell" :first="pickingFirstSummonerSpell" @close="pickingSummonerSpell = false"></summoner-picker>
        <champion-picker :state="state" :show="pickingChampion" @close="pickingChampion = false"></champion-picker>
        <bench :state="state" :show="showingBench" @close="showingBench = false"></bench>
        <skin-picker :state="state" :show="pickingSkin" @close="pickingSkin = false"></skin-picker>

        <timer :state="state"></timer>
        <members :state="state"></members>
        <player-settings
            :state="state"
            @spell="(pickingSummonerSpell = true, pickingFirstSummonerSpell = $event)"
            @expand="pickingChampion = true"
            @runes="showingRuneOverlay = true"
            @bench="showingBench = true"
            @skins="pickingSkin = true">
        </player-settings>
        <rune-editor :show="showingRuneOverlay" @close="showingRuneOverlay = false"></rune-editor>

    </div>
</template>

<script lang="ts" src="./champ-select.ts"></script>

<style lang="stylus">
    body.has-notch .champ-select
        height 100vh
        box-sizing border-box

        padding-top calc(env(safe-area-inset-top) + 30px)
</style>

<style lang="stylus" scoped>
    @import "../../common.styl"

    .champ-select
        z-index 10000
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        background-size cover
        background-repeat no-repeat
        display flex
        flex-direction column
</style>