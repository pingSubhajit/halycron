import {StyleSheet, Text, View} from "react-native";
import {StatusBar} from "expo-status-bar";

export default function Native() {
  return (
    <View className="flex-1 bg-neutral-950 items-center justify-center">
      <Text className="text-red-500 text-xl">Native</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontWeight: "bold",
    marginBottom: 20,
    fontSize: 36,
  },
});
