import { computed } from "mobx";
import { ChampSelectAction, ChampSelectStore } from "../champ-select-store";

/**
 * Sub-store for champ select, responsible for handling the timer component.
 */
export default class TimerStore {
    constructor(private store: ChampSelectStore) {
    }

    /**
     * @returns the current state as shown on the top of the timer
     */
    @computed
    get stateSubtitle(): string {
        if (!this.store.state) return "";

        if (this.store.state.timer.phase === "PLANNING") return "Declare your champion!";
        if (this.store.state.timer.phase === "FINALIZATION") return "Choose your loadout!";
        if (this.store.state.timer.phase === "GAME_STARTING") return "Game is starting!";

        const curTurn = this.store.currentTurn;
        if (!curTurn || curTurn.length === 0) return "";

        // Only talk about the ones still busy.
        const stillBusy = curTurn.filter(x => !x.completed);

        // Only a single person is picking.
        if (stillBusy.length === 1) {
            if (stillBusy[0].type === "ten_bans_reveal") return "Bans are revealed!";

            const member = this.store.getMember(stillBusy[0].actorCellId);
            return member.displayName + " is " + (stillBusy[0].type === "ban" ? "banning" : "picking");
        }

        // We generalize a bit here by assuming that all actions within a turn are of the same type.
        return stillBusy.length + " people are " + (stillBusy[0].type === "ban" ? "banning" : "picking");
    }

    /**
     * @returns all ban actions in this game, concatenated into a single list
     */
    @computed
    get allBans(): ChampSelectAction[] {
        return ([] as ChampSelectAction[]).concat(...this.store.state!.actions.map(x => x.filter(y => y.type === "ban")));
    }

    /**
     * @returns the bans of our team, with uncompleted bans represented as an id of 0
     */
    @computed
    get ourBans(): number[] {
        return this.allBans
            .filter(x => this.store.getMember(x.actorCellId).isFriendly)
            .map(x => x.completed ? x.championId : 0);
    }

    /**
     * @returns the bans of the enemy team, with uncompleted bans represented as an id of 0
     */
    @computed
    get enemyBans(): number[] {
        return this.allBans
            .filter(x => !this.store.getMember(x.actorCellId).isFriendly)
            .map(x => x.completed ? x.championId : 0);
    }
}