import Constants from "expo-constants";

const hasiPhoneNotch =
    Constants.platform!.ios &&
    ["iPhone X", "iPhone Xs", "iPhone Xs Max", "iPhone Xr"].includes(Constants.platform!.ios.model);
const notchHeight = Constants.statusBarHeight + (hasiPhoneNotch ? 0 : 0);

export default notchHeight;
export const bottomMargin = hasiPhoneNotch ? 28 : 0;
