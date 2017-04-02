<template>
    <!-- To animate the "appearing" of the queue indicator, we always show the queue but give it a height of 0 when not in queue. -->
    <div class="queue" :class="shouldShow ? '' : 'hidden'">
        <div v-if="shouldShow" class="left">
            <i class="ion-android-search"></i>
            <div class="text">
                <span class="time">{{ formatSeconds(state.timeInQueue) }}</span>
                <span class="estimated">Estimated: {{ formatSeconds(state.estimatedQueueTime) }}</span>
            </div>
        </div>

        <i @click="leaveQueue" class="ion-log-out"></i>
    </div>
</template>

<script lang="ts" src="./queue.ts"></script>

<style lang="stylus" scoped>
    @keyframes queue-background
        0%
            background-position 100% 0
        50%
            background-position 0 100%
        100%
            background-position 100% 0

    .queue
        transition 0.3s ease
        height 200px
        border-bottom 3px solid #785a28
        background linear-gradient(186deg, #197e99, #134b6d, #197e99, #1e465d)
        background-size 400% 400%
        animation queue-background 10s ease infinite
        display flex
        justify-content space-between
        align-items center

    .left
        flex 1
        display flex
        flex-direction row
        align-items center

        i
            margin-left 30px
            color white
            font-size 120px

    .text
        margin-left 30px
        display flex
        flex 1
        flex-direction column
        font-family "LoL Display"

        .time
            font-size 70px
            color #f0e6d2
            letter-spacing 0.05em
            font-family "LoL Display Bold"

        .estimated
            font-size 50px
            color #0acbe6

    .queue > i
        font-size 80px
        color #f0e6d3
        margin 40px

    .hidden
        height 0
        border-bottom-width 0
</style>