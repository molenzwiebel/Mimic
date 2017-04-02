<template>
    <div class="champ-select" v-if="state" :style="background">
        <timer :state="state"></timer>
        <members :state="state"></members>
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