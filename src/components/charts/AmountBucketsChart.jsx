// Presentational component: Amount bucket distribution
// Renders list of bucket bars and a mode toggle (Gastos/Ingresos)

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

/**
 * @param {Object} props
 * @param {Array<{label:string,value:number}>} props.amountBucketData
 * @param {number|null} props.selectedBucketIndex
 * @param {(i:number|null)=>void} props.setSelectedBucketIndex
 * @param {number} props.bucketMaxValue
 * @param {"gastos"|"ingresos"} props.chartBucketMode
 * @param {(m:"gastos"|"ingresos")=>void} props.setChartBucketMode
 * @param {string} props.cardBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {string} props.barTrackClass
 * @param {string} props.borderMutedClass
 * @param {boolean} props.darkMode
 * @param {string} props.COLOR_GASTOS
 * @param {string} props.COLOR_INGRESOS
 */
export default function AmountBucketsChart({
  amountBucketData,
  selectedBucketIndex,
  setSelectedBucketIndex,
  bucketMaxValue,
  chartBucketMode,
  setChartBucketMode,
  cardBgClass,
  textPrimary,
  textMuted,
  barTrackClass,
  borderMutedClass,
  darkMode,
  COLOR_GASTOS,
  COLOR_INGRESOS,
}) {
  const cardBgColor = darkMode ? "#111827" : "#ffffff";
  const cardShadowColor = darkMode ? "#000000" : "#0f172a";
  const toggleActiveBg = darkMode ? "#4338CA" : "#2563EB";
  const toggleInactiveBorder = darkMode ? "#4B5563" : "#D1D5DB";
  const toggleInactiveText = darkMode ? "#E5E7EB" : "#1F2937";
  const trackBg = darkMode ? "#374151" : "#e5e7eb";
  const detailBg = darkMode ? "#1f2937" : "#f3f4f6";
  const labelPrimary = darkMode ? "#F9FAFB" : "#111827";
  const labelMuted = darkMode ? "#D1D5DB" : "#4B5563";

  return (
    <View
      className={`rounded-lg p-4 shadow-lg mb-4 ${cardBgClass}`}
      style={[
        styles.card,
        {
          backgroundColor: cardBgColor,
          shadowColor: cardShadowColor,
          width: "100%",
        },
      ]}
    >
      <Text
        className={`font-semibold text-base mb-3 ${textPrimary}`}
        style={[styles.titleText, { color: labelPrimary }]}
      >
        Distribución por tamaño de transacción
      </Text>
      {amountBucketData.every((bucket) => !bucket.value) ? (
        <Text className={textMuted} style={{ color: labelMuted }}>
          Sin movimientos en los rangos definidos.
        </Text>
      ) : (
        amountBucketData.map((bucket, index) => {
          const isSelected = selectedBucketIndex === index;
          const pct = bucketMaxValue ? Math.min(1, bucket.value / bucketMaxValue) : 0;
          return (
            <TouchableOpacity
              key={`bucket-${bucket.label}-${index}`}
              className="mb-3"
              onPress={() => setSelectedBucketIndex((prev) => (prev === index ? null : index))}
            >
              <View className="flex-row items-center mb-1" style={styles.row}>
                <Text
                  className={`${textPrimary} flex-1`}
                  style={{ color: labelPrimary }}
                >
                  {bucket.label}
                </Text>
                <Text className={`${textMuted} text-sm`} style={{ color: labelMuted }}>
                  {bucket.value} mov.
                </Text>
              </View>
              <View
                className={`h-3 rounded-full ${barTrackClass}`}
                style={[styles.track, { backgroundColor: trackBg }]}
              >
                <View
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: chartBucketMode === "gastos" ? COLOR_GASTOS : COLOR_INGRESOS,
                    height: "100%",
                    borderRadius: 9999,
                    opacity: isSelected ? 1 : 0.75,
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}
      <View className="flex-row justify-center mt-3" style={styles.toggleRow}>
        <TouchableOpacity
          className={`px-3 py-1 rounded-full mr-2 border ${
            chartBucketMode === "gastos"
              ? darkMode
                ? "border-indigo-400 bg-indigo-500"
                : "border-blue-400 bg-blue-500"
              : borderMutedClass
          }`}
          style={[
            styles.toggleButton,
            {
              backgroundColor: chartBucketMode === "gastos" ? toggleActiveBg : "transparent",
              borderColor:
                chartBucketMode === "gastos" ? toggleActiveBg : toggleInactiveBorder,
            },
          ]}
          onPress={() => setChartBucketMode("gastos")}
        >
          <Text
            className={chartBucketMode === "gastos" ? "text-white" : textPrimary}
            style={{ color: chartBucketMode === "gastos" ? "#FFFFFF" : toggleInactiveText }}
          >
            Gastos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-3 py-1 rounded-full border ${
            chartBucketMode === "ingresos"
              ? darkMode
                ? "border-indigo-400 bg-indigo-500"
                : "border-blue-400 bg-blue-500"
              : borderMutedClass
          }`}
          style={[
            styles.toggleButton,
            {
              backgroundColor: chartBucketMode === "ingresos" ? toggleActiveBg : "transparent",
              borderColor:
                chartBucketMode === "ingresos" ? toggleActiveBg : toggleInactiveBorder,
            },
          ]}
          onPress={() => setChartBucketMode("ingresos")}
        >
          <Text
            className={chartBucketMode === "ingresos" ? "text-white" : textPrimary}
            style={{ color: chartBucketMode === "ingresos" ? "#FFFFFF" : toggleInactiveText }}
          >
            Ingresos
          </Text>
        </TouchableOpacity>
      </View>
      {selectedBucketIndex != null && amountBucketData[selectedBucketIndex] && (
        <View
          className={`mt-3 p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
          style={[styles.detailCard, { backgroundColor: detailBg }]}
        >
          <Text
            className={`font-semibold ${textPrimary}`}
            style={{ color: labelPrimary, fontWeight: "700" }}
          >
            Rango {amountBucketData[selectedBucketIndex].label}
          </Text>
          <Text
            className={`${textPrimary} text-sm`}
            style={{ color: labelPrimary, marginTop: 4 }}
          >
            {amountBucketData[selectedBucketIndex].value} movimientos
            {chartBucketMode === "gastos" ? " de gasto" : " de ingreso"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  track: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 96,
    alignItems: "center",
  },
  detailCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
  },
});
