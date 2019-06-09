<template>
    <div class="create-lobby">
        <div class="header">
            <i @click="$emit('close')" class="ion-chevron-left"></i>
            <span>Create Lobby</span>
        </div>

        <div class="sections">
            <div class="section" v-for="section in sections">
                <img
                        @click="selectSection(section)"
                        :src="sectionIcon(section, 'default')">

                <img
                        :class="selectedSection !== section && 'hide'"
                        @click="selectSection(section)"
                        :src="sectionIcon(section, 'active')">
            </div>
        </div>

        <div class="section-title">
            {{ sectionTitle }}
        </div>

        <div class="queues">
            <div
                class="queue"
                v-for="queue in availableQueues[selectedSection]"
                :class="selectedQueueId === queue.id && 'selected'"
                @click="selectedQueueId = queue.id">
                <div class="diamond-outer">
                    <div class="diamond-inner"></div>
                </div>

                <span>{{ queue.description }}</span>
            </div>
        </div>

        <div class="create">
            <lcu-button @click="createLobby">
                Confirm
            </lcu-button>
        </div>
    </div>
</template>

<script lang="ts" src="./create-lobby.ts"></script>

<style lang="stylus">
    body.has-notch .create-lobby
        height 100vh

        padding-top calc(env(safe-area-inset-top) + 25px)
        padding-bottom calc(env(safe-area-inset-bottom) + 14px)
</style>

<style lang="stylus" scoped>
    .create-lobby
        box-sizing border-box
        background-image url(../../static/magic-background.jpg)
        background-size cover
        background-position center
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        flex 1
        transition background-image 0.3s ease // Not a standard, but most mobile browsers (chrome) support it.
        display flex
        flex-direction column

    .header
        display flex
        align-items center
        padding 30px
        background-color rgba(0, 0, 0, 0.7)
        border-bottom 1px solid white

        & i
            font-size 70px
            color #efe5d1

        & span
            margin-left 30px
            font-size 65px
            font-family LoL Display Bold
            color #f0d9a3

    .sections
        display flex
        justify-content space-around
        margin-top 30px

        .section
            position relative
            padding 10px
            width 20vw
            height 20vw

        .section img
            position absolute
            transition opacity 0.2s ease
            width 100%
            height 100%

        .section img.hide
            opacity 0

    .section-title
        box-sizing border-box
        margin-top 20px
        width 100%
        padding 30px
        font-family "LoL Display Bold"
        font-size 65px
        color #f0d9a3
        text-align center
        border-bottom 1px solid alpha(white, 0.7)
        text-transform uppercase

    .queues
        display flex
        flex-direction column
        width 100%
        padding 30px
        flex 1

        .queue
            display flex
            align-items center
            height 75px
            padding 10px

        .queue span
            font-family "LoL Display Bold"
            font-size 50px
            margin-left 20px
            text-transform uppercase
            transition 0.2s ease
            color #bdb088

        .diamond-outer
            transform rotate(45deg)
            width 35px
            height 35px
            position relative
            background-color #87692c

        .diamond-inner
            position absolute
            top 6px
            left 6px
            width 23px
            height 23px
            transition background-color 0.2s ease
            background-color #08181f

        .queue.selected .diamond-inner
            box-sizing border-box
            border 5px solid #08181f
            background-color #f0e6d2

        .queue.selected span
            color #efe5d1

    .create
        align-self center
        width 100%
        display flex
        justify-content center
        padding-bottom 20px
</style>