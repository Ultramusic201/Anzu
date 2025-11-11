import { Platform } from "react-native";

const Root = Platform.OS === "web"
  ? require("../App.web").default
  : require("../App.native").default;

export default function Index() {
  return <Root />;
}
