// Modal: Crear nuevo crédito
// Presentational-only. Parent controls visibility and state.

import React from "react";
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {{nombre:string,montoTotalUsd:string,inicialUsd:string,cuotasCantidad:string,montoCuotaUsd:string,planDias:number|string}} props.newCredit
 * @param {(updater:(prev:any)=>any)=>void} props.setNewCredit
 * @param {()=>void} props.onCancel
 * @param {()=>void} props.onCreate
 * @param {boolean} props.darkMode
 * @param {string} props.modalBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {string} props.inputBgClass
 * @param {string} props.inputBorderClass
 * @param {string} props.inputTextClass
 * @param {string} props.placeholderColor
 * @param {string} props.smallBtnBgClass
 * @param {string} props.accentBtnClass
 * @param {string} props.chipSelectedBgBorder
 * @param {string} props.chipUnselectedBgBorder
 * @param {string} props.chipSelectedText
 * @param {string} props.chipUnselectedText
 * @param {number[]} props.planDays
 */
export default function CreateCreditModal({
  visible,
  newCredit,
  setNewCredit,
  onCancel,
  onCreate,
  darkMode,
  modalBgClass,
  textPrimary,
  textMuted,
  inputBgClass,
  inputBorderClass,
  inputTextClass,
  placeholderColor,
  smallBtnBgClass,
  accentBtnClass,
  chipSelectedBgBorder,
  chipUnselectedBgBorder,
  chipSelectedText,
  chipUnselectedText,
  planDays = [7, 15, 21, 28],
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const borderColor = darkMode ? "#4B5563" : "#D1D5DB";
  const surfaceSubtle = darkMode ? "#1F2937" : "#F3F4F6";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBg = darkMode ? "#374151" : "#E5E7EB";
  const chipSelectedBg = darkMode ? "#4338CA" : "#2563EB";
  const chipSelectedBorder = darkMode ? "#6366F1" : "#2563EB";
  const chipInactiveBg = surfaceSubtle;
  const chipInactiveBorder = borderColor;
  const chipInactiveText = mutedColor;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/50" style={modalStyles.overlay}>
        <View
          className={`${modalBgClass} rounded-lg`}
          style={[modalStyles.card, darkMode ? modalStyles.cardDark : modalStyles.cardLight, modalStyles.cardShadow]}
        >
          <Text
            className={`text-lg font-bold mb-4 ${textPrimary}`}
            style={[modalStyles.titleText, { color: primaryColor }]}
          >
            Nuevo Crédito
          </Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={modalStyles.scrollContent}>
            <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Nombre</Text>
            <TextInput
              className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="Identificador"
              placeholderTextColor={placeholderColor}
              value={newCredit.nombre}
              onChangeText={(t) => setNewCredit((p) => ({ ...p, nombre: t }))}
              style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
            />

            <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Monto Total ($)</Text>
            <TextInput
              className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="0.00"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newCredit.montoTotalUsd}
              onChangeText={(t) => setNewCredit((p) => ({ ...p, montoTotalUsd: t }))}
              style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
            />

            <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Inicial ($)</Text>
            <TextInput
              className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="0.00"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newCredit.inicialUsd}
              onChangeText={(t) => setNewCredit((p) => ({ ...p, inicialUsd: t }))}
              style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
            />

            <View className="flex-row -mx-1" style={modalStyles.row}>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Cantidad de cuotas</Text>
                <TextInput
                  className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={newCredit.cuotasCantidad}
                  onChangeText={(t) => setNewCredit((p) => ({ ...p, cuotasCantidad: t }))}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
              <View className="w-1/2 px-1" style={modalStyles.column}>
                <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Monto por cuota ($)</Text>
                <TextInput
                  className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="0.00"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={newCredit.montoCuotaUsd}
                  onChangeText={(t) => setNewCredit((p) => ({ ...p, montoCuotaUsd: t }))}
                  style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
                />
              </View>
            </View>

            <Text className={`${textMuted} mb-1`} style={[modalStyles.sectionLabel, { color: mutedColor }]}>Plan de pago (días)</Text>
            <View className="flex-row -mx-1 mb-2" style={modalStyles.planWrap}>
              {planDays.map((d) => (
                <View key={d} className="w-1/4 px-1" style={modalStyles.planItem}>
                  <TouchableOpacity
                    className={`p-2 rounded border items-center ${
                      Number(newCredit.planDias) === d ? chipSelectedBgBorder : chipUnselectedBgBorder
                    }`}
                    style={[
                      modalStyles.planChip,
                      {
                        backgroundColor:
                          Number(newCredit.planDias) === d ? chipSelectedBg : chipInactiveBg,
                        borderColor:
                          Number(newCredit.planDias) === d ? chipSelectedBorder : chipInactiveBorder,
                      },
                    ]}
                    onPress={() => setNewCredit((p) => ({ ...p, planDias: d }))}
                  >
                    <Text
                      className={
                        Number(newCredit.planDias) === d ? chipSelectedText : chipUnselectedText
                      }
                      style={{
                        color: Number(newCredit.planDias) === d ? "#FFFFFF" : chipInactiveText,
                        fontWeight: "600",
                      }}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
          <View className="flex-row justify-between mt-3" style={modalStyles.footerRow}>
            <TouchableOpacity
              className={`${smallBtnBgClass} px-4 py-2 rounded`}
              onPress={onCancel}
              style={[modalStyles.secondaryButtonInline, { backgroundColor: secondaryBg }]}
            >
              <View className="flex-row items-center" style={modalStyles.footerContent}>
                <Ionicons name="close" size={16} color={darkMode ? "#fff" : "#111827"} />
                <Text className={textPrimary} style={{ marginLeft: 6, color: primaryColor, fontWeight: "600" }}>
                  Cancelar
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`${accentBtnClass} px-4 py-2 rounded`}
              onPress={onCreate}
              style={[modalStyles.primaryButtonInline, { backgroundColor: accentColor }]}
            >
              <View className="flex-row items-center" style={modalStyles.footerContent}>
                <Ionicons name="save" size={18} color="#fff" />
                <Text className="text-white" style={{ marginLeft: 6, fontWeight: "700" }}>
                  Crear crédito
                </Text>
              </View>
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
    width: "88%",
    maxWidth: 480,
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
  planWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 8,
  },
  planItem: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  planChip: {
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  secondaryButtonInline: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryButtonInline: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
