import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import Root from "../root/root";
import { ddragon } from "../../constants";

@Component
export default class SummonerPicker extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    @Prop
    show: boolean;

    @Prop
    first: boolean;

    // Loaded from LCU assets, contains information about which spells are available in which queues.
    summonerSpellMetadata: { id: number, gameModes: string[] }[] = [];

    mounted() {
        // Load information about the summoner spells.
        this.$root.request("/lol-game-data/assets/v1/summoner-spells.json").then(x => {
            x.status === 200 && (this.summonerSpellMetadata = x.content);
        });
    }

    /**
     * @returns the summoner spells available in this queue
     */
    get availableSummoners() {
        const gm = this.$parent.gameflowState ? this.$parent.gameflowState.gameData.queue.gameMode : "CLASSIC";
        return this.summonerSpellMetadata.filter(x => {
            return x.gameModes.indexOf(gm) !== -1
        });
    }

    /**
     * Selects the specified summoner, optionally swapping the spells.
     */
    selectSummoner(id: number) {
        let first = this.state.localPlayer.spell1Id;
        let second = this.state.localPlayer.spell2Id;
        if (this.first && id === second) {
            second = first;
            first = id;
        } else if (id === first) {
            first = second;
            second = id;
        } else {
            if (this.first) first = id;
            else second = id;
        }

        this.$root.request("/lol-champ-select/v1/session/my-selection", "PATCH", JSON.stringify({ spell1Id: first, spell2Id: second }));
        this.$emit("close");
    }

    /**
     * @returns the url to the icon for the specified summoner icon id
     */
    getSummonerSpellImage(id: number): string {
        return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/spell/" + this.$parent.summonerSpellDetails[id].id + ".png";
    }
}