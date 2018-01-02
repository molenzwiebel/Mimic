import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import { ddragon } from "../../constants";
import Root from "../root/root";

@Component({})
export default class PlayerSettings extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    state: ChampSelectState;

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