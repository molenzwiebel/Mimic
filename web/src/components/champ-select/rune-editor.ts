import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { default as ChampSelect, RunePage } from "./champ-select";
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
    secondaryIndex = 0;

    async created() {
        this.runes = await this.$parent.loadStatic("runesReforged.json");
    }

    /**
     * @returns the page currently selected, unless there are none
     */
    get currentPage() {
        const page = this.$parent.currentRunePage;
        return page && page.isEditable ? page : undefined;
    }

    /**
     * @returns the rune tree for the specified id
     */
    getRuneTree(id: number) {
        return this.runes.filter(x => x.id === id)[0];
    }

    /**
     * Sets the primary tree of the current rune page to the specified tree id.
     * This will clear any of the current selections the user has made so far.
     * This will select the first tree that is not the selected tree as the
     * secondary tree, which will be precision most of the time.
     */
    selectPrimaryTree(id: number) {
        if (!this.currentPage) return;
        this.currentPage.primaryStyleId = id;
        this.currentPage.subStyleId = this.runes.filter(x => x.id !== id)[0].id;
        this.currentPage.selectedPerkIds = [0, 0, 0, 0, 0, 0];
        this.secondaryIndex = 0;
        this.savePage();
    }

    /**
     * Selects the specified primary rune in the specified slot.
     */
    selectPrimaryRune(slotIndex: number, id: number) {
        if (!this.currentPage) return;

        this.currentPage.selectedPerkIds[slotIndex] = id;
        (<any>this).$forceUpdate();
        this.savePage();
    }

    /**
     * Selects the specified secondary tree. This will clear all of the
     * currently selected secondary runes and check that the same tree is
     * not selected twice.
     */
    selectSecondaryTree(id: number) {
        if (!this.currentPage) return;
        if (this.currentPage.primaryStyleId === id) return;

        this.currentPage.subStyleId = id;
        this.currentPage.selectedPerkIds[4] = 0;
        this.currentPage.selectedPerkIds[5] = 0;

        this.savePage();
    }

    /**
     * Selects the specified secondary rune. This alternates so that the least
     * recently chosen secondary rune is replaced by the current choice.
     */
    selectSecondaryRune(id: number) {
        if (!this.currentPage) return;

        // Make sure that we are not selecting two runes from the same slot.
        const otherRune = this.currentPage.selectedPerkIds[4 + this.secondaryIndex];
        const slot = this.getRuneTree(this.currentPage.subStyleId).slots.filter(x => x.runes.filter(x => x.id === id).length !== 0)[0];
        if (slot.runes.filter(x => x.id === otherRune).length) return;

        this.secondaryIndex = (this.secondaryIndex + 1) % 2;
        this.currentPage.selectedPerkIds[4 + this.secondaryIndex] = id;
        (<any>this).$forceUpdate();

        this.savePage();
    }

    /**
     * Creates a new rune page and makes it the current selected page.
     */
    async addPage() {
        const rsp: RunePage = (await this.$root.request("/lol-perks/v1/pages", "POST", JSON.stringify({
            name: "Rune Page " + (this.$parent.runePages.length + 1),
            primaryStyleId: this.runes[0].id,
            secondaryStyleId: this.runes[1].id,
            selectedPerkIds: [0, 0, 0, 0, 0, 0]
        }))).content;

        this.$parent.runePages.push(rsp);
        this.$parent.runePages.forEach(x => x.isActive = x === rsp);
        this.$root.request("/lol-perks/v1/currentpage", "PUT", "" + rsp.id);
    }

    /**
     * Saves the current page, overwriting the LCU version. This does not check if
     * there were any changes made before saving, so only call this when you are sure
     * that new changes need to be committed.
     */
    savePage() {
        if (!this.currentPage) return;

        this.$root.request("/lol-perks/v1/pages/" + this.currentPage.id, "PUT", JSON.stringify(this.currentPage));
    }

    /**
     * Deletes the current page. The LCU will automatically select a different page for us.
     */
    removePage() {
        if (!this.currentPage) return;

        this.$root.request("/lol-perks/v1/pages/" + this.currentPage.id, "DELETE");
        this.$parent.runePages = this.$parent.runePages.filter(x => x.id != this.currentPage!.id);
    }
}