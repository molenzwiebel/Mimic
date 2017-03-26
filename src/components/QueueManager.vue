<template>
    <div class="queue" :class="isInQueue && queueData.isCurrentlyInQueue ? '' : 'hidden'">
        <div class="left">
            <i class="ion-android-search"></i>
            <div class="text">
                <span class="time">{{ formatSeconds(queueData.timeInQueue) }}</span>
                <span class="estimated">Estimated: {{ formatSeconds(queueData.estimatedQueueTime) }}</span>
            </div>
        </div>

        <i @click="leaveQueue()" class="ion-log-out"></i>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface Queue {
        estimatedQueueTime: number;
        isCurrentlyInQueue: boolean;
        queueId: number;
        searchState: string;
        timeInQueue: number;
    }

    @Component
    export default class QueueManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        isInQueue = false;
        queueData: Queue = <Queue><any>{};

        mounted() {
            this.$root.observe("/lol-matchmaking/v1/search", async (status, data) => {
                if (status !== 200) {
                    this.isInQueue = false;
                    document.body.classList.remove("in-queue");
                    return;
                }

                this.isInQueue = true;
                document.body.classList.add("in-queue");
                this.queueData = <Queue> data;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-matchmaking/v1/search");
        }

        leaveQueue() {
            this.$root.request("/lol-matchmaking/v1/search", "DELETE");
        }

        formatSeconds(secs: number) {
            return (Math.floor(secs / 60)) + ":" + ("00" + (secs % 60).toFixed(0)).slice(-2);
        }
    }
</script>

<style lang="stylus" scoped>
    @keyframes queue-background
        0% { background-position: 100% 0; }
        50% { background-position: 0 100%; }
        100% { background-position: 100% 0; }

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