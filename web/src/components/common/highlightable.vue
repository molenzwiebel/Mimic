<template>
    <a class="highlightable">
        <slot></slot>
    </a>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Component } from "vue-property-decorator";

    @Component
    export default class Hightlightable extends Vue {
    }
</script>

<style lang="stylus" scoped>
    .highlightable:active
        opacity 0.7
</style>