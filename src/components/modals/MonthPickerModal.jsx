// Modal: Selector de Mes/Año
// Presentational-only. Parent controls state and passes handlers.

import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {number} props.tempYear
 * @param {(n:number)=>void} props.setTempYear
 * @param {number} props.tempMonthIndex
 * @param {(n:number)=>void} props.setTempMonthIndex
 * @param {string[]} props.MONTHS
 * @param {()=>void} props.onCancel
 * @param {()=>void} props.onApply
 * @param {string} props.modalBgClass
 * @param {string} props.accentBtnClass
 */
export default function MonthPickerModal({
  visible,
  tempYear,
  setTempYear,
  tempMonthIndex,
  setTempMonthIndex,
  MONTHS,
  onCancel,
  onApply,
  modalBgClass,
  accentBtnClass,
  darkMode = false,
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBg = darkMode ? "#374151" : "#E5E7EB";
  const monthActiveBg = darkMode ? "#4338CA" : "#DBEAFE";
  const monthActiveBorder = darkMode ? "#6366F1" : "#2563EB";
  const monthInactiveBg = darkMode ? "#1F2937" : "#F3F4F6";
  const monthInactiveBorder = darkMode ? "#4B5563" : "#D1D5DB";
  const monthInactiveText = mutedColor;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/50" style={modalStyles.overlay}>
        <View
          className={`${modalBgClass} rounded-lg w-11/12`}
          style={[modalStyles.card, darkMode ? modalStyles.cardDark : modalStyles.cardLight, modalStyles.cardShadow]}
        >
          <View className="flex-row justify-between items-center mb-4" style={modalStyles.yearRow}>
            <TouchableOpacity
              className="px-3 py-1 rounded bg-gray-100"
              onPress={() => setTempYear(tempYear - 1)}
              style={[modalStyles.yearButton, { backgroundColor: secondaryBg }]}
            >
              <Text style={[modalStyles.yearButtonText, { color: primaryColor }]}>{"<"}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={[modalStyles.yearLabel, { color: primaryColor }]}>
              {tempYear}
            </Text>
            <TouchableOpacity
              className="px-3 py-1 rounded bg-gray-100"
              onPress={() => setTempYear(tempYear + 1)}
              style={[modalStyles.yearButton, { backgroundColor: secondaryBg }]}
            >
              <Text style={[modalStyles.yearButtonText, { color: primaryColor }]}>{">"}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap -mx-1" style={modalStyles.monthGrid}>
            {MONTHS.map((m, idx) => (
              <TouchableOpacity
                key={m}
                className="w-1/3 p-1"
                onPress={() => setTempMonthIndex(idx)}
                style={modalStyles.monthItem}
              >
                <View
                  className={`rounded border p-3 items-center ${
                    tempMonthIndex === idx ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-300"
                  }`}
                  style={[
                    modalStyles.monthChip,
                    {
                      backgroundColor: tempMonthIndex === idx ? monthActiveBg : monthInactiveBg,
                      borderColor: tempMonthIndex === idx ? monthActiveBorder : monthInactiveBorder,
                    },
                  ]}
                >
                  <Text
                    className={tempMonthIndex === idx ? "text-blue-700" : "text-gray-700"}
                    style={{
                      color: tempMonthIndex === idx ? accentColor : monthInactiveText,
                      fontWeight: "600",
                    }}
                  >
                    {m}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row justify-between mt-4" style={modalStyles.footerRow}>
            <TouchableOpacity
              className="bg-gray-300 px-4 py-2 rounded"
              onPress={onCancel}
              style={[modalStyles.secondaryButton, { backgroundColor: secondaryBg }]}
            >
              <Text style={[modalStyles.secondaryButtonText, { color: primaryColor }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`${accentBtnClass} px-4 py-2 rounded`}
              onPress={onApply}
              style={[modalStyles.primaryButton, { backgroundColor: accentColor }]}
            >
              <Text className="text-white" style={modalStyles.primaryButtonText}>
                Aplicar
              </Text>
            </TouchableOpacity>
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
    width: "92%",
    maxWidth: 500,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 24,
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
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  yearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  yearButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  yearLabel: {
    fontSize: 20,
    fontWeight: "700",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  monthItem: {
    padding: 4,
  },
  monthChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
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
