import { ComputerConfig, deleteRegisteredComputer, getRegisteredComputers } from "../../utils/persistence";
import React, { useEffect, useState } from "react";
import socket from "../../utils/socket";
import styled from "styled-components/native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { bottomMargin } from "../../utils/notch";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ABImage from "../assets/ABImage";
import * as rift from "../../utils/rift";
import { profileIconPath } from "../../utils/assets";
import { useActionSheet } from "@expo/react-native-action-sheet";

function DeviceEntrySummonerIcon({ icon, isOnline }: { icon: number; isOnline: boolean }) {
    return (
        <SummonerIconContainer>
            <SummonerIcon path={profileIconPath(icon)} />
            {!isOnline && <SummonerIconOfflineOverlay />}
            <OnlineIndicator style={{ backgroundColor: isOnline ? "#09a646" : "#d6471a" }} />
        </SummonerIconContainer>
    );
}

function NewDeviceEntry({ code, data, onDelete }: { code: string; data: ComputerConfig; onDelete: () => void }) {
    const { showActionSheetWithOptions } = useActionSheet();
    const [isOnline, setOnline] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const handleCallback = (res: boolean) => {
            if (!isMounted) return;

            setOnline(res);
        };

        // poll state of machine every 2 minutes
        const interval = setInterval(() => {
            rift.isDeviceOnline(code).then(handleCallback);
        }, 2 * 60 * 1000);

        // and check immediately
        rift.isDeviceOnline(code).then(handleCallback);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const onMenuPress = () => {
        showActionSheetWithOptions(
            {
                options: ["Forget Device", "Cancel"],
                cancelButtonIndex: 1,
                destructiveButtonIndex: 0
            },
            idx => {
                if (idx === 1) return; // cancel

                onDelete();
            }
        );
    };

    return (
        <NewDeviceContainer onPress={() => socket.connect(code)}>
            <DeviceEntrySummonerIcon icon={data.lastAccount?.iconId ?? 29} isOnline={isOnline} />

            <DeviceEntryText>
                <ComputerName>{data.lastAccount?.summonerName ?? "Unknown Summoner"}</ComputerName>
                <ComputerCode>
                    {data.name} - {code}
                </ComputerCode>
            </DeviceEntryText>

            <DeviceOptions onPress={onMenuPress}>
                <MaterialCommunityIcons name="dots-horizontal" color="white" size={25} />
            </DeviceOptions>
        </NewDeviceContainer>
    );
}

function AddButton({ onPress }: { onPress: () => void }) {
    return (
        <AddDeviceContainer onPress={onPress}>
            <Ionicons name="ios-add" color="#f0e6d3" size={30} />

            <DeviceEntryText>
                <AddNewText>Connect to a new device</AddNewText>
            </DeviceEntryText>
        </AddDeviceContainer>
    );
}

export default function PreviousDevices({ onRegisterNew }: { onRegisterNew: () => any }) {
    const [devices, setDevices] = useState<{ [key: string]: ComputerConfig }>({});
    useEffect(() => {
        getRegisteredComputers().then(setDevices);
    }, []);

    const removeDevice = (code: string) => {
        const clone = JSON.parse(JSON.stringify(devices));
        delete clone[code];
        setDevices(clone);
        deleteRegisteredComputer(code);
    };

    return (
        <Container>
            <ScrollView style={{ flex: 1, width: "100%" }}>
                {Object.entries(devices).map(entry => (
                    <NewDeviceEntry
                        code={entry[0]}
                        key={entry[0]}
                        data={entry[1]}
                        onDelete={() => removeDevice(entry[0])}
                    />
                ))}

                <AddButton onPress={onRegisterNew} />
            </ScrollView>
        </Container>
    );
}

const Container = styled(View)`
    padding-bottom: ${bottomMargin}px;
    flex: 1;
    flex-direction: column;
    align-items: center;
    height: 100%;
    width: 100%;
`;

const ComputerName = styled(Text)`
    font-family: LoL Display Bold;
    font-size: 22px;
    color: #f0e6d3;
`;

const AddNewText = styled(Text)`
    font-family: LoL Body;
    font-size: 18px;
    color: #e2dbd0;
`;

const ComputerCode = styled(Text)`
    font-family: LoL Body;
    font-size: 16px;
    color: #aaaea0;
`;

const NewDeviceContainer = styled(TouchableOpacity)`
    padding: 12px 10px;
    margin: 10px 10px 0;
    border: 1px solid #5a4418;
    flex-direction: row;
    align-items: center;
`;

const AddDeviceContainer = styled(NewDeviceContainer as any)`
    border-color: #4e4130;
`;

const DeviceEntryText = styled(View)`
    margin-left: 10px;
    flex-direction: column;
    justify-content: center;
`;

const DeviceOptions = styled(TouchableOpacity)`
    position: absolute;
    top: 8px;
    right: 12px;
`;

const CONTAINER_SIZE = 70;
const ICON_SIZE = 60;
const ICON_BORDER_WIDTH = 3;
const INDICATOR_SIZE = 20;

const SummonerIconContainer = styled(View)`
    width: ${CONTAINER_SIZE}px;
    height: ${CONTAINER_SIZE}px;
    position: relative;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

const SummonerIconOfflineOverlay = styled(View)`
    width: ${ICON_SIZE - ICON_BORDER_WIDTH * 2}px;
    height: ${ICON_SIZE - ICON_BORDER_WIDTH * 2}px;
    border-radius: ${(ICON_SIZE - ICON_BORDER_WIDTH * 2) / 2}px;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
`;

const SummonerIcon = styled(ABImage)`
    width: ${ICON_SIZE}px;
    height: ${ICON_SIZE}px;
    border-radius: ${ICON_SIZE / 2}px;
    border: 3px solid #7c602e;
`;

const OnlineIndicator = styled(View)`
    width: ${INDICATOR_SIZE}px;
    height: ${INDICATOR_SIZE}px;
    border-radius: ${INDICATOR_SIZE / 2}px;
    border: 4px solid #111216;
    position: absolute;
    top: 2px;
    right: 2px;
`;
