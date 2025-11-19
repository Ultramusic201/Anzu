// Modal: Buscar transacciones
// Presentational-only. Parent controls visibility/state and actions.

import React from "react";
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from "react-native";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string} props.searchDescription
 * @param {(t:string)=>void} props.setSearchDescription
 * @param {string} props.searchMinAmount
 * @param {(t:string)=>void} props.setSearchMinAmount
 * @param {string} props.searchMaxAmount
 * @param {(t:string)=>void} props.setSearchMaxAmount
 * @param {string} props.searchStartDate
 * @param {(t:string)=>void} props.setSearchStartDate
 * @param {string} props.searchEndDate
 * @param {(t:string)=>void} props.setSearchEndDate
 * @param {()=>void} props.onClean
 * @param {()=>void} props.onCancel
 * @param {()=>void} props.onApply
 * @param {string} props.modalBgClass
 * @param {string} props.inputBgClass
 * @param {string} props.inputBorderClass
 * @param {string} props.inputTextClass
 * @param {string} props.placeholderColor
 * @param {string} props.minorBtnBgClass
 * @param {string} props.smallBtnBgClass
 * @param {string} props.accentBtnClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 */
export default function SearchTransactionsModal({
  visible,
  searchDescription,
  setSearchDescription,
  searchMinAmount,
  setSearchMinAmount,
  searchMaxAmount,
  setSearchMaxAmount,
  searchStartDate,
  setSearchStartDate,
  searchEndDate,
  setSearchEndDate,
  onClean,
  onCancel,
  onApply,
  modalBgClass,
  inputBgClass,
  inputBorderClass,
  inputTextClass,
  placeholderColor,
  minorBtnBgClass,
  smallBtnBgClass,
  accentBtnClass,
  textPrimary,
  textMuted,
  darkMode = false,
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const borderColor = darkMode ? "#4B5563" : "#D1D5DB";
  const surfaceSubtle = darkMode ? "#1F2937" : "#F3F4F6";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBg = darkMode ? "#374151" : "#E5E7EB";
  const chipBg = darkMode ? "#334155" : "#E5E7EB";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black/60" style={modalStyles.overlay}>
        <View
          className={`${modalBgClass} w-11/12 max-w-xl rounded-lg p-6`}
          style={[modalStyles.card, darkMode ? modalStyles.cardDark : modalStyles.cardLight, modalStyles.cardShadow]}
        >
          <Text
            className={`text-lg font-bold mb-4 ${textPrimary}`}
            style={[modalStyles.titleText, { color: primaryColor }]}
          >
            Buscar transacciones
          </Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={modalStyles.scrollContent}>
            <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Descripción</Text>
            <TextInput
              className={`border rounded p-3 mb-4 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="Ej: mercado"
              placeholderTextColor={placeholderColor}
              value={searchDescription}
              onChangeText={setSearchDescription}
              style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
            />

            <View className="flex-row -mx-1" style={modalStyles.row}>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Monto mínimo (USD)</Text>
                <TextInput
                  className={`border rounded p-3 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="0.00"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={searchMinAmount}
                  onChangeText={setSearchMinAmount}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Monto máximo (USD)</Text>
                <TextInput
                  className={`border rounded p-3 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="0.00"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={searchMaxAmount}
                  onChangeText={setSearchMaxAmount}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
            </View>

            <View className="flex-row -mx-1" style={modalStyles.row}>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Fecha inicial</Text>
                <TextInput
                  className={`border rounded p-3 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={placeholderColor}
                  value={searchStartDate}
                  onChangeText={setSearchStartDate}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Fecha final</Text>
                <TextInput
                  className={`border rounded p-3 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={placeholderColor}
                  value={searchEndDate}
                  onChangeText={setSearchEndDate}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
            </View>
          </ScrollView>
          <View className="flex-row justify-between mt-4" style={modalStyles.footerRow}>
            <TouchableOpacity
              className={`${minorBtnBgClass} px-4 py-2 rounded`}
              onPress={onClean}
              style={[modalStyles.actionChip, { backgroundColor: chipBg }]}
            >
              <Text className={textPrimary} style={{ color: primaryColor, fontWeight: "600" }}>Limpiar</Text>
            </TouchableOpacity>
            <View className="flex-row" style={modalStyles.footerCluster}>
              <TouchableOpacity
                className={`${smallBtnBgClass} px-4 py-2 rounded mr-2`}
                onPress={onCancel}
                style={[modalStyles.secondaryButtonInline, { backgroundColor: secondaryBg }]}
              >
                <Text className={textPrimary} style={{ color: primaryColor, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-2 rounded`}
                onPress={onApply}
                style={[modalStyles.primaryButtonInline, { backgroundColor: accentColor }]}
              >
                <Text className="text-white" style={modalStyles.primaryButtonText}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
  },
  card: {
    width: "90%",
    maxWidth: 520,
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
  scrollContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  column: {
    paddingHorizontal: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  actionChip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  footerCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonInline: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryButtonInline: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
