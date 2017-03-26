<template>
    <div class="queue" :class="isInQueue ? '' : 'hidden'">
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
                    return;
                }

                this.isInQueue = true;
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
            return (Math.floor(secs / 60)) + ":" + ("00" + (secs % 60)).slice(-2);
        }
    }
</script>

<style lang="stylus" scoped>
    .queue
        transition 0.3s ease
        height 200px
        background-color orange
        font-size 70px

    .hidden
        height 0
</style>