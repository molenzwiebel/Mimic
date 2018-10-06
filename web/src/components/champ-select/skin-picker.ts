import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ChampSelectState, default as ChampSelect } from "./champ-select";
import Root from "../root/root";

@Component
export default class SkinPicker extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    state: ChampSelectState;

    @Prop()
    show: boolean;

    //Shorthand for the inventory url
    inventory: string;

    mounted() {
        // Gets the owned skin list, not using pickable-skins since it's not compatible with custom games
        this.inventory = "/lol-champions/v1/inventories/" + this.$parent.summoner.summonerId + "/skins-minimal";
        this.$root.observe(this.inventory, result => {
            this.$parent.skinList = result.content.filter((s: any) => s.ownership.owned == true);
        });
    }

    /**
     * @returns the skins available for the selected champion
     */
    get availableSkins() {
        const member = this.state.localPlayer;
        const act = this.$parent.getActions(member);
        const champId = (act ? act.championId : 0) || member.championId || member.championPickIntent;
        if(!champId) return [];
        let list = this.$parent.skinList.filter(x => {
            return x.championId == champId && !x.disabled;
        });
        if(!list[0].name.startsWith("Base")) list[0].name = "Base " + list[0].name;
        return list;
    }

    /**
     * Selects the specified summoner, optionally swapping the spells.
     */
    selectSkin(id: number) {
        this.$root.request("/lol-champ-select/v1/session/my-selection", "PATCH", JSON.stringify({ selectedSkinId: id}));
        this.$emit("close");
    }

    /**
     * @returns the url to the splashart for the specified skin id
     */
    getSkinImage(skinId: number): string {
        const champ = this.$parent.championDetails[this.state.localPlayer.championId];
        if(!champ) return "background-color: transparent;";
        return "background-image: url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + champ.id + "_" + skinId % 1000 + ".jpg);";
    }
}