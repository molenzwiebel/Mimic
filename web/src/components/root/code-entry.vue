<template>
    <div class="code-entry">
        <input type="number" ref="d0" data-next="d1" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
        <input type="number" ref="d1" data-next="d2" data-prev="d0" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
        <input type="number" ref="d2" data-next="d3" data-prev="d1" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
        <input type="number" ref="d3" data-next="d4" data-prev="d2" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
        <input type="number" ref="d4" data-next="d5" data-prev="d3" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
        <input type="number" ref="d5" data-prev="d4" @keyup="nextCharacter" @keydown="maybePreviousCharacter" placeholder="0">
    </div>
</template>

<script lang="ts">
    export default {
        props: ["value"],
        mounted() {
            // Import previous value.
            const keys = Object.keys(this.$refs);

            this.value.split("").forEach((digit: string, idx: number) => {
                this.$refs[keys[idx]].value = digit;
            });
        },
        methods: {
            nextCharacter(ev: KeyboardEvent) {
                const tgt: HTMLInputElement = <HTMLInputElement> ev.target;
                const next = tgt.getAttribute("data-next");

                if (tgt.value.length > 0 && next) {
                    // Go to next.
                    this.$refs[next].focus();
                }

                const total = Object.keys(this.$refs).map(x => this.$refs[x].value).join("");
                this.$emit("input", total);
            },

            maybePreviousCharacter(ev: KeyboardEvent) {
                const tgt: HTMLInputElement = <HTMLInputElement> ev.target;

                // If this is backspace and we're currently empty, go back to previous.
                if (ev.which === 8 && !tgt.value) {
                    const prev = tgt.getAttribute("data-prev");
                    if (!prev) return;

                    // Clear previous and focus.
                    this.$refs[prev].value = "";
                    this.$refs[prev].focus();

                    return;
                }

                // If there was already a value in here, don't accept another.
                if (tgt.value.length && ev.which !== 8) {
                    ev.preventDefault();
                }
            }
        }
    };
</script>

<style lang="stylus">
    .code-entry input
        margin-right 10px
        width 120px
        box-sizing border-box
        height 180px
        padding 20px
        -webkit-appearance none
        outline none
        border-radius 0
        color #f0e6d2
        font-size 110px
        text-align center
        font-family "LoL Body"
        border 3px solid #785a28
        background-color black
</style>