import { computed, observable } from "mobx";
import socket from "../utils/socket";
import { getRuneTree, getRuneTrees, getSecondaryRuneTree } from "../utils/constants";

export interface RunePage {
    id: number;
    name: string;
    isEditable: boolean;
    isActive: boolean;
    order: number;
    primaryStyleId: number; // -1 if not selected
    subStyleId: number; // -1 if not selected
    selectedPerkIds: number[]; // 0 or not included if not selected
}

export class RunesStore {
    @observable
    runePages: RunePage[] = [];

    @observable
    currentRunePage: RunePage | null = null;

    @observable
    secondaryIndex = 0; // used for determining which secondary rune to deselect

    constructor() {
        socket.observe("/lol-perks/v1/pages", response => {
            if (response.status === 200) {
                this.runePages = response.content.sort((a: RunePage, b: RunePage) => a.order - b.order);
            }
        });

        socket.observe("/lol-perks/v1/currentpage", response => {
            this.currentRunePage = response.status === 200 ? response.content : null;

            // Update the isActive param if needed.
            if (this.currentRunePage) {
                this.runePages.forEach(x => x.isActive = x.id === this.currentRunePage!.id);
            }
        });
    }

    public selectPage(id: number | string) {
        this.runePages.forEach(r => r.isActive = r.id == id);
        socket.request("/lol-perks/v1/currentpage", "PUT", "" + id);
    }

    /**
     * @returns the page currently selected, unless there are none or if the page isn't editable
     */
    @computed
    get currentPage(): RunePage | null {
        const page = this.currentRunePage;
        return page && page.isEditable ? page : null;
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
        this.currentPage.subStyleId = getSecondaryRuneTree(id).id;

        // Reset all runes except the stat shards.
        this.currentPage.selectedPerkIds = [0, 0, 0, 0, 0, 0, this.currentPage.selectedPerkIds[6], this.currentPage.selectedPerkIds[7], this.currentPage.selectedPerkIds[8]];

        this.secondaryIndex = 0;
        this.savePage();
    }

    /**
     * Selects the specified primary rune in the specified slot.
     */
    selectPrimaryRune(slotIndex: number, id: number) {
        if (!this.currentPage) return;

        this.currentPage.selectedPerkIds[slotIndex] = id;
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
        const slot = getRuneTree(this.currentPage.subStyleId).slots.find(x => x.runes.some(x => x.id === id))!;
        if (slot.runes.some(x => x.id === otherRune)) return;

        this.secondaryIndex = (this.secondaryIndex + 1) % 2;
        this.currentPage.selectedPerkIds[4 + this.secondaryIndex] = id;

        this.savePage();
    }

    /**
     * Selects the specified stat rune in the specified slot.
     */
    selectStatRune(slotIndex: number, id: number) {
        if (!this.currentPage) return;

        this.currentPage.selectedPerkIds[6 + slotIndex] = id;
        this.savePage();
    }

    /**
     * Creates a new rune page and makes it the current selected page.
     */
    async addPage() {
        const rsp: RunePage = (await socket.request("/lol-perks/v1/pages", "POST", JSON.stringify({
            name: "Rune Page " + (this.runePages.length + 1),
            primaryStyleId: getRuneTrees()[0].id,
            secondaryStyleId: getRuneTrees()[1].id,
            selectedPerkIds: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }))).content;

        this.runePages.push(rsp);
        this.runePages.forEach(x => x.isActive = x === rsp);
        socket.request("/lol-perks/v1/currentpage", "PUT", "" + rsp.id);
    }

    /**
     * Saves the current page, overwriting the LCU version. This does not check if
     * there were any changes made before saving, so only call this when you are sure
     * that new changes need to be committed.
     */
    savePage() {
        if (!this.currentPage) return;

        socket.request("/lol-perks/v1/pages/" + this.currentPage.id, "PUT", JSON.stringify(this.currentPage));
    }

    /**
     * Deletes the current page. The LCU will automatically select a different page for us.
     */
    removePage() {
        if (!this.currentPage) return;

        socket.request("/lol-perks/v1/pages/" + this.currentPage.id, "DELETE");
        this.runePages = this.runePages.filter(x => x.id != this.currentPage!.id);
    }
}

const instance = new RunesStore();
export default instance;