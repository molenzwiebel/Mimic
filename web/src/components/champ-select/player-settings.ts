import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import { ddragon } from "../../constants";
import Root from "../root/root";

interface RunePage {
    current: boolean;
    id: number;
    name: string;
    isEditable: boolean;
    isDeletable: boolean;
    order: number;
}

@Component
export default class PlayerSettings extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    state: ChampSelectState;

    runePages: RunePage[] = [];

    async mounted() {
        // Observe runes
        this.$root.observe("/lol-perks/v1/pages", response => {
            response.status === 200 && (this.runePages = response.content);
            response.status === 200 && (this.runePages.sort((a, b) => a.order - b.order));
        });
    }

    destroyed() {
        // Stop observing the runes and masteries.
        this.$root.unobserve("/lol-perks/v1/pages");
    }

    /**
     * Selects the specified rune page, by setting its `current` property to true and calling the collections backend.
     */
    selectRunePage(event: Event) {
        const id = +(event.target as HTMLSelectElement).value;
        this.runePages.forEach(r => r.current = r.id === id);
        this.$root.request("/lol-perks/v1/currentpage", "PUT", "" + id);
    }

    /**
     * @returns the url to the icon for the specified summoner icon id
     */
    getSummonerSpellImage(id: number): string {
        return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/spell/" + this.$parent.summonerSpellDetails[id].id + ".png";
    }

    /**
     * Rerolls the current champion. Does nothing if we are not able to reroll.
     */
    reroll() {
        if (!this.canReroll) return;
        this.$root.request("/lol-champ-select/v1/session/my-selection/reroll", "POST");
    }

    /**
     * @returns if we are currently able to reroll (queue allows it)
     */
    get allowsReroll(): boolean {
        if (!this.$parent.gameflowState) return false;
        return this.$parent.gameflowState.gameData.queue.gameTypeConfig.reroll;
    }

    /**
     * @returns if we have enough points to reroll
     */
    get canReroll(): boolean {
        return this.allowsReroll && this.$parent.rerollState.numberOfRolls >= 1;
    }

    /**
     * @returns the current reroll state as '(<available>/<max>)'
     */
    get rerollState(): string {
        if (!this.allowsReroll) return "";
        return `(${this.$parent.rerollState.numberOfRolls}/${this.$parent.rerollState.maxRolls})`;
    }
}