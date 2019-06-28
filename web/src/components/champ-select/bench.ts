import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import Root from "../root/root";

@Component
export default class Bench extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    state: ChampSelectState;

    @Prop()
    show: boolean;

    /**
     * Swaps the currently selected champion with the specified champion,
     * closing the drawer.
     */
    swapWithChampion(id: number) {
        this.$root.request("/lol-champ-select/v1/session/bench/swap/" + id, "POST");
        this.$emit("close");
    }

    /**
     * @returns the background image for the specified champion
     */
    getChampionBackground(id: number) {
        const champ = this.$parent.championDetails[id];
        if (!champ) return "background-color: transparent;";

        return "background-image: url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + champ.id + "_0.jpg);";
    }

    /**
     * @returns the name of the champion with the specified id
     */
    getChampionName(id: number) {
        const champ = this.$parent.championDetails[id];
        return champ ? champ.name : "Unknown";
    }
}