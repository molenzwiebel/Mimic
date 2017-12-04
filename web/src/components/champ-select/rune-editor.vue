<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="rune-editor" v-if="show && runes">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">Edit Runepages</div>

            <div class="page-options">
                <select class="league">
                    <option>Rune Page 1</option>
                    <option>Rune Page 2</option>
                </select>

                <div class="circular-button" @click="addPage"><i class="ion-plus"></i></div>
                <div class="circular-button" @click="removePage"><i class="ion-trash-a"></i></div>
            </div>

            <div class="content">
                <span class="section-header">PRIMARY TREE</span>
                <div class="tree-selector">
                    <div v-for="(tree, idx) in runes" class="tree" @click="selected[0] = idx, $forceUpdate()" :class="idx === selected[0] && 'selected'" :style="'background-image: url(http://stelar7.no/cdragon/latest/perkstyles/' + tree.id + '.png);'"></div>
                </div>

                <div class="tree-runes">
                    <div v-for="(slot, idx) in runes[selected[0]].slots" class="slot" :class="idx === 0 && 'keystone'">
                        <div v-for="(rune, idx2) in slot.runes" :class="idx2 === selected[idx + 1] && 'selected'" @click="selected[idx + 1] = idx2, $forceUpdate()" class="rune" :style="'background-image: url(http://stelar7.no/cdragon/latest/perks/' + rune.id + '.png);'"></div>
                    </div>
                </div>

                <span class="section-header">SECONDARY TREE</span>
                <div class="tree-selector">
                    <div v-for="(tree, idx) in runes" class="tree" @click="selected[5] = idx, $forceUpdate()" :class="idx === selected[5] && 'selected'" :style="'background-image: url(http://stelar7.no/cdragon/latest/perkstyles/' + tree.id + '.png);'"></div>
                </div>

                <div class="tree-runes">
                    <div v-for="(slot, idx) in runes[selected[5]].slots.slice(1)" class="slot">
                        <div v-for="(rune, idx2) in slot.runes" :class="idx2 === selected[idx + 6] && 'selected'" @click="selected[idx + 6] = idx2, $forceUpdate()" class="rune" :style="'background-image: url(http://stelar7.no/cdragon/latest/perks/' + rune.id + '.png);'"></div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts" src="./rune-editor.ts"></script>

<style lang="stylus" scoped>
    @import "../../common.styl"

    .fadeInUp, .fadeOutDown
        animation-duration 0.4s !important

    .rune-editor
        position absolute
        top timer-status-height
        left 0
        right 0
        bottom 0
        z-index 1
        display flex
        flex-direction column
        color #f0e6d3
        background-image url(../../static/magic-background.jpg)
        background-repeat no-repeat
        background-size cover

        .close
            position absolute
            top 22px
            right 40px
            font-size 70px

        & > .header
            width 100%
            text-align center
            border-bottom 1px solid lightgray
            margin-top 20px
            padding-bottom 20px
            font-family "LoL Body"
            font-size 60px

        .page-options
            min-height 90px
            padding 10px 0
            display flex
            flex-direction row
            align-items center

            select
                height 90px
                flex 1

            .circular-button
                flex 0 90px
                margin 0 10px

    .content
        overflow-y scroll
        -webkit-overflow-scrolling touch

        .section-header
            font-family "LoL Display"
            font-size 50px
            padding 20px 20px 40px 20px
            display block
            text-transform uppercase
            color #f0e6d2
            font-weight 700
            letter-spacing 0.075em

        .tree-selector
            padding 20px 10px
            width 100%
            display flex
            justify-content space-around
            padding-bottom 40px
            border-bottom 3px solid alpha(#c89c3c, 0.7)

            .tree
                position relative
                width 80px
                height 80px
                background-size cover
                transition 0.3s ease
                filter grayscale(100%)

            .tree::after
                transition 0.3s ease
                position absolute
                content ""
                width 130px
                height 130px
                top -25px
                left -25px
                border-radius 50%
                z-index -1
                background radial-gradient(transparent 62%, #785b28 65%, #c89c3c 76%, #c8a355 88%, #c8aa6e 100%)
                opacity 0

            .tree.selected::after
                opacity 1

            .tree.selected
                filter none

        .tree-runes
            width 100%
            display flex
            flex-direction column
            position relative
            margin-left 40px

            &:before
                content ''
                width 6px
                left 40px
                height calc(100% - 90px)
                position absolute
                opacity 0.7
                background linear-gradient(to top, #785b28 0%, #c89c3c 55%, #c8a355 71%, #c8aa6e 100%)

            .slot
                position relative
                padding 40px
                display flex
                justify-content space-around

            .slot.keystone:before
                color #c89c3c

            .slot:before
                content '◆'
                font-size 50px
                color #c8aa6e
                position absolute
                left 22px
                top 50%
                transform translate(0, -50%)

            .rune
                width 128px
                height 128px
                background-size cover
                position relative
                filter grayscale(100%)
                transition 0.3s ease

            .rune.selected
                filter none

            .rune::after
                transition 0.3s ease
                position absolute
                content ""
                width 160px
                height 160px
                top -((160px - 128px) / 2)
                left -((160px - 128px) / 2)
                border-radius 50%
                z-index -1
                background radial-gradient(transparent 62%, #785b28 65%, #c89c3c 76%, #c8a355 88%, #c8aa6e 100%)
                opacity 0

            .rune.selected::after
                opacity 0.8

            .keystone .rune::after
                width 200px
                height 200px
                top -((200px - 180px) / 2)
                left -((200px - 180px) / 2)

            .keystone .rune
                width 180px
                height 180px
</style>