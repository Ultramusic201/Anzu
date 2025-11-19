// Presentational component: Donut chart for category distribution
// Shows mode toggle (Gastos/Ingresos), ring segments and legend
// Receives precomputed segments and totals

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Svg, G, Circle, Path, Text as SvgText } from "react-native-svg";

/**
 * @param {Object} props
 * @param {"gastos"|"ingresos"} props.chartPieMode
 * @param {(m:"gastos"|"ingresos")=>void} props.setChartPieMode
 * @param {Array<{path:string,color:string,label:string,value:number,percent:number}>} props.chartPieSegments
 * @param {number} props.pieTotal
 * @param {number|null} props.selectedPieIndex
 * @param {(i:number)=>void} props.setSelectedPieIndex
 * @param {string} props.cardBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {boolean} props.darkMode
 * @param {(n:number)=>string} props.formatUsd
 */
export default function DonutCategoriesChart({
  chartPieMode,
  setChartPieMode,
  chartPieSegments,
  pieTotal,
  selectedPieIndex,
  setSelectedPieIndex,
  cardBgClass,
  textPrimary,
  textMuted,
  darkMode,
  formatUsd,
}) {
  const cardBgColor = darkMode ? "#111827" : "#ffffff";
  const cardShadowColor = darkMode ? "#000000" : "#0f172a";
  const cardSubtleBg = darkMode ? "#1f2937" : "#f3f4f6";
  const toggleInactiveBg = darkMode ? "#1f2937" : "#e5e7eb";
  const toggleActiveBg = darkMode ? "#4338CA" : "#2563EB";
  const toggleInactiveText = darkMode ? "#e5e7eb" : "#1f2937";
  const legendDivider = darkMode ? "#374151" : "#d1d5db";

  return (
    <View
      className={`rounded-lg p-4 shadow-lg mb-4 ${cardBgClass}`}
      style={[
        styles.card,
        { backgroundColor: cardBgColor, shadowColor: cardShadowColor, width: "100%" },
      ]}
    >
      <Text
        className={`font-semibold text-base ${textPrimary}`}
        style={[styles.titleText, { color: darkMode ? "#F9FAFB" : "#111827" }]}
      >
        Distribución por categoría
      </Text>
      <View
        className="flex-row rounded-full overflow-hidden bg-black/5 mt-2"
        style={[styles.toggleGroup, { backgroundColor: toggleInactiveBg }]}
      >
        {["gastos", "ingresos"].map((mode) => {
          const isSelected = chartPieMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              className={`flex-1 justify-center px-3 py-1 ${
                isSelected ? (darkMode ? "bg-indigo-500" : "bg-blue-500") : ""
              }`}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isSelected ? toggleActiveBg : "transparent",
                },
              ]}
              onPress={() => setChartPieMode(mode)}
            >
              <Text
                className={isSelected ? "text-white font-semibold" : textPrimary}
                style={{
                  color: isSelected ? "#ffffff" : toggleInactiveText,
                  fontWeight: isSelected ? "600" : "500",
                }}
              >
                {mode === "gastos" ? "Gastos" : "Ingresos"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {chartPieSegments.length === 0 ? (
        <Text className={textMuted} style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
          Sin datos suficientes.
        </Text>
      ) : (
        <View className="flex-row items-center" style={styles.contentRow}>
          <Svg width={200} height={200} style={styles.chartSvg}>
            <G>
              <Circle cx={100} cy={100} r={90} fill={cardSubtleBg} />
              {chartPieSegments.map((segment, index) => (
                <Path
                  key={`chart-pie-${index}`}
                  d={segment.path}
                  fill={segment.color}
                  opacity={selectedPieIndex == null || selectedPieIndex === index ? 0.95 : 0.35}
                  onPress={() => setSelectedPieIndex(index)}
                />
              ))}
              <Circle cx={100} cy={100} r={52} fill={darkMode ? "#1f2937" : "#ffffff"} />
              <SvgText
                x={100}
                y={95}
                textAnchor="middle"
                fill={darkMode ? "#f9fafb" : "#111827"}
                fontSize={16}
                fontWeight="bold"
              >
                {chartPieMode === "gastos" ? "Gastos" : "Ingresos"}
              </SvgText>
              <SvgText
                x={100}
                y={112}
                textAnchor="middle"
                fill={darkMode ? "#e5e7eb" : "#4b5563"}
                fontSize={12}
              >
                {formatUsd ? formatUsd(pieTotal || 0) : `$ ${Number(pieTotal || 0).toFixed(2)}`}
              </SvgText>
            </G>
          </Svg>
          <View className="flex-1" style={styles.legendContainer}>
            {chartPieSegments.slice(0, 8).map((segment, index) => {
              const isSelected = selectedPieIndex === index;
              return (
                <TouchableOpacity
                  key={`chart-pie-legend-${segment.label}-${index}`}
                  className="flex-row items-center mb-2"
                  style={styles.legendRow}
                  onPress={() => setSelectedPieIndex(index)}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: segment.color,
                      marginRight: 8,
                      opacity: isSelected ? 1 : 0.6,
                    }}
                  />
                  <Text
                    className={`${textPrimary} flex-1`}
                    style={[styles.legendLabel, { color: darkMode ? "#f9fafb" : "#111827" }]}
                  >
                    {segment.label}
                  </Text>
                  <Text
                    className={`${textMuted} text-xs`}
                    style={[styles.legendPercent, { color: darkMode ? "#d1d5db" : "#6b7280" }]}
                  >
                    {segment.percent.toFixed(1)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {selectedPieIndex != null && chartPieSegments[selectedPieIndex] && (
        <View
          className={`mt-3 p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
          style={[styles.detailCard, { backgroundColor: darkMode ? "#1f2937" : "#f3f4f6" }]}
        >
          <Text
            className={`font-semibold ${textPrimary}`}
            style={{ color: darkMode ? "#f9fafb" : "#111827", fontWeight: "700" }}
          >
            {chartPieSegments[selectedPieIndex].label}
          </Text>
          <Text
            className={`${textPrimary} text-sm`}
            style={{ color: darkMode ? "#f9fafb" : "#111827", marginTop: 4 }}
          >
            {formatUsd ? formatUsd(chartPieSegments[selectedPieIndex].value || 0) : `$ ${Number(chartPieSegments[selectedPieIndex].value || 0).toFixed(2)}`} · {chartPieSegments[selectedPieIndex].percent.toFixed(1)}%
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartSvg: {
    marginRight: 16,
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  legendPercent: {
    fontSize: 12,
  },
  detailCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
  },
});
