<template>
    <div class="champ-select" v-if="state" :style="background">
        <summoner-picker :state="state" :show="pickingSummonerSpell" :first="pickingFirstSummonerSpell" @close="pickingSummonerSpell = false"></summoner-picker>
        <champion-picker :state="state" :show="pickingChampion" @close="pickingChampion = false"></champion-picker>

        <timer :state="state"></timer>
        <members :state="state"></members>
        <player-settings :state="state" @spell="(pickingSummonerSpell = true, pickingFirstSummonerSpell = $event)" @expand="pickingChampion = true"></player-settings>
    </div>
</template>

<script lang="ts" src="./champ-select.ts"></script>

<style lang="stylus" scoped>
    @import "style.styl"

    .champ-select
        z-index 10000
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        background-size cover
        background-repeat no-repeat
</style>