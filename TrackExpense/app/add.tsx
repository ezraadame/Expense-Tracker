import { useExpenses } from "@/context/expenses";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#070B14",
  card: "#0D1526",
  cardBorder: "rgba(255,255,255,0.07)",
  blue: "#2563EB",
  blueBright: "#60A5FA",
  orange: "#FBBF24",
  text: "#F1F5F9",
  textSub: "#475569",
  inputBg: "#111827",
  inputBorder: "rgba(255,255,255,0.1)",
};

export default function AddTransaction() {
  const { addTransaction } = useExpenses();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const amountRef = useRef<TextInput>(null);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Enter a name", "What was this transaction for?");
      return;
    }
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Enter an amount", "Please enter a valid dollar amount.");
      return;
    }

    setSaving(true);
    await addTransaction(name.trim(), parsed);
    setSaving(false);
    router.back();
  }

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.content}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Add Transaction</Text>

          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Whole Foods, Shell, Netflix"
            placeholderTextColor={C.textSub}
            returnKeyType="next"
            autoCapitalize="words"
            autoFocus
            onSubmitEditing={() => amountRef.current?.focus()}
          />

          {/* Amount */}
          <Text style={s.label}>Amount</Text>
          <View style={s.amountRow}>
            <Text style={s.dollar}>$</Text>
            <TextInput
              ref={amountRef}
              style={s.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.15)"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>{saving ? "Saving…" : "Add"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: C.blueBright, fontWeight: "500" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 32,
  },

  label: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
    marginBottom: 24,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  dollar: { fontSize: 20, color: C.orange, fontWeight: "600", marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: C.orange,
    paddingVertical: 14,
    padding: 0,
  },

  saveBtn: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
