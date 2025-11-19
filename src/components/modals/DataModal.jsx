// Modal: Gestión de datos (exportar/importar base de datos)
// Presentational-only. Parent controls visibility and callbacks.

import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {boolean} props.backupBusy
 * @param {string} props.backupMessage
 * @param {()=>void} props.exportDatabase
 * @param {()=>void} props.importDatabase
 * @param {()=>void} props.onClose
 * @param {boolean} props.darkMode
 * @param {string} props.modalBgClass
 * @param {string} props.accentBtnClass
 * @param {string} props.smallBtnBgClass
 * @param {string} props.minorBtnBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 */
export default function DataModal({
  visible,
  backupBusy,
  backupMessage,
  exportDatabase,
  importDatabase,
  onClose,
  darkMode = false,
  modalBgClass,
  accentBtnClass,
  smallBtnBgClass,
  minorBtnBgClass,
  textPrimary,
  textMuted,
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBg = darkMode ? "#374151" : "#E5E7EB";
  const subtleBg = darkMode ? "#1F2937" : "#F3F4F6";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black/50" style={modalStyles.overlay}>
        <View
          className={`${modalBgClass} w-11/12 max-w-md rounded-lg p-6`}
          style={[modalStyles.card, darkMode ? modalStyles.cardDark : modalStyles.cardLight, modalStyles.cardShadow]}
        >
          <Text
            className={`text-lg font-bold mb-4 ${textPrimary}`}
            style={[modalStyles.titleText, { color: primaryColor }]}
          >
            Gestión de datos
          </Text>
          <Text
            className={`${textMuted} mb-4`}
            style={[modalStyles.bodyText, { color: mutedColor }]}
          >
            Exporta un respaldo de tu base de datos actual o importa un archivo
            previamente guardado. Ideal para mover información entre dispositivos
            o conservar tus datos antes de reinstalar.
          </Text>
          {backupBusy ? (
            <View className="items-center py-4" style={modalStyles.busyContainer}>
              <ActivityIndicator size="large" color={darkMode ? "#fff" : "#111827"} />
              <Text
                className={`mt-3 ${textPrimary}`}
                style={{ color: primaryColor }}
              >
                {backupMessage || "Procesando..."}
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-3 rounded mb-3`}
                onPress={exportDatabase}
                style={[modalStyles.primaryButton, { backgroundColor: accentColor }]}
              >
                <View className="flex-row items-center justify-center" style={modalStyles.buttonContent}>
                  <Ionicons name="cloud-download" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2" style={modalStyles.primaryButtonText}>
                    Exportar base de datos
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className={`${smallBtnBgClass} px-4 py-3 rounded mb-4`}
                onPress={importDatabase}
                style={[modalStyles.secondaryButton, { backgroundColor: secondaryBg }]}
              >
                <View className="flex-row items-center justify-center" style={modalStyles.buttonContent}>
                  <Ionicons name="cloud-upload" size={20} color={darkMode ? "#fff" : "#111827"} />
                  <Text
                    className={textPrimary}
                    style={{ marginLeft: 8, fontWeight: "600", color: primaryColor }}
                  >
                    Importar desde archivo
                  </Text>
                </View>
              </TouchableOpacity>
              <Text className={`${textMuted} text-xs`} style={[modalStyles.helperText, { color: mutedColor }]}
              >
                El archivo debe ser un respaldo generado por esta aplicación.
              </Text>
            </>
          )}
          <TouchableOpacity
            className={`${minorBtnBgClass} px-4 py-2 rounded mt-4`}
            onPress={() => {
              if (!backupBusy) onClose();
            }}
            disabled={backupBusy}
            style={[modalStyles.dismissButton, { backgroundColor: subtleBg }]}
          >
            <Text className={darkMode ? "text-white" : "text-gray-800"} style={modalStyles.dismissButtonText}>
              Cerrar
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
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  cardShadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
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
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  busyContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    marginTop: -4,
  },
  dismissButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
