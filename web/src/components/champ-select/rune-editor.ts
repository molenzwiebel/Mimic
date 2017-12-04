import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { default as ChampSelect } from "./champ-select";
import Root from "../root/root";
import { ddragon } from "../../constants";

interface RuneSlot {
    runes: {
        id: number;
    }[];
}

interface RuneTree {
    id: number;
    slots: RuneSlot[];
}

@Component({})
export default class RuneEditor extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    show: boolean;

    runes: RuneTree[] = [];
    selected: number[] = [0, -1, -1, -1, -1, 1, -1, -1, -1];

    async created() {
        this.runes = await this.loadStatic("runesReforged.json");
        console.dir(this.runes);
    }

    addPage() {
        // TODO
    }

    removePage() {
        // TODO
    }

    // TODO
    private loadStatic(filename: string): Promise<any> {
        return new Promise(resolve => {
            const req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.status !== 200 || !req.responseText || req.readyState !== 4) return;
                const map = JSON.parse(req.responseText);
                resolve(map);
            };
            req.open("GET", "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/data/en_US/" + filename, true);
            req.send();
        });
    }
}