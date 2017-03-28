<template>
    <div class="champ-select" :class="isInQueue">
        <i>Champ Select</i>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface ChampSelectState {

    }

    @Component
    export default class QueueManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        isInChampSelect = false;
        queueData: ChampSelectState = <ChampSelectState><any>{};

        mounted() {
            this.$root.observe("/lol-champ-select/v1/session", async (status, data) => {
                if (status !== 200) {
                    this.isInChampSelect = false;
                    return;
                }

                this.isInChampSelect = true;
                this.queueData = <ChampSelectState> data;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-champ-select/v1/session");
        }
    }
</script>

<style lang="stylus" scoped>
    
</style>