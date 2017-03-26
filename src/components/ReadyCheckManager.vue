<template>
    <div class="ready-check" v-show="hasReadyCheck">
        Ready Check
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface ReadyCheck {
        timer: number;
        state: string;
    }

    @Component
    export default class ReadyCheckManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        hasReadyCheck = false;
        queueData: ReadyCheck = <ReadyCheck><any>{};

        mounted() {
            this.$root.observe("/lol-matchmaking/v1/ready-check", async (status, data) => {
                if (status !== 200) {
                    this.hasReadyCheck = false;
                    return;
                }

                this.hasReadyCheck = true;
                this.queueData = <ReadyCheck>data;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-matchmaking/v1/ready-check");
        }

        accept() {
            this.$root.request("/lol-matchmaking/v1/ready-check/accept", "POST");
        }

        decline() {
            this.$root.request("/lol-matchmaking/v1/ready-check/decline", "POST");
        }
    }
</script>

<style lang="stylus" scoped>

</style>