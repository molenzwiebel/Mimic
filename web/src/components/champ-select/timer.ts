import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { default as ChampSelect, ChampSelectState, ChampSelectTimer, ChampSelectAction } from "./champ-select";
import { ddragon } from "../../constants";

@Component
export default class Timer extends Vue {
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    currentTime = 0;
    intervalId = -1;

    /**
     * Called whenever we are destroyed.
     * This happens when state becomes null, since then the entire
     * champion select component will not render anymore.
     */
    destroyed() {
        if (this.intervalId !== -1) clearInterval(this.intervalId);
    }

    /**
     * @returns the current state as shown on the top of the timer
     */
    get stateSubtitle(): string {
        if (!this.state) return "";

        if (this.state.timer.phase === "PLANNING") return "Declare your champion!";
        if (this.state.timer.phase === "FINALIZATION") return "Choose your loadout!";
        if (this.state.timer.phase === "GAME_STARTING") return "Game is starting!";

        const curTurn = this.$parent.currentTurn;
        if (!curTurn || curTurn.length === 0) return "";

        // Only talk about the ones still busy.
        const stillBusy = curTurn.filter(x => !x.completed);

        // Only a single person is picking.
        if (stillBusy.length === 1) {
            const member = this.$parent.getMember(stillBusy[0].actorCellId);
            return member.displayName + " is " + (stillBusy[0].type === "ban" ? "banning" : "picking");
        }

        // We generalize a bit here by assuming that all actions within a turn are of the same type.
        return stillBusy.length + " people are " + (stillBusy[0].type === "ban" ? "banning" : "picking");
    }

    /**
     * @returns the bans of our team, with uncompleted bans represented as an id of 0
     */
    get ourBans(): number[] {
        const allActions = (<ChampSelectAction[]>[]).concat(...this.state.actions);
        const ourTeamIDs = this.state.myTeam.map(x => x.cellId);
        const ourTeamBans = allActions.filter(x => x.type === "ban" && ourTeamIDs.indexOf(x.actorCellId) !== -1);
        return ourTeamBans.map(x => x.completed ? x.championId : 0);
    }

    /**
     * @returns the bans of the enemy team, with uncompleted bans represented as an id of 0
     */
    get enemyBans(): number[] {
        const allActions = (<ChampSelectAction[]>[]).concat(...this.state.actions);
        const theirTeamIDs = this.state.theirTeam.map(x => x.cellId);
        const theirTeamBans = allActions.filter(x => x.type === "ban" && theirTeamIDs.indexOf(x.actorCellId) !== -1);
        return theirTeamBans.map(x => x.completed ? x.championId : 0);
    }

    /**
     * @returns the path to the icon for the specified champion id
     */
    getChampionIcon(id: number) {
        return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/champion/" + this.$parent.championDetails[id].id + ".png";
    }

    @Watch("state.timer")
    private timerChanged(timer: ChampSelectTimer) {
        // Cancel the old timer, always.
        if (this.intervalId !== -1) clearInterval(this.intervalId);

        // Start timing again if needed.
        if (!timer.isInfinite) {
            this.currentTime = timer.adjustedTimeLeftInPhase;
            this.intervalId = setInterval(() => {
                this.currentTime -= 200;
                if (this.currentTime < 0) this.currentTime = 0;
            }, 200);
        }
    }
}