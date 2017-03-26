<template>
    <div class="ready-check" v-show="shouldShow">
        <transition enter-active-class="zoomIn" leave-active-class="zoomOut">
            <div class="ready-prompt" v-show="shouldShow">
                <div class="progress-bar">
                    <div class="progress" :style="progressCSS" :class="{ 'accepted': queueData.playerResponse === 'Accepted', 'declined': queueData.playerResponse === 'Declined' }"></div>
                </div>

                <div class="header">Match Found</div>

                <div class="accept-button" @click="accept()">
                    <div class="button-border"></div>
                    Accept!
                </div>

                <div class="decline-button" @click="decline()">
                    <div class="button-border"></div>
                    Decline
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    import AudioPath = require("../static/queue-pop.mp3");

    interface ReadyCheck {
        timer: number;
        state: string;
    }

    @Component
    export default class ReadyCheckManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        hasReadyCheck = false;
        audio = new Audio(AudioPath);
        queueData: ReadyCheck = <ReadyCheck><any>{};

        mounted() {
            // Safari on iOS requires user interaction before we can play sounds whenever we want.
            let soundPlayed = false;
            document.body.addEventListener("touchstart", () => {
                // Play the sound muted. We get permission and don't disturb the user.
                if (!soundPlayed) {
                    this.audio.muted = true;
                    this.audio.play();
                }
            });

            this.$root.observe("/lol-matchmaking/v1/ready-check", async (status, data) => {
                if (status !== 200) {
                    this.hasReadyCheck = false;
                    return;
                }

                // If the queue just popped, play the sound (and vibrate on android).
                if (this.hasReadyCheck && this.queueData.state === "Invalid" && data.state === "InProgress") {
                    this.audio.muted = false;
                    this.audio.play();

                    // Vibrate for half a second, then wait 1/4th of a second (on devices that support it).
                    navigator.vibrate = navigator.vibrate || (<any>navigator).webkitVibrate || (<any>navigator).mozVibrate || (<any>navigator).msVibrate;
                    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250]);
                }

                this.hasReadyCheck = true;
                this.queueData = <ReadyCheck>data;
            });
        }

        get shouldShow() {
            return this.hasReadyCheck && this.queueData.state === "InProgress";
        }

        get progressCSS() {
            return "width: " + ((12 - this.queueData.timer) * (100 / 12)) + "%;";
        }

        destroyed() {
            this.$root.unobserve("/lol-matchmaking/v1/ready-check");
        }

        accept() {
            this.$root.request("/lol-matchmaking/v1/ready-check/accept", "POST");
        }

        decline() {
            this.$root.request("/lol-matchmaking/v1/ready-check/decline", "POST");
        }
    }
</script>

<style lang="stylus" scoped>
    @keyframes progress-background
        0% { background-position: 100% 0; }
        50% { background-position: 0 100%; }
        100% { background-position: 100% 0; }

    .zoomIn, .zoomOut
        animation-duration 0.4s !important

    .ready-check
        z-index 1000
        position absolute
        top 0
        bottom 0
        left 0
        right 0
        background-color rgba(0, 0, 0, 0.8)
        display flex
        justify-content center
        align-items center

    .ready-prompt
        position relative
        height 450px
        width 85%
        border-style solid
        border-width 8px
        border-image linear-gradient(to top, #614a1f 0, #463714 5px, #463714 100%) 2 stretch
        background-color #010a13
        text-align center
        display flex
        flex-direction column
        align-items center

    .progress-bar
        box-sizing border-box
        height 68px
        width 100%
        border-style solid
        border-image linear-gradient(to top, #614a1f 0, #463714 5px, #463714 100%) 2 stretch
        border-width 0
        border-bottom-width 8px

    .progress
        height 100%
        transition 1s linear
        background linear-gradient(186deg, #197e99, #134b6d, #197e99, #1e465d)
        background-size 400% 400%
        animation queue-background 3s ease infinite

        &.accepted
            background linear-gradient(186deg, #349954, #a1e08f, #31bd2d, #47a96e)
            background-size 400% 400%

        &.declined
            background linear-gradient(186deg, #c6403b, #f9413f, #ec3930, #ee241d)
            background-size 400% 400%

    .header
        margin 20px
        font-family "LoL Body"
        -webkit-font-feature-settings "kern" 1
        -webkit-font-smoothing antialiased
        color #f0e6d2
        font-weight bold
        text-transform uppercase
        font-size 80px
        letter-spacing 0.05em

    .accept-button, .decline-button
        position relative
        display flex
        justify-content center
        align-items center
        text-transform uppercase
        font-family "LoL Display"
        background-color rgb(30, 35, 40)

    .button-border
        position absolute
        top -10px
        left -10px
        width 100%
        height 100%
        border-style solid

    .accept-button
        margin-top 30px
        width 92%
        height 120px
        font-size 80px
        color #a3c7c7

        .button-border
            border-width 10px
            border-image linear-gradient(to top, #0d404c 0%, #0596aa 44%, #0596aa 93%, #0ac8b9 100%) 1 stretch

    .decline-button
        position absolute
        bottom -50px
        left 50%
        transform translateX(-50%)
        width 70%
        height 80px
        color rgb(205, 190, 145)
        font-size 50px

        .button-border
            top -6px
            left -6px
            border-width 6px
            border-image linear-gradient(to top, #785b28 0%, #c89c3c 55%, #c8a355 71%, #c8aa6e 100%) 1 stretch
</style>