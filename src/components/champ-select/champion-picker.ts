import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import Root from "../root/root";
import { DDRAGON_VERSION } from "../../constants";

@Component
export default class ChampionPicker extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    @Prop
    show: boolean;

    // List of champions that the current user can select. Includes banned champions.
    availableChampions: number[] = [];

    created() {
        // Observe the list of pickable and bannable champions. The list is sorted by name.
        this.$root.observe("/lol-champ-select/v1/pickable-champions", result => {
            this.availableChampions = result.status === 200 ? result.content.championIds : this.availableChampions;
            this.availableChampions.sort((a, b) => this.$parent.championDetails[a].name.localeCompare(this.$parent.championDetails[b].name));
        });
    }

    destroyed() {
        this.$root.unobserve("/lol-champ-select/v1/pickable-champions");
    }

    /**
     * @returns the list of champion ids currently "selectable"
     */
    get selectableChampions(): number[] {
        if (!this.state) return [];
        return this.availableChampions.filter(x => this.state.bans.myTeamBans.indexOf(x) === -1 && this.state.bans.theirTeamBans.indexOf(x) === -1);
    }

    /**
     * @returns the header shown at the top of the prompt
     */
    get header(): string {
        const act = this.$parent.getActions(this.state.localPlayer);
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
     * @returns the id of the champion currently selected
     */
    get selectedChampion(): number {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act) return 0;
        return act.championId;
    }

    /**
     * Selects the specified champion for the current action.
     */
    selectChampion(championId: number) {
        const act = this.$parent.getActions(this.state.localPlayer);
        if (!act) return; // TODO: Champ hovering.
        this.$root.request("/lol-champ-select/v1/session/actions/" + act.id, "PATCH", JSON.stringify({ championId }));
    }

    /**
     * Completes the current action and dismisses the picker.
     */
    completeAction() {
        const act = this.$parent.getActions(this.state.localPlayer)!;
        this.$root.request("/lol-champ-select/v1/session/actions/" + act.id + "/complete", "POST");
        //this.$emit("close");
    }

    /**
     * @returns the path to the icon of the specified champion
     */
    getChampionImage(id: number) {
        return "http://ddragon.leagueoflegends.com/cdn/" + DDRAGON_VERSION + "/img/champion/" + this.$parent.championDetails[id].id + ".png";
    }
}