import Vue from "vue";
import Root, { Result } from "../root/root";
import { Component } from "vue-property-decorator";

import AudioPath = require("../../static/queue-pop.mp3");

interface ReadyCheckState {
    timer: number;
    state: "Invalid" | "InProgress";
    playerResponse: "Accepted" | "Declined";
}

@Component
export default class ReadyCheck extends Vue {
    $root: Root;

    state: ReadyCheckState | null = null;
    audio = new Audio(AudioPath);

    mounted() {
        // Start observing the ready check.
        this.$root.observe("/lol-matchmaking/v1/ready-check", this.handleReadyCheckChange.bind(this));

        // Add a sneaky touch handler on document to make sure we can play a sound when queue pops.
        // iOS only allows you to play sounds "at random" once you've played at least once in response
        // to user interaction. You can play the sound muted and it will still count. Only caveat is that
        // if the user _never_ interacts with the screen until queue pop, the sound will not play. ¯\_(ツ)_/¯
        // Note: This does not seem to apply when the website was added to the home screen.
        let hasPermission = false;
        document.body.addEventListener("touchstart", () => {
            if (!hasPermission) {
                this.audio.muted = true;
                this.audio.play();
                hasPermission = true;
            }
        });
    }

    /**
     * Handles a change to the ready check state. Plays sounds(/vibrates) if needed.
     * Note: this cannot be an arrow function for various changes. See the lobby component for more info.
     */
    handleReadyCheckChange = async function(this: ReadyCheck, result: Result) {
        if (result.status !== 200) {
            this.state = null;
            return;
        }

        const newState: ReadyCheckState = result.content;

        // If the queue just popped, play the sound (and vibrate on android).
        if (this.state && this.state.state === "Invalid" && newState.state === "InProgress") {
            this.audio.muted = false;
            this.audio.play();

            // Vibrate for half a second, then wait 1/4th of a second (on devices that support it).
            navigator.vibrate = navigator.vibrate || (<any>navigator).webkitVibrate || (<any>navigator).mozVibrate || (<any>navigator).msVibrate;
            if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250]);
        }

        this.state = newState;
    };

    /**
     * @returns if the ready check popup should show
     */
    get shouldShow(): boolean {
        return !!(this.state && this.state.state === "InProgress");
    }

    /**
     * Computes the width of the countdown progress bar and returns it as a css property.
     */
    get progressWidth() {
        if (!this.state) return "width: 0%;";
        return "width: " + ((12 - this.state.timer) * (100 / 12)) + "%;";
    }

    /**
     * Accepts the ready check.
     */
    accept() {
        this.$root.request("/lol-matchmaking/v1/ready-check/accept", "POST");
    }

    /**
     * Declines the ready check.
     */
    decline() {
        this.$root.request("/lol-matchmaking/v1/ready-check/decline", "POST");
    }
}