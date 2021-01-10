import styled from "styled-components/native";
import { ScrollView, Text, View } from "react-native";
import React from "react";
import champSelect, { ChampSelectMember } from "../../stores/champ-select-store";
import { observer } from "mobx-react";
import AnimatedFlameBackground from "../AnimatedFlameBackground";
import ChampionBackground from "../ChampionBackground";
import ABImage from "../assets/ABImage";
import { summonerSpellIconPath } from "../../utils/assets";

const MEMBER_HEIGHT = 64;

const FLAME_COLORS = {
    picking: ["#197e99", "#134b6d", "#197e99", "#1e465d"],
    banning: ["#c6403b", "#f9413f", "#ec3930", "#ee241d"]
};

const MemberSpells = ({ member }: { member: ChampSelectMember }) => (
    <SummonerSpells>
        <SummonerSpell path={summonerSpellIconPath(member.spell1Id)} />
        <SummonerSpell path={summonerSpellIconPath(member.spell2Id)} />
    </SummonerSpells>
);

const SummonerStatus = ({ member }: { member: ChampSelectMember }) => {
    const state = champSelect.members.getMemberSubtext(member);

    return (
        <SummonerStatusContainer>
            <SummonerName>{member.displayName}</SummonerName>

            {/* iOS will still make room for this element even if it is empty, so only show it if there's state. */}
            {state !== "" && <SummonerState>{champSelect.members.getMemberSubtext(member)}</SummonerState>}
        </SummonerStatusContainer>
    );
};

const Member = observer(({ member, first = false }: { member: ChampSelectMember; first?: boolean }) => {
    const showSpells = member.isFriendly && member.playerType !== "BOT"; // bots dont have spells
    const flameStyle = champSelect.members.getMemberFlameStyle(member);

    return (
        <MemberContainer first={first} resizeMode="cover">
            {/* Background image. */}
            <ChampionBackground {...(champSelect.members.getMemberBackground(member) as any)} />

            {/* Background style */}
            {flameStyle !== "" && (
                <AnimatedFlameBackground
                    size={MEMBER_HEIGHT}
                    style={{ opacity: 0.6 }}
                    colors={FLAME_COLORS[flameStyle]}
                    duration={5000}
                />
            )}

            {/* Summoner Spells. */}
            {showSpells && <MemberSpells member={member} />}

            {/* Summoner name + Status */}
            <SummonerStatus member={member} />
        </MemberContainer>
    );
});

const Team = ({ members, name }: { members: ChampSelectMember[]; name: string }) => (
    <TeamContainer>
        <TeamName>{name}</TeamName>
        {members.map((x, i) => (
            <Member member={x} key={x.cellId} first={i === 0} />
        ))}
    </TeamContainer>
);

export default function Members() {
    return (
        <Container alwaysBounceVertical={false}>
            <Team name="YOUR TEAM" members={champSelect.state!.myTeam} />
            <Team name="ENEMY TEAM" members={champSelect.state!.theirTeam} />
        </Container>
    );
}

const Container = styled(ScrollView)`
    flex: 1;
`;

const TeamContainer = styled(View)`
    margin-top: 10px;
    flex-direction: column;
`;

const TeamName = styled(Text)`
    padding: 10px;
    font-size: 16px;
    color: #f0e6d2;
    letter-spacing: 1.1px;
    font-family: "LoL Display Bold";
`;

const MemberContainer = styled<any>(View)`
    height: ${MEMBER_HEIGHT}px;
    flex-direction: row;
    align-items: center;
    overflow: hidden;
    border: 0 solid rgba(205, 190, 147, 0.4);
    border-bottom-width: 1px;
    border-top-width: ${(props: any) => (props.first ? 1 : 0)}px;
`;

const SummonerSpells = styled(View)`
    margin: 5px 0 5px 10px;
    flex-direction: column;
`;

const SummonerSpell = styled(ABImage)`
    width: ${(MEMBER_HEIGHT - 10) / 2}px;
    height: ${(MEMBER_HEIGHT - 10) / 2}px;
`;

const SummonerStatusContainer = styled(View)`
    margin-left: 10px;
    flex-direction: column;
`;

const SummonerName = styled(Text)`
    font-family: "LoL Body";
    font-size: 18px;
    color: white;
    text-shadow: 2px 2px 3px #111;
`;

const SummonerState = styled(Text)`
    font-family: "LoL Body";
    font-size: 13px;
    color: #fffaef;
    text-shadow: 2px 2px 3px #111;
`;
