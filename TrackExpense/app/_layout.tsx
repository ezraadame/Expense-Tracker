import { ExpensesProvider } from "@/context/expenses";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ExpensesProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ExpensesProvider>
    </SafeAreaProvider>
  );
}
