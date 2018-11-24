<template>
    <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
        <div class="rune-editor" v-if="show && runes">
            <i class="ion-minus close" @click="$emit('close')"></i>
            <div class="header">Edit Rune Pages</div>

            <div class="page-options">
                <select class="league" @change="$parent.selectRunePage($event)">
                    <option :value="rune.id" :selected="rune.isActive" v-for="rune in $parent.runePages.filter(x => x.isEditable)">{{ rune.name }}</option>
                </select>

                <div class="circular-button" @click="addPage"><i class="ion-plus"></i></div>
                <div class="circular-button" @click="removePage"><i class="ion-trash-a"></i></div>
            </div>

            <div class="content" v-if="currentPage">
                <span class="section-header">PRIMARY TREE</span>
                <div class="tree-selector">
                    <div v-for="tree in runes" class="tree" @click="selectPrimaryTree(tree.id)" :class="currentPage.primaryStyleId === tree.id && 'selected'" :style="getRuneIconStyle(tree)"></div>
                </div>

                <div class="tree-runes">
                    <div v-for="(slot, idx) in getRuneTree(currentPage.primaryStyleId).slots" class="slot" :class="idx === 0 && 'keystone'">
                        <div v-for="rune in slot.runes" :class="currentPage.selectedPerkIds[idx] === rune.id && 'selected'" @click="selectPrimaryRune(idx, rune.id)" class="rune" :style="getRuneIconStyle(rune)"></div>
                    </div>
                </div>

                <span class="section-header">SECONDARY TREE</span>
                <div class="tree-selector">
                    <div v-for="tree in runes" class="tree" @click="selectSecondaryTree(tree.id)" :class="currentPage.subStyleId === tree.id && 'selected'" :style="getRuneIconStyle(tree)"></div>
                </div>

                <div class="tree-runes">
                    <div v-for="(slot, idx) in (getRuneTree(currentPage.subStyleId) || { slots: [] }).slots.slice(1)" class="slot">
                        <div v-for="rune in slot.runes" :class="(currentPage.selectedPerkIds[4] === rune.id || currentPage.selectedPerkIds[5] === rune.id) && 'selected'" @click="selectSecondaryRune(rune.id)" class="rune" :style="getRuneIconStyle(rune)"></div>
                    </div>
                </div>

                <span class="section-header">STAT MODS</span>
                <div class="tree-runes">
                    <!-- For every tree in the stats. IDs are hardcoded since they are not in the json. -->
                    <div
                        v-for="(opts, idx) in [[5008, 5005, 5007], [5008, 5002, 5003], [5001, 5002, 5003]]"
                        class="slot">
                        <div
                            v-for="option in opts"
                            class="rune stat"
                            :class="currentPage.selectedPerkIds[6 + idx] === option && 'selected'"
                            @click="selectStatRune(idx, option)"
                            :style="'background-image: url(http://stelar7.no/cdragon/latest/perks/' + option + '.png)'">
                            <span style="padding-top: 180px">{{ getStatDescription(option) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content" v-else>
                <!-- No viable page (one that is editable) exists. -->
                <span class="section-header">SELECT OR CREATE A PAGE</span>
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
        padding-bottom 20px

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

                &.stat
                    width 100px
                    height 100px
                    display flex
                    align-items center
                    justify-content center
                    margin-bottom 30px

                    color #c8aa6e
                    font-size 40px
                    font-family LoL Display

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

            .rune.stat::after
                width 120px
                height 120px
                top -((120px - 100px) / 2)
                left -((120px - 100px) / 2)

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