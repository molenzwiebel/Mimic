<template>
    <button class="button" :class="className + ' ' + type" @click="!disabled && $emit('click')" :disabled="disabled">
        <div class="button-border"></div>
        <slot></slot>
    </button>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Component, Prop } from "vue-property-decorator";

    export type ButtonType = "normal" | "confirm" | "deny";

    @Component
    export default class LCUButton extends Vue {
        @Prop({ default: false })
        disabled: boolean;

        @Prop({ default: "" })
        className: string;

        @Prop({ default: "normal" })
        type: ButtonType;
    }
</script>

<style lang="stylus" scoped>
    .button
        position relative
        width calc(100% - 40px)
        height 120px
        background-color rgb(30, 35, 40)
        text-transform uppercase
        font-size 60px
        font-family "LoL Display Bold", serif
        transition 0.2s ease-in-out

        &.normal
            color #cdbe91
            .button-border
                border-image linear-gradient(to top, #785b28 0%, #c89c3c 55%, #c8a355 71%, #c8aa6e 100%) 1 stretch

        &.normal:active
            color darken(#cdbe91, 60%)
            .button-border
                border-image linear-gradient(to top, darken(#785b28, 30%) 0%, darken(#c89c3c, 30%) 55%, darken(#c8a355, 30%) 71%, darken(#c8aa6e, 30%) 100%) 1 stretch

        &.confirm
            color #a3c7c7
            .button-border
                border-image linear-gradient(to top, #0d404c 0%, #0596aa 44%, #0596aa 93%, #0ac8b9 100%) 1 stretch

        &.confirm:active
            color darken(#a3c7c7, 60%)
            .button-border
                border-image linear-gradient(to top, darken(#0d404c, 30%) 0%, darken(#0596aa, 30%) 44%, darken(#0596aa, 30%) 93%, darken(#0ac8b9, 30%) 100%) 1 stretch

        &.deny
            color #bd253c
            .button-border
                border-image linear-gradient(to top, #c6403b 0%, #f9413f 44%, #ec3930 93%, #ee241d 100%) 1 stretch

        &.deny:active
            color darken(#bd253c, 60%)
            .button-border
                border-image linear-gradient(to top, darken(#c6403b, 30%) 0%, darken(#f9413f, 30%) 44%, darken(#ec3930, 30%) 93%, darken(#ee241d, 30%) 100%) 1 stretch

        &[disabled]
            background-color #1e2328
            color #5c5b57

            .button-border
                border 6px solid #5c5b57 !important

        .button-border
            transition 0.3s ease
            position absolute
            width 100%
            height 100%
            left -3px
            top -3px
            border-width 6px
            border-style solid
</style>