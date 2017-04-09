import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import { DDRAGON_VERSION } from "../../constants";
import Root from "../root/root";

@Component
export default class PlayerSettings extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    // We assume that the summonerId of the user does not change while in champ select.
    summonerId: number = -1;

    masteryPages: { current: boolean, name: string, id: number }[] = [];
    runePages: { current: boolean, name: string, id: number }[] = [];

    async mounted() {
        const summonerData = await this.$root.request("/lol-login/v1/session");
        this.summonerId = summonerData.content.summonerId;

        // Observe runes and masteries.
        this.$root.observe("/lol-collections/v1/inventories/" + this.summonerId + "/mastery-book", response => {
            response.status === 200 && (this.masteryPages = response.content.pages);
        });

        this.$root.observe("/lol-collections/v1/inventories/" + this.summonerId + "/rune-book", response => {
            response.status === 200 && (this.runePages = response.content.pages);
        });
    }

    destroyed() {
        // Stop observing the runes and masteries.
        this.$root.unobserve("/lol-collections/v1/inventories/" + this.summonerId + "/mastery-book");
        this.$root.unobserve("/lol-collections/v1/inventories/" + this.summonerId + "/rune-book");
    }

    /**
     * Selects the specified rune page, by setting its `current` property to true and calling the collections backend.
     */
    selectRunePage(event: Event) {
        const id = +(event.target as HTMLSelectElement).value;
        this.runePages.forEach(r => r.current = r.id === id);
        this.$root.request("/lol-collections/v1/inventories/" + this.summonerId + "/rune-book", "PUT", JSON.stringify({ pages: this.runePages }));
    }

    /**
     * Selects the specified mastery page, by setting its `current` property to true and calling the collections backend.
     */
    selectMasteryPage(event: Event) {
        const id = +(event.target as HTMLSelectElement).value;
        this.masteryPages.forEach(r => r.current = r.id === id);
        this.$root.request("/lol-collections/v1/inventories/" + this.summonerId + "/mastery-book", "PUT", JSON.stringify({ pages: this.masteryPages }));
    }

    /**
     * @returns the url to the icon for the specified summoner icon id
     */
    getSummonerSpellImage(id: number): string {
        return "http://ddragon.leagueoflegends.com/cdn/" + DDRAGON_VERSION + "/img/spell/" + this.$parent.summonerSpellDetails[id].id + ".png";
    }
}