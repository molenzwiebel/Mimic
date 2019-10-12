import { computed, observable, reaction } from "mobx";
import { ChampSelectAction, ChampSelectStore } from "../champ-select-store";
import socket from "../../utils/socket";
import { getChampion } from "../../utils/constants";

/**
 * Sub-store for champ select, responsible for handling selectable champions
 * and completing the actions.
 */
export default class PickingStore {
    // List of champions that the current user can select. Includes banned champions.
    @observable
    pickableChampions: number[] = [];

    // List of champions that the current user can ban. Includes already banned champions.
    @observable
    bannableChampions: number[] = [];

    // Locally cached selected champ so we can update the interface immediately.
    @observable
    locallySelectedChampion: number | null = null;

    constructor(private store: ChampSelectStore) {
        // Keep track of pickable/bannable champs.
        socket.observe("/lol-champ-select/v1/pickable-champions", result => {
            this.pickableChampions = (result.status === 200 ? result.content.championIds : this.pickableChampions)
                .filter((x: number) => !!getChampion(x))
                .sort((a: number, b: number) => getChampion(a).name.localeCompare(getChampion(b).name));
        });

        socket.observe("/lol-champ-select/v1/bannable-champions", result => {
            this.bannableChampions = (result.status === 200 ? result.content.championIds : this.bannableChampions)
                .filter((x: number) => !!getChampion(x))
                .sort((a: number, b: number) => getChampion(a).name.localeCompare(getChampion(b).name));
        });

        // Whenever the state changes, invalidate our local state since it may have changed.
        // Usually, this is fine since the store change is due to our pick changing.
        reaction(
            () => this.store.state,
            () => {
                this.locallySelectedChampion = null;
            }
        );
    }

    /**
     * Gets the first uncompleted pick action for the current player,
     * or undefined if there is no such action.
     */
    @computed
    get firstUncompletedPickAction(): ChampSelectAction | undefined {
        const allActions: ChampSelectAction[] = Array.prototype.concat(...this.store.state!.actions);
        return allActions.find(
            x => x.type === "pick" && x.actorCellId === this.store.state!.localPlayerCellId && !x.completed
        );
    }

    /**
     * @returns the list of champion ids currently "selectable"
     */
    getSelectableChampions(term: string): number[] {
        if (!this.store.state) return [];
        const isCurrentlyBanning =
            this.store.currentTurn &&
            this.store.currentTurn.filter(
                x => x.type === "ban" && x.actorCellId === this.store.state!.localPlayerCellId && !x.completed
            ).length > 0;

        const allActions = (<ChampSelectAction[]>[]).concat(...this.store.state.actions);
        const bannedChamps = allActions.filter(x => x.type === "ban" && x.completed).map(x => x.championId);
        const selectable = (isCurrentlyBanning ? this.bannableChampions : this.pickableChampions).filter(
            x => bannedChamps.indexOf(x) === -1
        );

        return selectable.filter(x =>
            getChampion(x)
                .name.toLowerCase()
                .includes(term.toLowerCase())
        );
    }

    /**
     * Swaps the currently selected champion with the specified champion, closing the drawer.
     */
    swapWithChampion(id: number) {
        socket.request("/lol-champ-select/v1/session/bench/swap/" + id, "POST");
        this.store.interface.toggleBench();
    }

    /**
     * Rerolls the current champion. Does nothing if we are not able to reroll.
     */
    reroll() {
        socket.request("/lol-champ-select/v1/session/my-selection/reroll", "POST");
    }

    /**
     * @returns the header shown at the top of the prompt
     */
    @computed
    get header(): string {
        const act = this.store.getActions(this.store.state!.localPlayer);
        if (!act && this.firstUncompletedPickAction) return "Declare Your Champion!";
        if (!act || act.type !== "ban") return "Pick a Champion";
        return "Ban a Champion";
    }

    /**
     * @returns the type of the finish button
     */
    @computed
    get buttonType(): "confirm" | "deny" {
        const act = this.store.getActions(this.store.state!.localPlayer);
        if (!act || act.type !== "ban") return "confirm";
        return "deny";
    }

    /**
     * @returns the text of the finish button
     */
    @computed
    get buttonText(): string {
        const act = this.store.getActions(this.store.state!.localPlayer);
        if (!act || act.type !== "ban") return "Pick!";
        return "Ban!";
    }

    /**
     * @returns if we can complete the current action (e.g. lock in or ban)
     */
    @computed
    get canCompleteAction(): boolean {
        const act = this.store.getActions(this.store.state!.localPlayer);
        return !!(act && !act.completed && this.selectedChampion);
    }

    /**
     * @returns the id of the champion currently selected or hovered
     */
    @computed
    get selectedChampion(): number {
        if (this.locallySelectedChampion !== null) return this.locallySelectedChampion;

        const act = this.store.getActions(this.store.state!.localPlayer);
        if (act) return act.championId;

        const firstUncompletedPick = this.firstUncompletedPickAction;
        if (firstUncompletedPick) return firstUncompletedPick.championId;

        return 0;
    }

    /**
     * Selects the specified champion for the current action.
     */
    selectChampion(championId: number) {
        // Select current action, or next pick action if there's none.
        const act = this.store.getActions(this.store.state!.localPlayer) || this.firstUncompletedPickAction;
        if (!act) return; // if they try to select after already having picked

        this.locallySelectedChampion = championId;
        socket.request("/lol-champ-select/v1/session/actions/" + act.id, "PATCH", JSON.stringify({ championId }));
    }

    /**
     * Completes the current action and dismisses the picker.
     */
    completeAction() {
        const act = this.store.getActions(this.store.state!.localPlayer)!;
        socket.request("/lol-champ-select/v1/session/actions/" + act.id + "/complete", "POST");
        this.store.interface.toggleChampionPicker();
    }
}
