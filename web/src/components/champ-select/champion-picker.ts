import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectAction, ChampSelectState, default as ChampSelect } from "./champ-select";
import Root from "../root/root";
import { ddragon } from "../../constants";

@Component
export default class ChampionPicker extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    @Prop
    show: boolean;

    // List of champions that the current user can select. Includes banned champions.
    pickableChampions: number[] = [];

    // List of champions that the current user can ban. Includes already banned champions.
    bannableChampions: number[] = [];

    created() {
        // Observe the list of pickable and bannable champions. The list is sorted by name.
        this.$root.observe("/lol-champ-select/v1/pickable-champions", result => {
            this.pickableChampions = (result.status === 200 ? result.content.championIds : this.pickableChampions).filter((x: number) => !!this.$parent.championDetails[x]);
            this.pickableChampions.sort((a, b) => this.$parent.championDetails[a].name.localeCompare(this.$parent.championDetails[b].name));
        });

        this.$root.observe("/lol-champ-select/v1/bannable-champions", result => {
            this.bannableChampions = (result.status === 200 ? result.content.championIds : this.bannableChampions).filter((x: number) => !!this.$parent.championDetails[x]);
            this.bannableChampions.sort((a, b) => this.$parent.championDetails[a].name.localeCompare(this.$parent.championDetails[b].name));
        });
    }

    destroyed() {
        this.$root.unobserve("/lol-champ-select/v1/pickable-champions");
        this.$root.unobserve("/lol-champ-select/v1/bannable-champions");
    }

    /**
     * @returns the list of champion ids currently "selectable"
     */
    get selectableChampions(): number[] {
        if (!this.state) return [];
        const isCurrentlyBanning = this.$parent.currentTurn && this.$parent.currentTurn.filter(x => x.type === "ban" && x.actorCellId === this.state.localPlayerCellId && !x.completed).length > 0;

        const allActions = (<ChampSelectAction[]>[]).concat(...this.state.actions);
        const bannedChamps = allActions.filter(x => x.type === "ban" && x.completed).map(x => x.championId);
        return (isCurrentlyBanning ? this.bannableChampions : this.pickableChampions).filter(x => bannedChamps.indexOf(x) === -1);
    }

    /**
     * @returns the header shown at the top of the prompt
     */
    get header(): string {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act && this.firstUncompletedPickAction) return "Declare your Champion!";
        if (!act || act.type !== "ban") return "Pick a Champion";
        return "Ban a Champion";
    }

    /**
     * @returns the type of the finish button
     */
    get buttonType(): string {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act || act.type !== "ban") return "confirm";
        return "deny";
    }

    /**
     * @returns the text of the finish button
     */
    get buttonText(): string {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act || act.type !== "ban") return "Pick!";
        return "Ban!";
    }

    /**
     * @returns if we can complete the current action (e.g. lock in or ban)
     */
    get canCompleteAction(): boolean {
        const act = this.$parent.getActions(this.state.localPlayer);
        return !!(act && !act.completed && this.selectedChampion);
    }

    /**
     * @returns the id of the champion currently selected or hovered
     */
    get selectedChampion(): number {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (act) return act.championId;

        const firstUncompletedPick = this.firstUncompletedPickAction;
        if (firstUncompletedPick) return firstUncompletedPick.championId;

        return 0;
    }

    /**
     * Gets the first uncompleted pick action for the current player,
     * or undefined if there is no such action.
     */
    get firstUncompletedPickAction(): ChampSelectAction | undefined {
        const allActions: ChampSelectAction[] = Array.prototype.concat(...this.state.actions);
        return allActions.filter(x => x.type === "pick" && x.actorCellId === this.state.localPlayerCellId && !x.completed)[0];
    }

    /**
     * Selects the specified champion for the current action.
     */
    selectChampion(championId: number) {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act) return this.hoverChampion(championId);
        this.$root.request("/lol-champ-select/v1/session/actions/" + act.id, "PATCH", JSON.stringify({ championId }));
    }

    /**
     * Hovers the specified champion, by changing the champion of
     * the first uncompleted pick action for the current player.
     * Does nothing if there is no action to pick for.
     */
    hoverChampion(championId: number) {
        const firstUncompletedPick = this.firstUncompletedPickAction;
        if (!firstUncompletedPick) return;
        this.$root.request("/lol-champ-select/v1/session/actions/" + firstUncompletedPick.id, "PATCH", JSON.stringify({ championId }));
    }

    /**
     * Completes the current action and dismisses the picker.
     */
    completeAction() {
        const act = this.$parent.getActions(this.state.localPlayer)!;
        this.$root.request("/lol-champ-select/v1/session/actions/" + act.id + "/complete", "POST");
        this.$emit("close");
    }

    /**
     * @returns the path to the icon of the specified champion
     */
    getChampionImage(id: number) {
        return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/champion/" + this.$parent.championDetails[id].id + ".png";
    }
}