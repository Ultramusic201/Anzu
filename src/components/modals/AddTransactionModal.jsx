// Modal: Nueva Transacción
// Presentational-only. Parent controls visibility/state and actions.

import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {{tipo:'Gasto'|'Ingreso', descripcion:string, monto:string, moneda:'USD'|'VES', categoria?:string|null}} props.newTransaction
 * @param {(v:any)=>void|((prev:any)=>any)} props.setNewTransaction
 * @param {()=>void} props.onCancel
 * @param {()=>void} props.onSave
 * @param {string[]} props.CATEGORIES
 * @param {boolean} props.darkMode
 * @param {string} props.modalBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {string} props.inputBgClass
 * @param {string} props.inputBorderClass
 * @param {string} props.inputTextClass
 * @param {string} props.placeholderColor
 * @param {string} props.smallBtnBgClass
 * @param {string} props.minorBtnBgClass
 * @param {string} props.accentBtnClass
 * @param {string} props.chipSelectedBgBorder
 * @param {string} props.chipUnselectedBgBorder
 * @param {string} props.chipSelectedText
 * @param {string} props.chipUnselectedText
 */
export default function AddTransactionModal({
  visible,
  newTransaction,
  setNewTransaction,
  onCancel,
  onSave,
  CATEGORIES,
  darkMode = false,
  modalBgClass,
  textPrimary,
  textMuted,
  inputBgClass,
  inputBorderClass,
  inputTextClass,
  placeholderColor,
  smallBtnBgClass,
  minorBtnBgClass,
  accentBtnClass,
  chipSelectedBgBorder,
  chipUnselectedBgBorder,
  chipSelectedText,
  chipUnselectedText,
}) {
  const isExpense = newTransaction.tipo === "Gasto";
  const isIncome = newTransaction.tipo === "Ingreso";
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const borderColor = darkMode ? "#4B5563" : "#D1D5DB";
  const surfaceSubtle = darkMode ? "#1F2937" : "#F3F4F6";
  const inactiveToggleBg = darkMode ? "#374151" : "#E5E7EB";
  const inactiveToggleText = darkMode ? "#E5E7EB" : "#1F2937";
  const expenseColor = "#DC2626";
  const incomeColor = "#16A34A";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryButtonBg = darkMode ? "#374151" : "#E5E7EB";
  const currencyBg = darkMode ? "#334155" : "#E5E7EB";
  const chipSelectedBg = darkMode ? "#4338CA" : "#2563EB";
  const chipSelectedBorder = darkMode ? "#6366F1" : "#2563EB";
  const chipInactiveBorder = borderColor;
  const chipInactiveBg = surfaceSubtle;
  const chipInactiveText = mutedColor;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          className={`${modalBgClass} rounded-lg`}
          style={[styles.card, darkMode ? styles.cardDark : styles.cardLight, styles.cardShadow]}
        >
          <Text className={`text-lg font-bold mb-4 ${textPrimary}`} style={[styles.titleText, { color: primaryColor }]}>Nueva Transacción</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: isExpense ? expenseColor : inactiveToggleBg },
              ]}
              onPress={() =>
                setNewTransaction({
                  ...newTransaction,
                  tipo: "Gasto",
                  categoria: newTransaction.categoria ?? "COMIDA",
                })
              }
            >
              <Text
                className={newTransaction.tipo === "Gasto" ? "text-white" : "text-gray-700"}
                style={[styles.toggleLabel, { color: isExpense ? "#FFFFFF" : inactiveToggleText }]}
              >
                Gasto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: isIncome ? incomeColor : inactiveToggleBg },
              ]}
              onPress={() =>
                setNewTransaction({
                  ...newTransaction,
                  tipo: "Ingreso",
                  categoria: null,
                })
              }
            >
              <Text
                className={newTransaction.tipo === "Ingreso" ? "text-white" : "text-gray-700"}
                style={[styles.toggleLabel, { color: isIncome ? "#FFFFFF" : inactiveToggleText }]}
              >
                Ingreso
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
            placeholder="Descripción"
            placeholderTextColor={placeholderColor}
            value={newTransaction.descripcion}
            onChangeText={(text) => setNewTransaction({ ...newTransaction, descripcion: text })}
            style={[styles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
          />

          <View style={styles.amountRow}>
            <TextInput
              className={`border rounded-l p-2 flex-1 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="Monto"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newTransaction.monto}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, monto: text })}
              style={[styles.amountInput, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
            />
            <View
              className={`border-t border-b border-r rounded-r overflow-hidden ${inputBorderClass}`}
              style={[styles.currencyWrapper, { borderColor }]}
            >
              <TouchableOpacity
                className={`px-3 py-2 ${smallBtnBgClass}`}
                onPress={() =>
                  setNewTransaction({
                    ...newTransaction,
                    moneda: newTransaction.moneda === "USD" ? "VES" : "USD",
                  })
                }
                style={[styles.currencyButton, { backgroundColor: currencyBg }]}
              >
                <Text className={textPrimary} style={{ color: primaryColor, fontWeight: "600" }}>
                  {newTransaction.moneda}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {newTransaction.tipo === "Gasto" && (
            <>
              <Text
                className={`font-medium mb-2 ${textPrimary}`}
                style={[styles.sectionLabel, { color: primaryColor }]}
              >
                Categoría
              </Text>
              <View className="flex-row flex-wrap -m-1 mb-3" style={styles.categoriesWrap}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`m-1 px-3 py-2 rounded border ${
                      newTransaction.categoria === cat ? chipSelectedBgBorder : chipUnselectedBgBorder
                    }`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          newTransaction.categoria === cat ? chipSelectedBg : chipInactiveBg,
                        borderColor:
                          newTransaction.categoria === cat ? chipSelectedBorder : chipInactiveBorder,
                      },
                    ]}
                    onPress={() => setNewTransaction({ ...newTransaction, categoria: cat })}
                  >
                    <Text
                      className={
                        newTransaction.categoria === cat ? chipSelectedText : chipUnselectedText
                      }
                      style={[
                        styles.chipLabel,
                        {
                          color:
                            newTransaction.categoria === cat ? "#FFFFFF" : chipInactiveText,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View className="flex-row justify-between mt-4" style={styles.footerRow}>
            <TouchableOpacity
              className={`${minorBtnBgClass} px-4 py-2 rounded`}
              onPress={onCancel}
              style={[styles.secondaryButton, { backgroundColor: secondaryButtonBg }]}
            >
              <Text style={[styles.secondaryButtonText, { color: darkMode ? "#F9FAFB" : "#111827" }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`${accentBtnClass} px-4 py-2 rounded`}
              onPress={onSave}
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
            >
              <Text className="text-white" style={styles.primaryButtonText}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: "86%",
    maxWidth: 460,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  cardShadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardLight: {
    backgroundColor: "#ffffff",
  },
  cardDark: {
    backgroundColor: "#111827",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleLabel: {
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  currencyWrapper: {
    borderWidth: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  currencyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: 8,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 12,
  },
  chip: {
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontWeight: "600",
    fontSize: 13,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#FFFFFF",
  },
});
