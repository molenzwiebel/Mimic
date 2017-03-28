<template>
    <div class="champ-select" :class="isInQueue">
        <i>Champ Select</i>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface ChampSelectMember {
        assignedPosition: "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | ""; // empty for enemy or blind pick.
        cellId: number;
        championId: number;
        championPickIntent: number;
        displayName: string;
    }

    interface ChampSelectState {
        actions: {
            actorCellId: number; // player that does this action.
            championId: number; // champion that was the result of this action (banned/picked champ). if completed = false, this is what the user is hovering.
            completed: boolean; // if this step is finished.
            id: number;
            type: "ban" | "pick"; // unsure if there are more types
        }[][];

        bans: {
            numBans: number;
            myTeamBans: number[];
            theirTeamBans: number[];
        };

        localPlayerCellId: number;

        myTeam: ChampSelectMember[];
        theirTeam: ChampSelectMember[];

        timer: {
            phase: "PLANNING" | "BAN_PICK" | "FINALIZATION" | "GAME_STARTING"; // unsure if there are more types
            isInfinite: boolean; // here for testing, true in battle training champ select
            timeLeftInPhaseInSec: number;
        };

        trades: {
            // TODO: Figure out how this works.
            cellId: number;
            id: number;
            state: string;
        }[];
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
    .champ-select
        z-index 10000
        position absolute
        top 0
        bottom 0
        left 0
        right 0
        background-color black
        display flex
</style>