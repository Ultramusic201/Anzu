// Modal: Tasa de Cambio del Día
// Presentational-only. Parent controls visibility and state.

import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string} props.tasaDolar
 * @param {(t:string)=>void} props.setTasaDolar
 * @param {()=>void} props.onSave
 * @param {string} props.modalBgClass
 * @param {string} props.inputBgClass
 * @param {string} props.inputBorderClass
 * @param {string} props.inputTextClass
 * @param {string} props.placeholderColor
 * @param {string} props.accentBtnClass
 * @param {string} props.textPrimary
 * @param {boolean} props.darkMode
 * @param {boolean} props.fetchingAuto
 * @param {()=>void} props.onFetchAuto
 * @param {string|null} props.fetchError
 */
export default function TasaDelDiaModal({
  visible,
  tasaDolar,
  setTasaDolar,
  onSave,
  modalBgClass,
  inputBgClass,
  inputBorderClass,
  inputTextClass,
  placeholderColor,
  accentBtnClass,
  textPrimary,
  darkMode = false,
  fetchingAuto = false,
  onFetchAuto,
  fetchError,
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const subtitleColor = darkMode ? "#D1D5DB" : "#4B5563";
  const borderColor = darkMode ? "#4B5563" : "#D1D5DB";
  const surfaceSubtle = darkMode ? "#1F2937" : "#F3F4F6";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBtnBg = darkMode ? "#312E81" : "#E0E7FF";
  const secondaryBtnBorder = darkMode ? "#6366F1" : "#4338CA";
  const secondaryText = darkMode ? "#E0E7FF" : "#1E3A8A";
  const errorColor = "#F87171";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/50" style={modalStyles.overlay}>
        <View
          className={`${modalBgClass} rounded-lg w-4/5`}
          style={[modalStyles.card, darkMode ? modalStyles.cardDark : modalStyles.cardLight, modalStyles.cardShadow]}
        >
          <Text
            className={`text-lg font-bold mb-4 ${textPrimary}`}
            style={[modalStyles.titleText, { color: primaryColor }]}
          >
            Tasa de Cambio del Día
          </Text>
          <Text
            className={`mb-2 ${textPrimary}`}
            style={[modalStyles.subtitleText, { color: subtitleColor }]}
          >
            Ingrese la tasa Bs. por $1 USD:
          </Text>
          {onFetchAuto && (
            <TouchableOpacity
              className="mb-4 rounded-lg items-center justify-center"
              onPress={onFetchAuto}
              disabled={fetchingAuto}
              style={[
                modalStyles.secondaryButton,
                {
                  backgroundColor: secondaryBtnBg,
                  borderColor: secondaryBtnBorder,
                  opacity: fetchingAuto ? 0.7 : 1,
                  shadowColor: secondaryBtnBorder,
                  marginBottom: 18,
                },
              ]}
            >
              {fetchingAuto ? (
                <ActivityIndicator size="small" color={darkMode ? "#E5E7EB" : "#4338CA"} />
              ) : (
                <Text style={[modalStyles.secondaryButtonText, { color: secondaryText }]}>Usar tasa oficial</Text>
              )}
            </TouchableOpacity>
          )}
          {fetchError ? (
            <Text style={[modalStyles.errorText, { color: errorColor }]}>{fetchError}</Text>
          ) : null}
          <TextInput
            className={`border rounded p-2 mb-4 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
            placeholder="Ej: 36.50"
            placeholderTextColor={placeholderColor}
            keyboardType="numeric"
            value={tasaDolar}
            onChangeText={setTasaDolar}
            style={[modalStyles.input, { backgroundColor: surfaceSubtle, borderColor, color: primaryColor }]}
          />
          <TouchableOpacity
            className={`${accentBtnClass} p-3 rounded items-center`}
            onPress={onSave}
            style={[modalStyles.primaryButton, { backgroundColor: accentColor }]}
          >
            <Text className="text-white font-medium" style={modalStyles.primaryButtonText}>
              Guardar Tasa
            </Text>
          </TouchableOpacity>
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
    width: "86%",
    maxWidth: 420,
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
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
});
