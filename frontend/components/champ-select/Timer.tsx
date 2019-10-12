import styled from "styled-components/native";
import { Image, Text, View } from "react-native";
import champSelect from "../../stores/champ-select-store";
import notchHeight from "../../utils/notch";
import React from "react";
import { observer } from "mobx-react";
import { autorun, observable } from "mobx";
import { getChampionIcon } from "../../utils/constants";

// Stateful class component to handle the timer counting down.
@observer
class Time extends React.Component {
    @observable
    timeLeft = -1;

    private timer: any = -1;
    private unregister!: Function;

    componentDidMount(): void {
        this.unregister = autorun(() => {
            if (!champSelect.state) return;

            // Cancel the old timer, always.
            if (this.timer !== -1) clearInterval(this.timer);

            // Start timing again if needed.
            if (!champSelect.state.timer.isInfinite) {
                this.timeLeft = champSelect.state.timer.adjustedTimeLeftInPhase;
                this.timer = setInterval(() => {
                    this.timeLeft -= 200;
                    if (this.timeLeft < 0) this.timeLeft = 0;
                }, 200);
            }
        });
    }

    componentWillUnmount() {
        this.unregister();
        if (this.timer !== -1) clearInterval(this.timer);
    }

    render() {
        return <TimeText>{Math.ceil(this.timeLeft / 1000)}</TimeText>;
    }
}

const Bans = ({ banIds }: { banIds: number[] }) => {
    return <BanContainer>
        {banIds.map((x, i) => {
            if (x === 0) return <NoBan style={{ marginRight: i === banIds.length - 1 ? 0 : 5 }} key={i}/>;

            return <Ban style={{ marginRight: i === banIds.length - 1 ? 0 : 5 }} source={{ uri: getChampionIcon(x) }}
                        key={i}/>
        })}
    </BanContainer>
};

export default function Timer() {
    return <Container>
        <State>{champSelect.timer.stateSubtitle}</State>

        <BansAndTimer>
            <Bans banIds={champSelect.timer.ourBans}/>
            <Time/>
            <Bans banIds={champSelect.timer.enemyBans}/>
        </BansAndTimer>
    </Container>;
}

const Container = styled(View)`
    margin-top: ${notchHeight > 0 ? notchHeight : 8}px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    border: 0px solid rgba(240, 230, 210, 0.1);
    border-bottom-width: 1px;
`;

const State = styled(Text)`
    font-family: "LoL Body";
    font-size: 16px;
    color: white;
`;

const BansAndTimer = styled(View)`
    align-self: stretch;
    margin: 5px 10px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;

const TimeText = styled(Text)`
    font-size: 26px;
    color: #f0e6d2;
    letter-spacing: 1px;
    font-family: "LoL Display Bold";
`;

const BanContainer = styled(View)`
    flex-direction: row;
    align-items: center;
`;

const NoBan = styled(View)`
    width: 22px;
    height: 22px;
    background-color: black;
`;

const Ban = styled(Image)`
    width: 22px;
    height: 22px;
`;