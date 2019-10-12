import { computed, observable } from "mobx";
import { ChampSelectStore } from "../champ-select-store";
import { getMapBackground } from "../../utils/constants";

/**
 * Sub-store for champ select, responsible for handling interface state.
 */
export default class InterfaceStore {
    // Information for the summoner spell overlay.
    @observable
    pickingSummonerSpell = false;

    @observable
    pickingFirstSummonerSpell = false;

    // Information for the champion picker.
    @observable
    pickingChampion = false;

    // Information for the rune editor.
    @observable
    showingRuneOverlay = true;

    // Information for becnh.
    @observable
    showingBench = false;

    constructor(private store: ChampSelectStore) {}

    /**
     * @returns the map background for the current queue
     */
    @computed
    get background() {
        if (!this.store.gameflowState) return require("../../assets/magic-background.jpg");
        return getMapBackground(this.store.gameflowState.map.id);
    }

    /**
     * Closes the champion picker.
     */
    public toggleChampionPicker() {
        this.pickingChampion = !this.pickingChampion;
    }

    /**
     * Shows or hides the rune editor.
     */
    public toggleRuneEditor() {
        this.showingRuneOverlay = !this.showingRuneOverlay;
    }

    /**
     * Shows or hides the bench.
     */
    public toggleBench() {
        this.showingBench = !this.showingBench;
    }

    /**
     * Shows or hides the summoner spell picker, additionally marking whether
     * or not the user is currently selecting the first spell.
     */
    public toggleSpellPicker(isFirstSpell: boolean) {
        this.pickingSummonerSpell = !this.pickingSummonerSpell;
        this.pickingFirstSummonerSpell = isFirstSpell;
    }
}
