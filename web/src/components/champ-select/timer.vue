<template>
    <div class="timer-state">
        <span class="state">{{ stateSubtitle }}</span>

        <div class="timer-bans">
            <div class="bans bans-mine">
                <template v-for="champ in ourBans">
                    <img v-if="champ" :src="getChampionIcon(champ)">
                    <div v-else="" class="ban-placeholder"></div>
                </template>
            </div>

            <span class="time">{{ Math.ceil(currentTime / 1000) }}</span>

            <div class="bans bans-enemy">
                <template v-for="champ in enemyBans">
                    <img v-if="champ" :src="getChampionIcon(champ)">
                    <div v-else="" class="ban-placeholder"></div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./timer.ts"></script>

<style lang="stylus" scoped>
    @require "./style.styl"

    .timer-state
        box-sizing border-box
        height timer-status-height
        display flex
        flex-direction column
        justify-content center
        align-items center
        border-bottom 1px solid rgba(240, 230, 210, 0.5)

        .state
            font-family "LoL Body"
            font-size 40px
            color white

    .timer-bans
        width 100%
        display flex
        flex-direction row
        justify-content space-between
        align-items center

        .time
            font-size 60px
            color #f0e6d2
            letter-spacing 0.05em
            font-family "LoL Display Bold"

    .bans
        display flex
        margin 0 20px

    img, .ban-placeholder
        box-sizing border-box
        width 60px
        height 60px
        margin 5px

    .ban-placeholder
        border 0.5px solid black
        background radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, black 100%)
</style>