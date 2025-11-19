import { Ionicons } from "@expo/vector-icons";
import { openDatabaseAsync } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
// Arquitectura: constantes y utilidades extraídas para mejorar legibilidad (SRP/SOLID)
import {
  MONTHS_SHORT,
  WEEKDAY_LABELS,
  AMOUNT_BUCKETS,
  PIE_COLORS,
} from "./src/constants/charts";
import {
  COLOR_GASTOS,
  COLOR_GASTOS_ALT,
  COLOR_INGRESOS,
  COLOR_INGRESOS_ALT,
} from "./src/constants/colors";
import {
  pad2,
  formatYMD,
  formatYM,
  startOfWeek,
  parseSearchDate,
} from "./src/utils/date";
import {
  polarToCartesian,
  arcPath,
  arcStroke,
  donutSegmentPath,
} from "./src/utils/svgPaths";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Circle,
  G,
  Line,
  Path,
  Polyline,
  Rect,
  Svg,
  Text as SvgText,
} from "react-native-svg";
import { useFonts } from "expo-font";
import { Righteous_400Regular } from "@expo-google-fonts/righteous";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import LineEvolutionChart from "./src/components/charts/LineEvolutionChart";
import DonutCategoriesChart from "./src/components/charts/DonutCategoriesChart";
import CategoryTopList from "./src/components/charts/CategoryTopList";
import AmountBucketsChart from "./src/components/charts/AmountBucketsChart";
import HeatmapChart from "./src/components/charts/HeatmapChart";
import TasaDelDiaModal from "./src/components/modals/TasaDelDiaModal";
import DataModal from "./src/components/modals/DataModal";
import CreateCreditModal from "./src/components/modals/CreateCreditModal";
import AddTransactionModal from "./src/components/modals/AddTransactionModal";
import SearchTransactionsModal from "./src/components/modals/SearchTransactionsModal";
import MonthPickerModal from "./src/components/modals/MonthPickerModal";

// Utilidades de fecha importadas desde src/utils/date

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
// MONTHS_SHORT importado desde src/constants/charts
const CATEGORIES = [
  "COMIDA",
  "COMIDA CHATARRA",
  "SERVICIOS",
  "JUEGOS",
  "OCIO",
  "SALUD",
  "PERSONAS",
  "ROPA",
  "AHORRO",
  "CRIPTO",
  "DEUDAS",
  "CREDITOS",
  "HIGIENE",
  "PERFUMERIA",
  "ELECTRODOMESTICOS",
  "TELEFONO",
  "VEHICULO",
  "TRANSPORTE",
  "EDUCACION",
  "MASCOTAS",
];

const CREDIT_PLAN_DAYS = [7, 15, 21, 28];
// WEEKDAY_LABELS, AMOUNT_BUCKETS y PIE_COLORS importados desde src/constants/charts
// COLOR_* importados desde src/constants/colors
const DAY_MS = 24 * 60 * 60 * 1000;
export default function App() {
  const [tasaDolar, setTasaDolar] = useState("");
  const [showTasaModal, setShowTasaModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [chartTransactions, setChartTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    tipo: "Gasto",
    descripcion: "",
    monto: "",
    moneda: "VES",
    categoria: "COMIDA",
  });
  const [currentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(formatYM(currentDate));
  const [viewMode, setViewMode] = useState("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(currentDate)
  );
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [db, setDb] = useState(null);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [tempYear, setTempYear] = useState(currentDate.getFullYear());
  const [tempMonthIndex, setTempMonthIndex] = useState(currentDate.getMonth());
  const [darkMode, setDarkMode] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [categoryMax, setCategoryMax] = useState(0);
  const [activeView, setActiveView] = useState("home");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [limitsByCategory, setLimitsByCategory] = useState({});
  const [txFilter, setTxFilter] = useState("todo");
  const [credits, setCredits] = useState([]);
  const [showCreateCreditModal, setShowCreateCreditModal] = useState(false);
  const [newCredit, setNewCredit] = useState({
    nombre: "",
    montoTotalUsd: "",
    inicialUsd: "",
    cuotasCantidad: "",
    montoCuotaUsd: "",
    planDias: 15,
  });
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [creditInstallments, setCreditInstallments] = useState([]);
  const [selectedInstallments, setSelectedInstallments] = useState({});
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [fontsLoaded] = useFonts({ Righteous_400Regular });
  const lastBackPressRef = useRef(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchDescription, setSearchDescription] = useState("");
  const [searchMinAmount, setSearchMinAmount] = useState("");
  const [searchMaxAmount, setSearchMaxAmount] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [chartPeriod, setChartPeriod] = useState("week");
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [chartCategoryMode, setChartCategoryMode] = useState("gastos");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [chartPieMode, setChartPieMode] = useState("gastos");
  const [selectedPieIndex, setSelectedPieIndex] = useState(null);
  const [selectedWeekdayIndex, setSelectedWeekdayIndex] = useState(null);
  const [chartBucketMode, setChartBucketMode] = useState("gastos");
  const [selectedBucketIndex, setSelectedBucketIndex] = useState(null);
  const [chartHeatmapMode, setChartHeatmapMode] = useState("gastos");
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);
  const [isFetchingOfficialRate, setIsFetchingOfficialRate] = useState(false);
  const [officialRateError, setOfficialRateError] = useState(null);

  const databaseFileName = "expense_tracker.db";

  const getDatabaseDir = () => `${FileSystem.documentDirectory}SQLite`;
  const getDatabaseFilePath = () => `${getDatabaseDir()}/${databaseFileName}`;

  const ensureDatabaseDirectory = async () => {
    const dir = getDatabaseDir();
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  };

  // parseSearchDate importado desde src/utils/date

  const normalizedTransactions = useMemo(() => {
    if (!Array.isArray(chartTransactions) || chartTransactions.length === 0)
      return [];
    return chartTransactions
      .map((t) => {
        if (!t || !t.fecha) return null;
        const parts = t.fecha.split("-").map((n) => parseInt(n, 10));
        if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
        const [year, month, day] = parts;
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return null;
        const amountUsd = Number(t.monto_usd_registro ?? 0);
        const amountVes = Number(t.monto_ves_registro ?? 0);
        return {
          ...t,
          categoria:
            t.categoria ?? (t.tipo === "Ingreso" ? "INGRESOS" : "SIN CATEGORIA"),
          date,
          amountUsd: Number.isFinite(amountUsd) ? amountUsd : 0,
          amountVes: Number.isFinite(amountVes) ? amountVes : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
  }, [chartTransactions]);

  const chartBaseData = useMemo(() => {
    const daily = new Map();
    const monthly = new Map();
    const categoryGastosMap = new Map();
    const categoryIngresosMap = new Map();
    const weekdayGastos = Array(7).fill(0);
    const weekdayIngresos = Array(7).fill(0);
    const bucketGastos = AMOUNT_BUCKETS.map(() => 0);
    const bucketIngresos = AMOUNT_BUCKETS.map(() => 0);
    const heatmapGastos = Array.from({ length: 7 }, () =>
      AMOUNT_BUCKETS.map(() => 0)
    );
    const heatmapIngresos = Array.from({ length: 7 }, () =>
      AMOUNT_BUCKETS.map(() => 0)
    );
    let totalGastos = 0;
    let totalIngresos = 0;

    normalizedTransactions.forEach((t) => {
      const amount = t.amountUsd;
      const isIngreso = t.tipo === "Ingreso";
      if (isIngreso) totalIngresos += amount;
      else totalGastos += amount;

      const dayKey = formatYMD(t.date);
      const dayEntry = daily.get(dayKey) || { ingresos: 0, gastos: 0 };
      if (isIngreso) dayEntry.ingresos += amount;
      else dayEntry.gastos += amount;
      daily.set(dayKey, dayEntry);

      const monthKey = formatYM(t.date);
      const monthEntry = monthly.get(monthKey) || { ingresos: 0, gastos: 0 };
      if (isIngreso) monthEntry.ingresos += amount;
      else monthEntry.gastos += amount;
      monthly.set(monthKey, monthEntry);

      const catKey = String(t.categoria || "SIN CATEGORIA");
      const targetCatMap = isIngreso ? categoryIngresosMap : categoryGastosMap;
      targetCatMap.set(catKey, (targetCatMap.get(catKey) || 0) + amount);

      const weekday = t.date.getDay();
      if (isIngreso) weekdayIngresos[weekday] += amount;
      else weekdayGastos[weekday] += amount;

      const bucketIndex = AMOUNT_BUCKETS.findIndex(
        (bucket) => amount >= bucket.min && amount < bucket.max
      );
      if (bucketIndex >= 0) {
        if (isIngreso) {
          bucketIngresos[bucketIndex] += 1;
          heatmapIngresos[weekday][bucketIndex] += amount;
        } else {
          bucketGastos[bucketIndex] += 1;
          heatmapGastos[weekday][bucketIndex] += amount;
        }
      }
    });

    const categoryGastos = Array.from(categoryGastosMap.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
    const categoryIngresos = Array.from(categoryIngresosMap.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    return {
      daily,
      monthly,
      categoryGastos,
      categoryIngresos,
      weekdayGastos,
      weekdayIngresos,
      bucketGastos,
      bucketIngresos,
      heatmapGastos,
      heatmapIngresos,
      totalGastos,
      totalIngresos,
    };
  }, [normalizedTransactions]);

  const lineChartData = useMemo(() => {
    const labels = [];
    const gastos = [];
    const ingresos = [];
    const now = new Date();

    if (chartPeriod === "year") {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      for (let i = 0; i < 12; i += 1) {
        const current = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = formatYM(current);
        const entry = chartBaseData.monthly.get(key) || { gastos: 0, ingresos: 0 };
        labels.push(`${MONTHS_SHORT[current.getMonth()]} '${String(current.getFullYear()).slice(-2)}`);
        gastos.push(entry.gastos);
        ingresos.push(entry.ingresos);
      }
    } else {
      const span = chartPeriod === "week" ? 7 : 30;
      for (let i = span - 1; i >= 0; i -= 1) {
        const current = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i
        );
        const key = formatYMD(current);
        const entry = chartBaseData.daily.get(key) || { gastos: 0, ingresos: 0 };
        labels.push(`${pad2(current.getDate())}/${pad2(current.getMonth() + 1)}`);
        gastos.push(entry.gastos);
        ingresos.push(entry.ingresos);
      }
    }

    return { labels, gastos, ingresos };
  }, [chartBaseData, chartPeriod]);

  const categoryChartData = useMemo(() => {
    const source =
      chartCategoryMode === "gastos"
        ? chartBaseData.categoryGastos
        : chartBaseData.categoryIngresos;
    return source.slice(0, 8);
  }, [chartBaseData, chartCategoryMode]);

  const pieChartData = useMemo(() => {
    const source =
      chartPieMode === "gastos"
        ? chartBaseData.categoryGastos
        : chartBaseData.categoryIngresos;
    const total = source.reduce((sum, item) => sum + item.total, 0);
    return { data: source, total };
  }, [chartBaseData, chartPieMode]);

  const amountBucketData = useMemo(() => {
    return AMOUNT_BUCKETS.map((bucket, index) => ({
      label: bucket.label,
      value:
        chartBucketMode === "gastos"
          ? chartBaseData.bucketGastos[index] || 0
          : chartBaseData.bucketIngresos[index] || 0,
    }));
  }, [chartBaseData, chartBucketMode]);

  const chartPieSegments = useMemo(() => {
    const outerR = 90;
    const innerR = 52;
    const cx = 100;
    const cy = 100;
    const total = pieChartData.total;
    const entries = pieChartData.data.filter((item) => (item.total || 0) > 0);
    if (entries.length === 0 || total <= 0) return [];

    const fullCircle = Math.PI * 2;
    const minAngle = (Math.PI / 180) * 3;
    const baseGap = (Math.PI / 180) * 1.5;
    const angles = entries.map((item) =>
      Math.max(minAngle, (item.total / total) * fullCircle)
    );

    let sumAngles = angles.reduce((acc, angle) => acc + angle, 0);
    if (sumAngles > fullCircle) {
      let excess = sumAngles - fullCircle;
      const adjustable = angles
        .map((angle, index) => (angle > minAngle ? index : -1))
        .filter((index) => index >= 0);
      let adjustableTotal = adjustable.reduce(
        (acc, index) => acc + (angles[index] - minAngle),
        0
      );
      if (adjustableTotal > 0) {
        adjustable.forEach((index) => {
          const reducible = angles[index] - minAngle;
          const delta = excess * (reducible / adjustableTotal);
          angles[index] = Math.max(minAngle, angles[index] - delta);
        });
      }
      sumAngles = angles.reduce((acc, angle) => acc + angle, 0);
    }

    const remaining = fullCircle - sumAngles;
    if (remaining > 1e-6) {
      const maxIndex = angles.indexOf(Math.max(...angles));
      angles[maxIndex] += remaining;
    }

    const segments = [];
    let current = -Math.PI / 2;
    angles.forEach((angle, index) => {
      const entry = entries[index];
      const start = current;
      const end = start + angle;
      const adjStart = start + baseGap / 2;
      const adjEnd = end - baseGap / 2;
      if (adjEnd > adjStart) {
        segments.push({
          path: donutSegmentPath(cx, cy, outerR, innerR, adjStart, adjEnd),
          color: PIE_COLORS[index % PIE_COLORS.length],
          label: entry.categoria,
          value: entry.total,
          percent: (entry.total / total) * 100,
        });
      }
      current = end;
    });

    return segments;
  }, [pieChartData]);

  const heatmapMatrix =
    chartHeatmapMode === "gastos"
      ? chartBaseData.heatmapGastos
      : chartBaseData.heatmapIngresos;
  const heatmapMax = heatmapMatrix.reduce((max, row) => {
    const rowMax = row.reduce((rMax, value) => Math.max(rMax, value || 0), 0);
    return Math.max(max, rowMax);
  }, 0);

  const windowWidth = Dimensions.get("window").width || 360;
  const chartWidth = Math.min(windowWidth - 48, 620);
  const lineChartHeight = 200;
  const lineLabels = lineChartData.labels;
  const lineMaxValue = Math.max(
    1,
    ...lineChartData.gastos,
    ...lineChartData.ingresos
  );
  const lineStep =
    lineLabels.length > 1 ? chartWidth / (lineLabels.length - 1) : chartWidth;
  const lineTopPadding = 16;
  const lineBottomPadding = 20;
  const lineDrawableHeight = lineChartHeight - lineTopPadding - lineBottomPadding;
  const gastosLinePoints = lineLabels.length
    ? lineChartData.gastos
        .map((value, index) => {
          const x =
            lineLabels.length > 1
              ? lineStep * index
              : chartWidth / 2;
          const y =
            lineTopPadding +
            (lineDrawableHeight -
              (value / lineMaxValue) * lineDrawableHeight);
          return `${x},${y}`;
        })
        .join(" ")
    : "";
  const ingresosLinePoints = lineLabels.length
    ? lineChartData.ingresos
        .map((value, index) => {
          const x =
            lineLabels.length > 1
              ? lineStep * index
              : chartWidth / 2;
          const y =
            lineTopPadding +
            (lineDrawableHeight -
              (value / lineMaxValue) * lineDrawableHeight);
          return `${x},${y}`;
        })
        .join(" ")
    : "";
  const lineHighlightX =
    selectedLineIndex != null
      ? lineLabels.length > 1
        ? lineStep * selectedLineIndex
        : chartWidth / 2
      : null;
  const highlightedLinePoint =
    selectedLineIndex != null && lineLabels[selectedLineIndex]
      ? {
          label: lineLabels[selectedLineIndex],
          gastos: lineChartData.gastos[selectedLineIndex] || 0,
          ingresos: lineChartData.ingresos[selectedLineIndex] || 0,
          yGastos:
            lineTopPadding +
            (lineDrawableHeight -
              ((lineChartData.gastos[selectedLineIndex] || 0) / lineMaxValue) *
                lineDrawableHeight),
          yIngresos:
            lineTopPadding +
            (lineDrawableHeight -
              ((lineChartData.ingresos[selectedLineIndex] || 0) /
                lineMaxValue) *
                lineDrawableHeight),
        }
      : null;

  const categoryMaxValue = Math.max(
    1,
    ...categoryChartData.map((item) => item.total || 0)
  );
  const bucketMaxValue = Math.max(
    1,
    ...amountBucketData.map((item) => item.value || 0)
  );

  const chartCurrency = "USD";
  const formatUsd = (value) =>
    `$ ${Number(value || 0).toFixed(value >= 1000 ? 0 : 2)}`;

  useEffect(() => {
    setSelectedLineIndex(null);
  }, [chartPeriod, chartBaseData]);

  useEffect(() => {
    setSelectedCategoryIndex(null);
  }, [chartCategoryMode, chartBaseData]);

  useEffect(() => {
    setSelectedPieIndex(null);
  }, [chartPieMode, chartBaseData]);

  useEffect(() => {
    setSelectedBucketIndex(null);
  }, [chartBucketMode, chartBaseData]);

  useEffect(() => {
    setSelectedHeatmapCell(null);
  }, [chartHeatmapMode, chartBaseData]);

  const ensureDatabaseFileExists = async () => {
    try {
      await ensureDatabaseDirectory();
      const path = getDatabaseFilePath();
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        throw new Error("La base de datos no se encuentra disponible");
      }
      return path;
    } catch (error) {
      console.error("[Backup ensureDatabaseFileExists]", error);
      throw error;
    }
  };

  const closeDataModal = () => {
    if (backupBusy) return;
    setShowDataModal(false);
    setBackupMessage("");
  };

  const exportDatabase = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "La exportación de base de datos no está soportada en la versión web."
      );
      return;
    }
    if (!db) {
      Alert.alert("Error", "Base de datos no inicializada aún");
      return;
    }
    setBackupBusy(true);
    setBackupMessage("Preparando archivo para exportar...");
    try {
      const sourcePath = await ensureDatabaseFileExists();
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "-")
        .slice(0, 19);
      const filename = `anzu-backup-${timestamp}.db`;

      let exportSucceeded = false;

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert(
            "Permiso requerido",
            "Debes seleccionar una carpeta para guardar el respaldo."
          );
        } else {
          try {
            const base64 = await FileSystem.readAsStringAsync(sourcePath, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              filename,
              "application/octet-stream"
            );
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert(
              "Exportación lista",
              `Se guardó el respaldo como ${filename} en la ubicación seleccionada.`
            );
            exportSucceeded = true;
          } catch (safError) {
            console.error("[Backup exportDatabase SAF]", safError);
            Alert.alert(
              "Error",
              "No se pudo guardar el archivo en la carpeta seleccionada."
            );
          }
        }
      } else {
        const exportDir = `${FileSystem.documentDirectory}exports/`;
        await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
        const targetPath = `${exportDir}${filename}`;
        await FileSystem.copyAsync({ from: sourcePath, to: targetPath });

        if (await Sharing.isAvailableAsync()) {
          setBackupMessage("Compartiendo archivo...");
          await Sharing.shareAsync(targetPath, {
            mimeType: "application/octet-stream",
            dialogTitle: "Exportar base de datos",
          });
        } else {
          Alert.alert(
            "Exportación lista",
            "El archivo se creó en la carpeta interna de la app."
          );
        }
        exportSucceeded = true;
      }

      if (exportSucceeded) {
        setShowDataModal(false);
        setBackupMessage("");
      }
    } catch (error) {
      console.error("[Backup exportDatabase]", error);
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    } finally {
      setBackupBusy(false);
      setBackupMessage("");
    }
  };

  const importDatabase = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "La importación de base de datos no está soportada en la versión web."
      );
      return;
    }
    if (!db) {
      Alert.alert("Error", "Base de datos no inicializada aún");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }
      setBackupBusy(true);
      setBackupMessage("Importando archivo seleccionado...");
      const asset = result.assets[0];
      const sourceUri = asset.uri;
      if (!sourceUri) {
        throw new Error("No se pudo acceder al archivo seleccionado");
      }

      await ensureDatabaseDirectory();
      const destPath = getDatabaseFilePath();
      if (db?.closeAsync) {
        try {
          await db.closeAsync();
        } catch (closeError) {
          console.error("[Backup importDatabase close]", closeError);
        }
      }
      setDb(null);
      await FileSystem.deleteAsync(destPath, { idempotent: true });
      await FileSystem.copyAsync({ from: sourceUri, to: destPath });
      setBackupMessage("Recargando datos...");

      const database = await openDatabaseAsync(databaseFileName);
      setDb(database);
      await initializeDB(database);
      await loadThemeFromDB(database);
      await loadLimits(database);
      await loadTransactions(database);
      await loadCategoryTotals(database);
      await loadCredits(database);
      await checkTasaDia(database);

      setShowDataModal(false);
      setBackupMessage("");
      Alert.alert("Éxito", "La base de datos se importó correctamente.");
    } catch (error) {
      console.error("[Backup importDatabase]", error);
      Alert.alert("Error", "No se pudo importar la base de datos.");
    } finally {
      setBackupBusy(false);
      setBackupMessage("");
    }
  };

  useEffect(() => {
    setChartTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    (async () => {
      try {
        const database = await openDatabaseAsync("expense_tracker.db");
        setDb(database);
        await initializeDB(database);
        await loadThemeFromDB(database);
        await checkTasaDia(database);
        await loadLimits(database);
        await loadTransactions(database);
        await loadCategoryTotals(database);
        await loadCredits(database);
        setBootstrapping(false);
      } catch (e) {
        console.error("[DB bootstrap] error", e);
        setBootstrapping(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!db || bootstrapping) return;
    (async () => {
      await loadTransactions(db);
      await loadCategoryTotals(db);
    })();
  }, [
    currentMonth,
    currentWeekStart,
    currentYear,
    viewMode,
    db,
    bootstrapping,
  ]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      if (showDrawer) {
        setShowDrawer(false);
        return true;
      }

      if (showCreateCreditModal) {
        setShowCreateCreditModal(false);
        return true;
      }

      if (showAddModal) {
        setShowAddModal(false);
        return true;
      }

      if (showMonthModal) {
        setShowMonthModal(false);
        return true;
      }

      if (showTasaModal) {
        setShowTasaModal(false);
        return true;
      }

      if (showDataModal) {
        closeDataModal();
        return true;
      }

      if (selectedCredit) {
        setSelectedCredit(null);
        setSelectedInstallments({});
        return true;
      }

      if (activeView !== "home") {
        setActiveView("home");
        return true;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      ToastAndroid.show(
        "Pulsa 2 veces para cerrar la aplicación",
        ToastAndroid.SHORT
      );
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [
    activeView,
    showDrawer,
    showCreateCreditModal,
    showAddModal,
    showMonthModal,
    showTasaModal,
    showDataModal,
    selectedCredit,
  ]);

  const ensureCategoriaColumn = async (database) => {
    try {
      const cols = await database.getAllAsync(
        "PRAGMA table_info(transacciones)"
      );
      const has = cols.some((c) => c.name === "categoria");
      if (!has) {
        await database.execAsync(
          "ALTER TABLE transacciones ADD COLUMN categoria TEXT;"
        );
      }
    } catch (e) {
      console.error("[DB ensureCategoriaColumn] error", e);
    }
  };

  const loadCredits = async (database = db) => {
    if (!database) return;
    try {
      const rows = await database.getAllAsync(
        "SELECT c.*, COALESCE(SUM(CASE WHEN i.estado = 'pagado' THEN 1 ELSE 0 END), 0) AS cuotas_pagadas, COALESCE(COUNT(i.id), 0) AS cuotas_total FROM creditos c LEFT JOIN creditos_cuotas i ON i.credit_id = c.id GROUP BY c.id ORDER BY c.fecha_creacion DESC"
      );
      setCredits(rows);
    } catch (e) {
      console.error("[DB loadCredits] error", e);
      setCredits([]);
    }
  };

  const loadCreditInstallments = async (creditId, database = db) => {
    if (!database || !creditId) return;
    try {
      const rows = await database.getAllAsync(
        "SELECT * FROM creditos_cuotas WHERE credit_id = ? ORDER BY numero ASC",
        [creditId]
      );
      setCreditInstallments(rows);
    } catch (e) {
      console.error("[DB loadCreditInstallments] error", e);
      setCreditInstallments([]);
    }
  };

  const createCredit = async () => {
    const nombre = (newCredit.nombre || "").trim();
    const total = parseFloat(newCredit.montoTotalUsd);
    const inicial = parseFloat(newCredit.inicialUsd);
    const cuotasCant = parseInt(newCredit.cuotasCantidad, 10);
    const montoCuota = parseFloat(newCredit.montoCuotaUsd);
    const plan = parseInt(newCredit.planDias, 10);

    if (
      !nombre ||
      !Number.isFinite(total) ||
      !Number.isFinite(inicial) ||
      !Number.isFinite(cuotasCant) ||
      !Number.isFinite(montoCuota) ||
      !Number.isFinite(plan)
    ) {
      Alert.alert(
        "Error",
        "Complete todos los campos del crédito correctamente"
      );
      return;
    }
    if (!CREDIT_PLAN_DAYS.includes(plan)) {
      Alert.alert("Error", "El plan de pago debe ser 7, 15, 21 o 28 días");
      return;
    }
    const esperado = inicial + cuotasCant * montoCuota;
    if (Math.abs(total - esperado) > 0.01) {
      Alert.alert(
        "Inconsistencia",
        "Monto Total = Inicial + (Cantidad de cuotas × Monto por cuota)"
      );
      return;
    }
    const rate = parseFloat(tasaDolar);
    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert("Error", "Debe establecer la tasa del día");
      setShowTasaModal(true);
      return;
    }
    if (!db) return;
    try {
      const today = formatYMD(new Date());
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT INTO creditos (nombre, fecha_creacion, monto_total_usd, inicial_usd, cuotas_cantidad, monto_cuota_usd, dias_plan, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            nombre,
            today,
            total,
            inicial,
            cuotasCant,
            montoCuota,
            plan,
            "activo",
          ]
        );
        const last = await db.getAllAsync(
          "SELECT id FROM creditos ORDER BY id DESC LIMIT 1"
        );
        const creditId = last && last[0] ? last[0].id : null;
        if (!creditId) throw new Error("No se obtuvo ID del crédito");
        for (let i = 1; i <= cuotasCant; i++) {
          const d = new Date();
          d.setDate(d.getDate() + plan * i);
          const f = formatYMD(d);
          await db.runAsync(
            "INSERT INTO creditos_cuotas (credit_id, numero, fecha_programada, monto_usd, estado) VALUES (?, ?, ?, ?, ?)",
            [creditId, i, f, montoCuota, "pendiente"]
          );
        }
        const montoUsd = inicial;
        const montoVes = inicial * rate;
        await db.runAsync(
          "INSERT INTO transacciones (fecha, tipo, descripcion, monto_original, moneda_original, monto_usd_registro, monto_ves_registro, categoria, tasa_ves_a_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            "Gasto",
            `Inicial crédito ${nombre}`,
            montoUsd,
            "USD",
            montoUsd,
            montoVes,
            "CREDITOS",
            rate,
          ]
        );
      });
      setShowCreateCreditModal(false);
      setNewCredit({
        nombre: "",
        montoTotalUsd: "",
        inicialUsd: "",
        cuotasCantidad: "",
        montoCuotaUsd: "",
        planDias: 15,
      });
      await loadCredits();
      await loadTransactions();
      await loadCategoryTotals();
    } catch (e) {
      console.error("[DB createCredit] error", e);
      Alert.alert("Error", "No se pudo crear el crédito");
    }
  };

  const toggleInstallmentSelection = (id) => {
    setSelectedInstallments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const paySelectedInstallments = async (payAll = false) => {
    if (!selectedCredit) return;
    const rate = parseFloat(tasaDolar);
    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert("Error", "Debe establecer la tasa del día");
      setShowTasaModal(true);
      return;
    }
    const rows = payAll
      ? creditInstallments.filter((r) => r.estado !== "pagado")
      : creditInstallments.filter(
          (r) => selectedInstallments[r.id] && r.estado !== "pagado"
        );
    if (rows.length === 0) {
      Alert.alert("Atención", "No hay cuotas seleccionadas pendientes");
      return;
    }
    if (!db) return;
    try {
      const today = formatYMD(new Date());
      const sumUsd = rows.reduce((s, r) => s + Number(r.monto_usd || 0), 0);
      const sumVes = sumUsd * rate;
      const nums = rows.map((r) => `#${r.numero}`).join(", ");
      await db.withTransactionAsync(async () => {
        for (const r of rows) {
          const ves = Number(r.monto_usd || 0) * rate;
          await db.runAsync(
            "UPDATE creditos_cuotas SET estado = 'pagado', fecha_pago = ?, tasa_ves_a_usd_pagado = ?, monto_ves_pagado = ? WHERE id = ?",
            [today, rate, ves, r.id]
          );
        }
        await db.runAsync(
          "INSERT INTO transacciones (fecha, tipo, descripcion, monto_original, moneda_original, monto_usd_registro, monto_ves_registro, categoria, tasa_ves_a_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            "Gasto",
            `Pago cuotas crédito ${
              selectedCredit.nombre || selectedCredit.id
            } (${nums})`,
            sumUsd,
            "USD",
            sumUsd,
            sumVes,
            "CREDITOS",
            rate,
          ]
        );
        const pend = await db.getAllAsync(
          "SELECT COUNT(*) as c FROM creditos_cuotas WHERE credit_id = ? AND estado != 'pagado'",
          [selectedCredit.id]
        );
        const remaining = pend && pend[0] ? Number(pend[0].c || 0) : 0;
        if (remaining === 0) {
          await db.runAsync(
            "UPDATE creditos SET estado = 'pagado' WHERE id = ?",
            [selectedCredit.id]
          );
        }
      });
      setSelectedInstallments({});
      await loadCreditInstallments(selectedCredit.id);
      await loadCredits();
      await loadTransactions();
      await loadCategoryTotals();
      Alert.alert("Éxito", "Pago registrado");
    } catch (e) {
      console.error("[DB paySelectedInstallments] error", e);
      Alert.alert("Error", "No se pudo registrar el pago");
    }
  };

  const openCredit = async (credit) => {
    setSelectedCredit(credit);
    setSelectedInstallments({});
    await loadCreditInstallments(credit.id);
  };

  const backToCreditsList = () => {
    setSelectedCredit(null);
    setCreditInstallments([]);
    setSelectedInstallments({});
  };

  const buildEmptyLimits = () => {
    const m = {};
    CATEGORIES.forEach((c) => {
      m[c] = { diario: "", semanal: "", mensual: "" };
    });
    return m;
  };

  const loadLimits = async (database = db) => {
    if (!database) return;
    try {
      const rows = await database.getAllAsync(
        "SELECT categoria, periodo, monto_usd FROM limites"
      );
      const base = buildEmptyLimits();
      rows.forEach((r) => {
        if (!base[r.categoria]) return;
        const val = r.monto_usd != null ? String(r.monto_usd) : "";
        if (
          r.periodo === "diario" ||
          r.periodo === "semanal" ||
          r.periodo === "mensual"
        ) {
          base[r.categoria][r.periodo] = val;
        }
      });
      setLimitsByCategory(base);
    } catch (e) {
      console.error("[DB loadLimits] error", e);
      setLimitsByCategory(buildEmptyLimits());
    }
  };

  const saveLimits = async () => {
    const errs = [];
    CATEGORIES.forEach((cat) => {
      const v = limitsByCategory[cat] || {};
      const d = v.diario !== "" ? parseFloat(v.diario) : null;
      const s = v.semanal !== "" ? parseFloat(v.semanal) : null;
      const m = v.mensual !== "" ? parseFloat(v.mensual) : null;
      if (Number.isNaN(d) || Number.isNaN(s) || Number.isNaN(m)) {
        errs.push(cat);
        return;
      }
      if (d != null && s != null && d > s) errs.push(cat);
      if (d != null && m != null && d > m) errs.push(cat);
      if (s != null && m != null && s > m) errs.push(cat);
    });
    if (errs.length > 0) {
      Alert.alert(
        "Error",
        "Revise los límites. Diario ≤ Semanal ≤ Mensual por categoría."
      );
      return;
    }
    if (!db) return;
    try {
      await db.withTransactionAsync(async () => {
        for (const cat of CATEGORIES) {
          const v = limitsByCategory[cat] || {};
          const entries = [
            { p: "diario", val: v.diario },
            { p: "semanal", val: v.semanal },
            { p: "mensual", val: v.mensual },
          ];
          for (const e of entries) {
            const has = e.val !== "" && !Number.isNaN(parseFloat(e.val));
            if (has) {
              await db.runAsync(
                "INSERT INTO limites (categoria, periodo, monto_usd) VALUES (?, ?, ?) ON CONFLICT(categoria, periodo) DO UPDATE SET monto_usd = excluded.monto_usd",
                [cat, e.p, parseFloat(e.val)]
              );
            } else {
              await db.runAsync(
                "DELETE FROM limites WHERE categoria = ? AND periodo = ?",
                [cat, e.p]
              );
            }
          }
        }
      });
      Alert.alert("Éxito", "Límites guardados");
      await loadLimits();
    } catch (e) {
      console.error("[DB saveLimits] error", e);
      Alert.alert("Error", "No se pudieron guardar los límites");
    }
  };

  useEffect(() => {
    if (!db) return;
    if (activeView === "limits") {
      loadLimits(db);
    }
    if (activeView === "credits") {
      loadCredits(db);
    }
    if (activeView === "categories") {
      loadCategoryTotals(db);
    }
  }, [activeView, db]);

  const ensureTasaColumn = async (database) => {
    try {
      const cols = await database.getAllAsync(
        "PRAGMA table_info(transacciones)"
      );
      const has = cols.some((c) => c.name === "tasa_ves_a_usd");
      if (!has) {
        await database.execAsync(
          "ALTER TABLE transacciones ADD COLUMN tasa_ves_a_usd REAL;"
        );
      }
    } catch (e) {
      console.error("[DB ensureTasaColumn] error", e);
    }
  };
  const ensureTransactionColumns = async (database) => {
    try {
      const cols = await database.getAllAsync(
        "PRAGMA table_info(transacciones)"
      );
      const names = cols.map((c) => c.name);
      const addIfMissing = async (name, type) => {
        if (!names.includes(name)) {
          await database.execAsync(
            `ALTER TABLE transacciones ADD COLUMN ${name} ${type};`
          );
        }
      };
      await addIfMissing("monto_original", "REAL");
      await addIfMissing("moneda_original", "TEXT");
      await addIfMissing("monto_usd_registro", "REAL");
      await addIfMissing("monto_ves_registro", "REAL");
      await addIfMissing("categoria", "TEXT");
      await addIfMissing("tasa_ves_a_usd", "REAL");
    } catch (e) {
      console.error("[DB ensureTransactionColumns] error", e);
    }
  };

  const saveSetting = async (key, value) => {
    if (!db) return;
    try {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, value]
      );
    } catch (e) {
      console.error("[DB saveSetting] error", e);
    }
  };

  const loadThemeFromDB = async (database = db) => {
    if (!database) return;
    try {
      const rows = await database.getAllAsync(
        "SELECT value FROM settings WHERE key = ?",
        ["theme"]
      );
      if (rows && rows.length > 0) {
        const val = rows[0].value;
        setDarkMode(val === "dark");
      }
    } catch (e) {
      console.error("[DB loadThemeFromDB] error", e);
    }
  };

  const toggleTheme = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveSetting("theme", next ? "dark" : "light");
  };

  const initializeDB = async (database = db) => {
    if (!database) return;
    try {
      await database.withTransactionAsync(async () => {
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS tasas_diarias (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT UNIQUE, tasa_ves_a_usd REAL);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS transacciones (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT, tipo TEXT, descripcion TEXT, monto_original REAL, moneda_original TEXT, monto_usd_registro REAL, monto_ves_registro REAL, categoria TEXT, tasa_ves_a_usd REAL);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS limites (id INTEGER PRIMARY KEY AUTOINCREMENT, categoria TEXT, periodo TEXT, monto_usd REAL, UNIQUE(categoria, periodo));"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS creditos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, fecha_creacion TEXT, monto_total_usd REAL, inicial_usd REAL, cuotas_cantidad INTEGER, monto_cuota_usd REAL, dias_plan INTEGER, estado TEXT);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS creditos_cuotas (id INTEGER PRIMARY KEY AUTOINCREMENT, credit_id INTEGER, numero INTEGER, fecha_programada TEXT, monto_usd REAL, estado TEXT, fecha_pago TEXT, tasa_ves_a_usd_pagado REAL, monto_ves_pagado REAL, FOREIGN KEY (credit_id) REFERENCES creditos(id));"
        );
        await database.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_creditos_cuotas_credit ON creditos_cuotas(credit_id);"
        );
      });
      await ensureCategoriaColumn(database);
      await ensureTasaColumn(database);
      await ensureTransactionColumns(database);
    } catch (e) {
      console.error("[DB initializeDB] error", e);
    }
  };

  const checkTasaDia = async (database = db) => {
    if (!database) return;
    try {
      const today = formatYMD(new Date());
      const rows = await database.getAllAsync(
        "SELECT * FROM tasas_diarias WHERE fecha = ?",
        [today]
      );
      if (rows.length === 0) {
        setOfficialRateError(null);
        setShowTasaModal(true);
      } else {
        setTasaDolar(rows[0].tasa_ves_a_usd.toString());
      }
    } catch (e) {
      console.error("[DB checkTasaDia] error", e);
    }
  };

  const fetchOfficialRate = async () => {
    try {
      setIsFetchingOfficialRate(true);
      setOfficialRateError(null);
      const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const promedio = data?.promedio;
      if (typeof promedio !== "number" || Number.isNaN(promedio) || promedio <= 0) {
        throw new Error("Invalid promedio value");
      }
      setTasaDolar(String(promedio));
    } catch (error) {
      console.error("[Tasa fetchOfficialRate]", error);
      setOfficialRateError("No se pudo obtener la tasa oficial. Ingrésala manualmente.");
    } finally {
      setIsFetchingOfficialRate(false);
    }
  };

  const guardarTasaDia = async () => {
    if (
      !tasaDolar ||
      isNaN(parseFloat(tasaDolar)) ||
      parseFloat(tasaDolar) <= 0
    ) {
      Alert.alert("Error", "Por favor ingrese una tasa válida");
      return;
    }

    if (!db) return;
    try {
      const today = formatYMD(new Date());
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT OR REPLACE INTO tasas_diarias (fecha, tasa_ves_a_usd) VALUES (?, ?)",
          [today, parseFloat(tasaDolar)]
        );
      });
      setShowTasaModal(false);
      setOfficialRateError(null);
      await loadTransactions();
    } catch (e) {
      console.error("[DB guardarTasaDia] error", e);
    }
  };

  const getPeriodRange = () => {
    try {
      const todayStr = formatYMD(new Date());
      if (viewMode === "month") {
        const ym =
          typeof currentMonth === "string"
            ? currentMonth
            : formatYM(new Date());
        const [year, month] = ym.split("-");
        if (!year || !month) return { startDate: todayStr, endDate: todayStr };
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        return { startDate, endDate };
      } else if (viewMode === "year") {
        const y = Number.isFinite(currentYear)
          ? currentYear
          : new Date().getFullYear();
        return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
      } else if (viewMode === "week") {
        const s =
          currentWeekStart instanceof Date
            ? currentWeekStart
            : startOfWeek(new Date());
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        return { startDate: formatYMD(s), endDate: formatYMD(e) };
      }
      return { startDate: todayStr, endDate: todayStr };
    } catch (_e) {
      const todayStr = formatYMD(new Date());
      return { startDate: todayStr, endDate: todayStr };
    }
  };

  const loadTransactions = async (database = db) => {
    const { startDate, endDate } = getPeriodRange();

    if (!database) return;
    try {
      if (!startDate || !endDate) {
        console.warn("[DB loadTransactions] invalid period", {
          viewMode,
          startDate,
          endDate,
        });
        return;
      }

      const parsedStart = parseSearchDate(searchStartDate);
      const parsedEnd = parseSearchDate(searchEndDate);
      const effectiveStart = parsedStart || startDate;
      const effectiveEnd = parsedEnd || endDate;
      const [fromDate, toDate] =
        effectiveStart && effectiveEnd && effectiveStart > effectiveEnd
          ? [effectiveEnd, effectiveStart]
          : [effectiveStart, effectiveEnd];

      const conditions = ["fecha BETWEEN ? AND ?"];
      const params = [fromDate, toDate];

      const desc = (searchDescription || "").trim().toLowerCase();
      if (desc.length) {
        conditions.push("LOWER(descripcion) LIKE ?");
        params.push(`%${desc}%`);
      }

      const minAmount = parseFloat(searchMinAmount);
      if (Number.isFinite(minAmount)) {
        conditions.push("monto_usd_registro >= ?");
        params.push(minAmount);
      }

      const maxAmount = parseFloat(searchMaxAmount);
      if (Number.isFinite(maxAmount)) {
        conditions.push("monto_usd_registro <= ?");
        params.push(maxAmount);
      }

      const query = `SELECT * FROM transacciones WHERE ${conditions.join(
        " AND "
      )} ORDER BY fecha DESC`;

      const rows = await database.getAllAsync(query, params);
      setTransactions(rows);
    } catch (e) {
      console.error("[DB loadTransactions] error", e);
      try {
        const rows = await database.getAllAsync(
          "SELECT * FROM transacciones ORDER BY fecha DESC LIMIT 200"
        );
        setTransactions(rows);
      } catch (e2) {
        console.error("[DB loadTransactions fallback] error", e2);
      }
    }
  };

  const applyTransactionSearch = () => {
    const minAmount = parseFloat(searchMinAmount);
    const maxAmount = parseFloat(searchMaxAmount);
    if (Number.isFinite(minAmount) && Number.isFinite(maxAmount)) {
      if (maxAmount < minAmount) {
        Alert.alert(
          "Montos inválidos",
          "El monto máximo no puede ser menor al monto mínimo."
        );
        return;
      }
    }

    const parsedStart = parseSearchDate(searchStartDate);
    const parsedEnd = parseSearchDate(searchEndDate);

    if (searchStartDate && !parsedStart) {
      Alert.alert(
        "Fecha inicial inválida",
        "Usa el formato DD/MM/AAAA."
      );
      return;
    }

    if (searchEndDate && !parsedEnd) {
      Alert.alert(
        "Fecha final inválida",
        "Usa el formato DD/MM/AAAA."
      );
      return;
    }

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      Alert.alert(
        "Fechas inválidas",
        "La fecha final no puede ser menor que la fecha inicial."
      );
      return;
    }

    setShowSearchModal(false);
    setTimeout(() => {
      loadTransactions();
    }, 0);
  };

  const resetTransactionSearch = () => {
    setSearchDescription("");
    setSearchMinAmount("");
    setSearchMaxAmount("");
    setSearchStartDate("");
    setSearchEndDate("");
    setShowSearchModal(false);
    setTimeout(() => {
      loadTransactions();
    }, 0);
  };

  const loadCategoryTotals = async (database = db) => {
    const { startDate, endDate } = getPeriodRange();
    if (!database) return;
    try {
      if (!startDate || !endDate) {
        console.warn("[DB loadCategoryTotals] invalid period", {
          viewMode,
          startDate,
          endDate,
        });
        return;
      }
      // debug
      console.log("[DB loadCategoryTotals] period", {
        viewMode,
        startDate,
        endDate,
      });
      const rows = await database.getAllAsync(
        "SELECT COALESCE(categoria, 'SIN CATEGORIA') as categoria, SUM(monto_ves_registro) as total_ves, SUM(monto_usd_registro) as total_usd FROM transacciones WHERE fecha BETWEEN ? AND ? AND tipo = 'Gasto' GROUP BY COALESCE(categoria, 'SIN CATEGORIA')",
        [startDate, endDate]
      );
      // Normalize numbers and sort desc
      const data = rows
        .map((r) => ({
          categoria: r.categoria,
          totalVES: Number(r.total_ves || 0),
          totalUSD: Number(r.total_usd || 0),
        }))
        .sort((a, b) => b.totalVES - a.totalVES);
      setCategoryTotals(data);
      setCategoryMax(
        data.length ? Math.max(...data.map((d) => d.totalVES)) : 0
      );
    } catch (e) {
      console.error("[DB loadCategoryTotals] error", e);
      setCategoryTotals([]);
      setCategoryMax(0);
    }
  };

  const agregarTransaccion = async () => {
    if (
      !newTransaction.descripcion ||
      !newTransaction.monto ||
      isNaN(parseFloat(newTransaction.monto))
    ) {
      Alert.alert("Error", "Por favor complete todos los campos correctamente");
      return;
    }

    const today = formatYMD(new Date());
    const monto = parseFloat(newTransaction.monto);
    const rate = parseFloat(tasaDolar);
    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert(
        "Error",
        "Debe establecer una tasa válida del día antes de guardar"
      );
      setShowTasaModal(true);
      return;
    }
    let montoUsd = 0;
    let montoVes = 0;

    if (newTransaction.moneda === "USD") {
      montoUsd = monto;
      montoVes = monto * rate;
    } else {
      montoVes = monto;
      montoUsd = monto / rate;
    }
    if (!db) return;
    try {
      if (
        !Number.isFinite(montoUsd) ||
        !Number.isFinite(montoVes) ||
        !Number.isFinite(monto)
      ) {
        Alert.alert(
          "Error",
          "Los montos calculados no son válidos. Revise los datos e intente de nuevo."
        );
        return;
      }
      const categoriaParam =
        newTransaction.tipo === "Ingreso"
          ? null
          : newTransaction.categoria || "SIN CATEGORIA";
      console.log("[DB agregarTransaccion] params", {
        fecha: today,
        tipo: newTransaction.tipo,
        descripcion: newTransaction.descripcion,
        monto_original: monto,
        moneda_original: newTransaction.moneda,
        monto_usd_registro: montoUsd,
        monto_ves_registro: montoVes,
        categoria: categoriaParam,
        tasa_ves_a_usd: rate,
      });
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT INTO transacciones (fecha, tipo, descripcion, monto_original, moneda_original, monto_usd_registro, monto_ves_registro, categoria, tasa_ves_a_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            newTransaction.tipo,
            newTransaction.descripcion,
            monto,
            newTransaction.moneda,
            montoUsd,
            montoVes,
            categoriaParam,
            rate,
          ]
        );
      });
      setNewTransaction({
        tipo: "Gasto",
        descripcion: "",
        monto: "",
        moneda: "VES",
        categoria: "COMIDA",
      });
      setShowAddModal(false);
      await loadTransactions();
      await loadCategoryTotals();
    } catch (e) {
      console.error("[DB agregarTransaccion] error", e);
    }
  };

  const monthLabel = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };

  const changeMonth = (delta) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(formatYM(d));
  };

  const calcularTotales = () => {
    let ingresosVES = 0;
    let gastosVES = 0;
    let ingresosUSD = 0;
    let gastosUSD = 0;

    transactions.forEach((trans) => {
      if (trans.tipo === "Ingreso") {
        ingresosVES += trans.monto_ves_registro;
        ingresosUSD += trans.monto_usd_registro;
      } else {
        gastosVES += trans.monto_ves_registro;
        gastosUSD += trans.monto_usd_registro;
      }
    });

    return {
      ingresosVES: ingresosVES.toFixed(2),
      gastosVES: gastosVES.toFixed(2),
      balanceVES: (ingresosVES - gastosVES).toFixed(2),
      ingresosUSD: ingresosUSD.toFixed(2),
      gastosUSD: gastosUSD.toFixed(2),
      balanceUSD: (ingresosUSD - gastosUSD).toFixed(2),
    };
  };

  const totales = calcularTotales();
  const screenBgClass = darkMode ? "bg-gray-900" : "bg-gray-100";
  const headerBgClass = darkMode ? "bg-gray-900" : "bg-sky-600";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-300" : "text-gray-500";
  const modalBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const accentBtnClass = darkMode ? "bg-indigo-500" : "bg-blue-500";
  const borderMutedClass = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorderClass = darkMode ? "border-gray-600" : "border-gray-300";
  const inputTextClass = darkMode ? "text-white" : "text-gray-900";
  const placeholderColor = darkMode ? "#9CA3AF" : "#6B7280";
  const chipSelectedBgBorder = darkMode
    ? "bg-indigo-600 border-indigo-400"
    : "bg-blue-600 border-blue-600";
  const chipSelectedText = "text-white";
  const chipUnselectedBgBorder = darkMode
    ? "bg-transparent border-gray-600"
    : "bg-transparent border-gray-300";
  const chipUnselectedText = darkMode ? "text-gray-200" : "text-gray-700";
  const minorBtnBgClass = darkMode ? "bg-gray-700" : "bg-gray-300";
  const smallBtnBgClass = darkMode ? "bg-gray-700" : "bg-gray-100";
  const barTrackClass = darkMode ? "bg-gray-700" : "bg-gray-200";
  const barFillClass = darkMode ? "bg-indigo-500" : "bg-blue-500";
  const warnBgClass = darkMode
    ? "bg-red-900 border-red-700"
    : "bg-red-50 border-red-200";
  const warnTextClass = darkMode ? "text-red-200" : "text-red-700";

  // Pie chart helpers and data
  const totalGastosVES = categoryTotals.reduce((s, d) => s + d.totalVES, 0);
  const totalGastosUSD = categoryTotals.reduce(
    (s, d) => s + (d.totalUSD || 0),
    0
  );
  const pieColors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#84cc16",
    "#f97316",
    "#06b6d4",
  ];

  const CATEGORY_COLOR_MAP = {
    COMIDA: "#ef4444",
    "COMIDA CHATARRA": "#f59e0b",
    SERVICIOS: "#10b981",
    JUEGOS: "#3b82f6",
    OCIO: "#8b5cf6",
    SALUD: "#ec4899",
    PERSONAS: "#14b8a6",
    ROPA: "#84cc16",
    AHORRO: "#f97316",
    CRIPTO: "#06b6d4",
    DEUDAS: "#b91c1c",
    CREDITOS: "#2563eb",
    HIGIENE: "#0ea5e9",
    PERFUMERIA: "#f472b6",
    ELECTRODOMESTICOS: "#64748b",
    TELEFONO: "#22d3ee",
    VEHICULO: "#eab308",
    TRANSPORTE: "#2dd4bf",
    EDUCACION: "#60a5fa",
    MASCOTAS: "#a78bfa",
    "SIN CATEGORIA": "#9ca3af",
    INGRESO: "#16a34a",
  };
  const CATEGORY_ICON_MAP = {
    COMIDA: "fast-food",
    "COMIDA CHATARRA": "pizza",
    SERVICIOS: "construct",
    JUEGOS: "game-controller",
    OCIO: "beer",
    SALUD: "medkit",
    PERSONAS: "people",
    ROPA: "shirt",
    AHORRO: "wallet",
    CRIPTO: "logo-bitcoin",
    DEUDAS: "trending-down",
    CREDITOS: "card",
    HIGIENE: "water",
    PERFUMERIA: "flower",
    ELECTRODOMESTICOS: "tv",
    TELEFONO: "phone-portrait",
    VEHICULO: "car",
    TRANSPORTE: "bus",
    EDUCACION: "school",
    MASCOTAS: "paw",
    "SIN CATEGORIA": "pricetag",
    INGRESO: "trending-up",
  };
  const getCategoryColor = (cat, tipo) =>
    CATEGORY_COLOR_MAP[
      cat ?? (tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")
    ] || "#6b7280";
  const getCategoryIcon = (cat, tipo) =>
    CATEGORY_ICON_MAP[
      cat ?? (tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")
    ] || "pricetag";

  // Helpers de paths SVG importados desde src/utils/svgPaths

  const cx = 110,
    cy = 110,
    radius = 90;
  const donutThickness = 20;
  const donutTrackColor = darkMode ? "#374151" : "#e5e7eb";
  const donutCenterFill = darkMode ? "#1f2937" : "#ffffff"; // matches card bg
  const svgTextColor = darkMode ? "#ffffff" : "#111827";
  const ringInnerR = radius - donutThickness; // inner radius of ring
  const centerR = ringInnerR - 4; // center fill smaller than inner ring
  const baseGapRad = (Math.PI / 180) * 1.2; // ~1.2° base, ajustable
  let startAngle = -Math.PI / 2; // start at top
  const pieSegments = [];
  if (totalGastosVES > 0) {
    const chartCategories = categoryTotals
      .slice(0, 8)
      .filter((r) => r.totalVES > 0);
    const n = chartCategories.length;
    if (n > 0) {
      const sumTop = chartCategories.reduce((s, r) => s + r.totalVES, 0);
      const gap = baseGapRad;
      const full = Math.PI * 2;
      const available = Math.max(0, full - n * gap);
      const baseAngles = chartCategories.map((r) =>
        sumTop > 0 ? (r.totalVES / sumTop) * available : 0
      );
      const minAngle = (Math.PI / 180) * 2; // 2° mínimo
      let angles = baseAngles.map((a) => Math.max(a, minAngle));
      let over = angles.reduce((s, a) => s + a, 0) - available;
      if (over > 1e-6) {
        // Reducir proporcionalmente sobre los que superan el mínimo
        const adjustableIdx = angles
          .map((a, i) => (a > minAngle ? i : -1))
          .filter((i) => i >= 0);
        let adjustableSum = adjustableIdx.reduce(
          (s, i) => s + (angles[i] - minAngle),
          0
        );
        if (adjustableSum > 0) {
          adjustableIdx.forEach((i) => {
            const reducible = angles[i] - minAngle;
            const delta = over * (reducible / adjustableSum);
            angles[i] = Math.max(minAngle, angles[i] - delta);
          });
        }
      }

      let aStart = -Math.PI / 2;
      chartCategories.forEach((row, idx) => {
        const aSpan = angles[idx];
        const aEnd = aStart + aSpan;
        const adjStart = aStart + gap / 2;
        const adjEnd = aEnd - gap / 2;
        if (adjEnd > adjStart) {
          pieSegments.push({
            d: donutSegmentPath(cx, cy, radius, ringInnerR, adjStart, adjEnd),
            color: pieColors[idx % pieColors.length],
            key: `${row.categoria}-${idx}`,
            pct: totalGastosVES > 0 ? (row.totalVES / totalGastosVES) * 100 : 0,
            label: row.categoria,
            usd: row.totalUSD,
            ves: row.totalVES,
          });
        }
        aStart = aEnd;
      });
    }
  }

  const formatearFecha = (fechaStr) => {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPeriodLimitSumUSD = () => {
    const key =
      viewMode === "week" ? "semanal" : viewMode === "month" ? "mensual" : null;
    if (!key) return 0;
    let sum = 0;
    for (const cat of CATEGORIES) {
      const v = limitsByCategory[cat];
      if (v && v[key] !== "") {
        const n = parseFloat(v[key]);
        if (!Number.isNaN(n)) sum += n;
      }
    }
    return sum;
  };
  const limitSumUSD = getPeriodLimitSumUSD();
  const gastosUSDNumber = parseFloat(totales.gastosUSD || "0");
  const getExceededCategories = () => {
    const key =
      viewMode === "week" ? "semanal" : viewMode === "month" ? "mensual" : null;
    if (!key) return [];
    const exceeded = [];
    for (const row of categoryTotals) {
      const limStr = limitsByCategory[row.categoria]?.[key];
      if (limStr == null || limStr === "") continue;
      const lim = parseFloat(limStr);
      if (!Number.isNaN(lim) && row.totalUSD > lim)
        exceeded.push(row.categoria);
    }
    return exceeded;
  };
  const exceededCategories = getExceededCategories();
  const exceededLimit = exceededCategories.length > 0;
  const limitName =
    viewMode === "week"
      ? "SEMANAL"
      : viewMode === "month"
      ? "MENSUAL"
      : "DIARIO";

  const periodLabel = () => {
    if (viewMode === "month") return monthLabel(currentMonth);
    if (viewMode === "year") return `Año ${currentYear}`;
    if (viewMode === "week") {
      const s = currentWeekStart;
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return `Semana ${formatearFecha(formatYMD(s))} - ${formatearFecha(
        formatYMD(e)
      )}`;
    }
    return "";
  };

  const changePeriod = (delta) => {
    if (viewMode === "month") {
      changeMonth(delta);
    } else if (viewMode === "year") {
      setCurrentYear((y) => y + delta);
    } else {
      setCurrentWeekStart((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + delta * 7);
        return nd;
      });
    }
  };

  const filteredTransactions =
    txFilter === "todo"
      ? transactions
      : transactions.filter((t) =>
          txFilter === "gastos" ? t.tipo !== "Ingreso" : t.tipo === "Ingreso"
        );

  return (
    <SafeAreaView className={`flex-1 ${screenBgClass}`}>
      <StatusBar
        style="light"
        backgroundColor={darkMode ? "#111827" : "#0284C7"}
      />

      <View className={`${headerBgClass} p-4`}>
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/30 shadow"
            onPress={() => setShowDrawer(true)}
          >
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-white/20 mr-2"
              onPress={() =>
                setDisplayCurrency((c) => (c === "USD" ? "VES" : "USD"))
              }
            >
              <Text className="text-white font-semibold">
                {displayCurrency === "USD" ? "$ USD" : "Bs."}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-white/20"
              onPress={toggleTheme}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={darkMode ? "sunny" : "moon"}
                  size={16}
                  color="#fff"
                />
                <Text className="text-white" style={{ marginLeft: 6 }}>
                  {darkMode ? "Claro" : "Oscuro"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-white text-xl font-bold text-center">
          Control de Gastos
        </Text>
        <Text className="text-white text-center mt-1">
          Tasa del día: {tasaDolar ? `Bs. ${tasaDolar} / $1` : "No establecida"}
        </Text>
        {activeView === "home" && (
          <>
            <View className="flex-row justify-center mt-2">
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "week"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("week")}
              >
                <Text
                  className={
                    viewMode === "week" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "month"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("month")}
              >
                <Text
                  className={
                    viewMode === "month" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Mes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "year"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("year")}
              >
                <Text
                  className={
                    viewMode === "year" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Año
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <TouchableOpacity
                className="px-3 py-1 rounded bg-white/20"
                onPress={() => changePeriod(-1)}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (viewMode !== "month") return;
                  const [y, m] = currentMonth.split("-").map(Number);
                  setTempYear(y);
                  setTempMonthIndex(m - 1);
                  setShowMonthModal(true);
                }}
              >
                <Text className="text-white font-semibold">
                  {periodLabel()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-1 rounded bg-white/20"
                onPress={() => changePeriod(1)}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {activeView === "home" && (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item, index) =>
            item && item.id != null
              ? String(item.id)
              : `${item?.fecha || "row"}-${index}`
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            <View>
              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
                  Gastos por categoría
                </Text>
                <View className={`rounded-lg p-4 shadow-lg ${cardBgClass}`}>
                  {totalGastosVES <= 0 ? (
                    <Text className={textMuted}>
                      Sin gastos en este periodo
                    </Text>
                  ) : (
                    <>
                      <View className="items-center mb-3">
                        <View style={{ width: 220, height: 220 }}>
                          <Svg
                            width={220}
                            height={220}
                            style={{ position: "absolute", left: 0, top: 0 }}
                          >
                            <G>
                              <Circle
                                cx={cx}
                                cy={cy}
                                r={radius}
                                stroke={donutTrackColor}
                                strokeWidth={donutThickness}
                                fill="none"
                              />
                              {pieSegments.map((seg) => (
                                <Path
                                  key={seg.key}
                                  d={seg.d}
                                  fill={seg.color}
                                />
                              ))}
                              <Circle
                                cx={cx}
                                cy={cy}
                                r={centerR}
                                fill={donutCenterFill}
                              />
                            </G>
                          </Svg>
                          <View
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              right: 0,
                              bottom: 0,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {displayCurrency === "USD" ? (
                              <Text
                                style={{
                                  color: darkMode ? "#ffffff" : "#111827",
                                  fontSize: 18,
                                  fontWeight: "700",
                                }}
                              >
                                $ {Number(totalGastosUSD || 0).toFixed(2)}
                              </Text>
                            ) : (
                              <Text
                                style={{
                                  color: darkMode ? "#ffffff" : "#111827",
                                  fontSize: 18,
                                  fontWeight: "700",
                                }}
                              >
                                Bs. {Number(totalGastosVES || 0).toFixed(2)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View>
                        {pieSegments.slice(0, 8).map((seg) => (
                          <View
                            key={`legend-${seg.key}`}
                            className="flex-row items-center mb-1"
                          >
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: seg.color,
                              }}
                            />
                            <Text className={`ml-2 ${textPrimary}`}>
                              {seg.label}
                            </Text>
                            <Text className={`ml-auto ${textMuted}`}>
                              {displayCurrency === "USD"
                                ? `$ ${Number(seg.usd || 0).toFixed(2)}`
                                : `Bs. ${Number(seg.ves || 0).toFixed(2)}`}
                              {" "}• {seg.pct.toFixed(0)}%
                            </Text>
                          </View>
                        ))}
                        {pieSegments.length > 8 && (
                          <Text className={`${textMuted} mt-1`}>
                            + {pieSegments.length - 8} más
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
                  {viewMode === "month"
                    ? "Resumen del Mes"
                    : viewMode === "year"
                    ? "Resumen del Año"
                    : "Resumen de la Semana"}
                </Text>
                <View className={`rounded-lg p-4 shadow-lg ${cardBgClass}`}>
                  <View className="flex-row justify-between mb-2">
                    <Text className={textPrimary}>Ingresos:</Text>
                    <View className="items-end">
                      <Text className="text-green-600">
                        {displayCurrency === "USD"
                          ? `$ ${totales.ingresosUSD}`
                          : `Bs. ${totales.ingresosVES}`}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={exceededLimit ? "text-red-600" : textPrimary}
                    >
                      Gastos:
                    </Text>
                    <View className="items-end">
                      <Text className="text-red-600">
                        {displayCurrency === "USD"
                          ? `$ ${totales.gastosUSD}`
                          : `Bs. ${totales.gastosVES}`}
                      </Text>
                    </View>
                  </View>
                  <View className={`border-t ${borderMutedClass} my-2`} />
                  <View className="flex-row justify-between">
                    <Text className={`font-bold ${textPrimary}`}>Balance:</Text>
                    <View className="items-end">
                      <Text
                        className={
                          parseFloat(
                            displayCurrency === "USD"
                              ? totales.balanceUSD
                              : totales.balanceVES
                          ) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {displayCurrency === "USD"
                          ? `$ ${totales.balanceUSD}`
                          : `Bs. ${totales.balanceVES}`}
                      </Text>
                    </View>
                  </View>
                </View>
                {exceededLimit &&
                  (viewMode === "week" || viewMode === "month") && (
                    <View
                      className={`mt-2 rounded-lg border p-3 ${warnBgClass}`}
                    >
                      <Text className={`${warnTextClass} font-semibold`}>
                        Excediste el limite ({limitName})
                      </Text>
                      <Text className={`${warnTextClass} mt-1 text-sm`}>
                        Categorías: {exceededCategories.join(", ")}
                      </Text>
                    </View>
                  )}
              </View>

              <View className="px-4 mb-2 flex-row justify-between items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>
                  Transacciones
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className={`${smallBtnBgClass} px-3 py-2 rounded mr-2`}
                    onPress={() =>
                      setTxFilter((prev) =>
                        prev === "todo"
                          ? "gastos"
                          : prev === "gastos"
                          ? "ingresos"
                          : "todo"
                      )
                    }
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name={
                          txFilter === "gastos"
                            ? "trending-down"
                            : txFilter === "ingresos"
                            ? "trending-up"
                            : "swap-horizontal"
                        }
                        size={16}
                        color={darkMode ? "#fff" : "#111827"}
                      />
                      <Text className={textPrimary} style={{ marginLeft: 6 }}>
                        {txFilter === "gastos"
                          ? "Gastos"
                          : txFilter === "ingresos"
                          ? "Ingresos"
                          : "Todo"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`${smallBtnBgClass} px-3 py-2 rounded mr-2`}
                    onPress={() => setShowSearchModal(true)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="search"
                        size={16}
                        color={darkMode ? "#fff" : "#111827"}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`${accentBtnClass} px-4 py-2.5 rounded-full shadow-md`}
                    style={{ elevation: 2 }}
                    onPress={() => setShowAddModal(true)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text className="text-white" style={{ marginLeft: 6 }}>
                        Nueva
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="px-4 py-10 items-center">
              <Text className={textMuted}>
                No hay transacciones registradas
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className={`px-4`}>
              <View
                className={`p-3 mb-2 rounded-lg shadow overflow-hidden ${cardBgClass}`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: getCategoryColor(item.categoria, item.tipo),
                }}
              >
                <View className="flex-row justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center">
                      <Ionicons
                        name={getCategoryIcon(item.categoria, item.tipo)}
                        size={16}
                        color={getCategoryColor(item.categoria, item.tipo)}
                      />
                      <Text
                        className={`font-medium ${textPrimary}`}
                        style={{ marginLeft: 6 }}
                      >
                        {item.descripcion}
                      </Text>
                    </View>
                    <Text className={`${textMuted} text-sm`}>
                      {formatearFecha(item.fecha)}
                    </Text>
                    <Text className={`${textMuted} text-xs`}>
                      {item.categoria ??
                        (item.tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")}
                    </Text>
                  </View>
                  <View className="items-end" style={{ width: "40%" }}>
                    <Text
                      className={`text-right ${
                        item.tipo === "Ingreso"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.tipo === "Ingreso" ? "+" : "-"}{" "}
                      {displayCurrency === "USD" ? "$" : "Bs."}{" "}
                      {Number(
                        displayCurrency === "USD"
                          ? item.monto_usd_registro
                          : item.monto_ves_registro
                      ).toFixed(2)}
                    </Text>
                    <Text className="text-gray-500 text-xs text-right">
                      {displayCurrency === "USD"
                        ? `Bs. ${Number(item.monto_ves_registro).toFixed(2)}`
                        : `$ ${Number(item.monto_usd_registro).toFixed(2)}`}
                    </Text>
                    {item.tasa_ves_a_usd != null && (
                      <Text className="text-gray-500 text-xs text-right">
                        Tasa: Bs. {parseFloat(item.tasa_ves_a_usd).toFixed(2)} /
                        $1
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
      {activeView === "charts" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="p-4">
            <LineEvolutionChart
                lineChartData={lineChartData}
                chartPeriod={chartPeriod}
                setChartPeriod={setChartPeriod}
                selectedLineIndex={selectedLineIndex}
                setSelectedLineIndex={setSelectedLineIndex}
                darkMode={darkMode}
                textPrimary={textPrimary}
                textMuted={textMuted}
                borderMutedClass={borderMutedClass}
                cardBgClass={cardBgClass}
                formatUsd={formatUsd}
                COLOR_GASTOS={COLOR_GASTOS}
                COLOR_GASTOS_ALT={COLOR_GASTOS_ALT}
                COLOR_INGRESOS={COLOR_INGRESOS}
                COLOR_INGRESOS_ALT={COLOR_INGRESOS_ALT}
              />

            <CategoryTopList
              categoryChartData={categoryChartData}
              selectedCategoryIndex={selectedCategoryIndex}
              setSelectedCategoryIndex={setSelectedCategoryIndex}
              categoryMaxValue={categoryMaxValue}
              chartCategoryMode={chartCategoryMode}
              setChartCategoryMode={setChartCategoryMode}
              cardBgClass={cardBgClass}
              textPrimary={textPrimary}
              textMuted={textMuted}
              barTrackClass={barTrackClass}
              darkMode={darkMode}
              COLOR_GASTOS={COLOR_GASTOS}
              COLOR_INGRESOS={COLOR_INGRESOS}
              formatUsd={formatUsd}
            />

            <DonutCategoriesChart
              chartPieMode={chartPieMode}
              setChartPieMode={setChartPieMode}
              chartPieSegments={chartPieSegments}
              pieTotal={pieChartData.total}
              selectedPieIndex={selectedPieIndex}
              setSelectedPieIndex={setSelectedPieIndex}
              cardBgClass={cardBgClass}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
              formatUsd={formatUsd}
            />

            <AmountBucketsChart
              amountBucketData={amountBucketData}
              selectedBucketIndex={selectedBucketIndex}
              setSelectedBucketIndex={setSelectedBucketIndex}
              bucketMaxValue={bucketMaxValue}
              chartBucketMode={chartBucketMode}
              setChartBucketMode={setChartBucketMode}
              cardBgClass={cardBgClass}
              textPrimary={textPrimary}
              textMuted={textMuted}
              barTrackClass={barTrackClass}
              borderMutedClass={borderMutedClass}
              darkMode={darkMode}
              COLOR_GASTOS={COLOR_GASTOS}
              COLOR_INGRESOS={COLOR_INGRESOS}
            />

            <HeatmapChart
              heatmapMatrix={heatmapMatrix}
              heatmapMax={heatmapMax}
              chartHeatmapMode={chartHeatmapMode}
              setChartHeatmapMode={setChartHeatmapMode}
              selectedHeatmapCell={selectedHeatmapCell}
              setSelectedHeatmapCell={setSelectedHeatmapCell}
              WEEKDAY_LABELS={WEEKDAY_LABELS}
              AMOUNT_BUCKETS={AMOUNT_BUCKETS}
              cardBgClass={cardBgClass}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
              COLOR_GASTOS={COLOR_GASTOS}
              COLOR_INGRESOS={COLOR_INGRESOS}
              formatUsd={formatUsd}
            />
          </View>
        </ScrollView>
      )}
      {activeView === "limits" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="p-4">
            <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
              Límites por categoría
            </Text>
            {CATEGORIES.map((cat) => {
              const v = limitsByCategory[cat] || {
                diario: "",
                semanal: "",
                mensual: "",
              };
              return (
                <View
                  key={cat}
                  className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}
                >
                  <Text className={`font-medium mb-2 ${textPrimary}`}>
                    {cat}
                  </Text>
                  <View className="flex-row -mx-1">
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Diario ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.diario}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              diario: t,
                            },
                          }))
                        }
                      />
                    </View>
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Semanal ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.semanal}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              semanal: t,
                            },
                          }))
                        }
                      />
                    </View>
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Mensual ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.mensual}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              mensual: t,
                            },
                          }))
                        }
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-2 rounded`}
                onPress={saveLimits}
              >
                <View className="flex-row items-center">
                  <Ionicons name="save" size={18} color="#fff" />
                  <Text className="text-white" style={{ marginLeft: 6 }}>
                    Guardar Límites
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
      {activeView === "categories" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="p-4">
            <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
              Categorías
            </Text>
            <View className="flex-row justify-center mb-3">
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "week" ? chipSelectedBgBorder : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("week")}
              >
                <Text
                  className={
                    viewMode === "week" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "month" ? chipSelectedBgBorder : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("month")}
              >
                <Text
                  className={
                    viewMode === "month" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Mes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-4 py-2 rounded-full border shadow-sm ${
                  viewMode === "year" ? chipSelectedBgBorder : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("year")}
              >
                <Text
                  className={
                    viewMode === "year" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Año
                </Text>
              </TouchableOpacity>
            </View>
            <View className={`rounded-lg p-2 ${cardBgClass}`}>
              {categoryTotals.length === 0 ? (
                <Text className={textMuted}>Sin datos para este periodo</Text>
              ) : (
                categoryTotals
                  .slice()
                  .sort((a, b) => {
                    const va =
                      displayCurrency === "USD"
                        ? Number(a.totalUSD || 0)
                        : Number(a.totalVES || 0);
                    const vb =
                      displayCurrency === "USD"
                        ? Number(b.totalUSD || 0)
                        : Number(b.totalVES || 0);
                    return vb - va;
                  })
                  .map((row) => {
                    const color = getCategoryColor(row.categoria, "Gasto");
                    const icon = getCategoryIcon(row.categoria, "Gasto");
                    const maxVal = Math.max(
                      0,
                      ...categoryTotals.map((r) =>
                        Number(
                          displayCurrency === "USD"
                            ? r.totalUSD || 0
                            : r.totalVES || 0
                        )
                      )
                    );
                    const val = Number(
                      displayCurrency === "USD"
                        ? row.totalUSD || 0
                        : row.totalVES || 0
                    );
                    const pct = maxVal > 0 ? Math.min(100, (val / maxVal) * 100) : 0;
                    return (
                      <View key={`catbar-${row.categoria}`} className="mb-3">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name={icon} size={18} color={color} />
                          <Text className={`ml-2 ${textPrimary}`}>
                            {row.categoria}
                          </Text>
                          <Text className={`ml-auto ${textPrimary}`}>
                            {displayCurrency === "USD"
                              ? `$ ${Number(row.totalUSD || 0).toFixed(2)}`
                              : `Bs. ${Number(row.totalVES || 0).toFixed(2)}`}
                          </Text>
                        </View>
                        <View className={`h-3 rounded-full ${barTrackClass}`}>
                          <View
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                              height: "100%",
                              borderRadius: 9999,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })
              )}
            </View>
          </View>
        </ScrollView>
      )}
      {activeView === "credits" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="p-4">
            {!selectedCredit ? (
              <>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className={`text-lg font-bold ${textPrimary}`}>
                    Créditos
                  </Text>
                  <TouchableOpacity
                    className={`${accentBtnClass} px-4 py-2 rounded`}
                    onPress={() => setShowCreateCreditModal(true)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text className="text-white" style={{ marginLeft: 6 }}>
                        Nuevo
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {credits.length === 0 ? (
                  <Text className={textMuted}>No hay créditos</Text>
                ) : (
                  credits.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}
                      onPress={() => openCredit(c)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="card"
                          size={18}
                          color={darkMode ? "#93c5fd" : "#2563eb"}
                        />
                        <Text className={`ml-2 font-medium ${textPrimary}`}>
                          {c.nombre}
                        </Text>
                        <Text className={`ml-auto ${textMuted}`}>
                          {c.cuotas_pagadas}/{c.cuotas_total}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className={`${textMuted} text-xs`}>
                          Creado: {formatearFecha(c.fecha_creacion)}
                        </Text>
                        <Text
                          className={`text-xs ${
                            c.estado === "pagado" ? "text-green-600" : textMuted
                          }`}
                        >
                          {c.estado || "activo"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <View className="flex-row justify-between items-center mb-2">
                  <TouchableOpacity
                    className={`${smallBtnBgClass} px-3 py-2 rounded`}
                    onPress={backToCreditsList}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color={darkMode ? "#fff" : "#111827"}
                      />
                      <Text className={textPrimary} style={{ marginLeft: 6 }}>
                        Volver
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text className={`text-lg font-bold ${textPrimary}`}>
                    {selectedCredit.nombre}
                  </Text>
                  <View style={{ width: 80 }} />
                </View>
                <View className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}>
                  <View className="flex-row justify-between">
                    <Text className={textPrimary}>Cuotas</Text>
                    <Text className={textMuted}>
                      {
                        creditInstallments.filter((i) => i.estado === "pagado")
                          .length
                      }
                      /{creditInstallments.length}
                    </Text>
                  </View>
                </View>
                {creditInstallments.map((i) => (
                  <View
                    key={i.id}
                    className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        {i.estado === "pagado" ? (
                          <Ionicons
                            name="checkbox"
                            size={18}
                            color={darkMode ? "#34d399" : "#059669"}
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() => toggleInstallmentSelection(i.id)}
                          >
                            <Ionicons
                              name={
                                selectedInstallments[i.id]
                                  ? "checkbox"
                                  : "square-outline"
                              }
                              size={18}
                              color={darkMode ? "#fff" : "#111827"}
                            />
                          </TouchableOpacity>
                        )}
                        <Text className={`ml-2 ${textPrimary}`}>
                          Cuota #{i.numero}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className={textPrimary}>
                          $ {Number(i.monto_usd || 0).toFixed(2)}
                        </Text>
                        <Text className={`${textMuted} text-xs`}>
                          {i.estado === "pagado"
                            ? "Pagada"
                            : `Vence: ${formatearFecha(i.fecha_programada)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity
                    className={`${smallBtnBgClass} px-4 py-2 rounded`}
                    onPress={() => paySelectedInstallments(false)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="cash"
                        size={16}
                        color={darkMode ? "#fff" : "#111827"}
                      />
                      <Text className={textPrimary} style={{ marginLeft: 6 }}>
                        Pagar seleccionadas
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`${accentBtnClass} px-4 py-2 rounded`}
                    onPress={() => paySelectedInstallments(true)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-done" size={18} color="#fff" />
                      <Text className="text-white" style={{ marginLeft: 6 }}>
                        Pagar todas
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      <TasaDelDiaModal
        visible={showTasaModal}
        tasaDolar={tasaDolar}
        setTasaDolar={setTasaDolar}
        onSave={guardarTasaDia}
        modalBgClass={modalBgClass}
        inputBgClass={inputBgClass}
        inputBorderClass={inputBorderClass}
        inputTextClass={inputTextClass}
        placeholderColor={placeholderColor}
        accentBtnClass={accentBtnClass}
        textPrimary={textPrimary}
        darkMode={darkMode}
        fetchingAuto={isFetchingOfficialRate}
        onFetchAuto={fetchOfficialRate}
        fetchError={officialRateError}
      />

      <CreateCreditModal
        visible={showCreateCreditModal}
        newCredit={newCredit}
        setNewCredit={setNewCredit}
        onCancel={() => setShowCreateCreditModal(false)}
        onCreate={createCredit}
        darkMode={darkMode}
        modalBgClass={modalBgClass}
        textPrimary={textPrimary}
        textMuted={textMuted}
        inputBgClass={inputBgClass}
        inputBorderClass={inputBorderClass}
        inputTextClass={inputTextClass}
        placeholderColor={placeholderColor}
        smallBtnBgClass={smallBtnBgClass}
        accentBtnClass={accentBtnClass}
        chipSelectedBgBorder={chipSelectedBgBorder}
        chipUnselectedBgBorder={chipUnselectedBgBorder}
        chipSelectedText={chipSelectedText}
        chipUnselectedText={chipUnselectedText}
        planDays={CREDIT_PLAN_DAYS}
      />

      <Modal visible={showDrawer} animationType="fade" transparent>
        <View className="flex-1 flex-row">
          <View className={`${modalBgClass} w-64 h-full p-6`}>
            <View className="items-center mb-4">
              <Image
                source={require("./assets/images/logo.png")}
                style={{ width: 96, height: 96 }}
                resizeMode="contain"
              />
              <Text
                className={`text-xl font-bold mt-2 ${textPrimary}`}
                style={{ fontFamily: fontsLoaded ? "Righteous_400Regular" : undefined }}
              >
                ANZU
              </Text>
            </View>
            <Text className={`text-lg font-bold mb-4 ${textPrimary}`}>
              Menú
            </Text>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "home" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("home");
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="home"
                  size={18}
                  color={
                    activeView === "home"
                      ? "#fff"
                      : darkMode
                      ? "#fff"
                      : "#111827"
                  }
                />
                <Text
                  className={activeView === "home" ? "text-white" : textPrimary}
                  style={{ marginLeft: 8 }}
                >
                  Home
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "charts" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("charts");
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="analytics"
                  size={18}
                  color={
                    activeView === "charts"
                      ? "#fff"
                      : darkMode
                      ? "#fff"
                      : "#111827"
                  }
                />
                <Text
                  className={
                    activeView === "charts" ? "text-white" : textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Gráficos
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "categories" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("categories");
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="pricetags"
                  size={18}
                  color={
                    activeView === "categories"
                      ? "#fff"
                      : darkMode
                      ? "#fff"
                      : "#111827"
                  }
                />
                <Text
                  className={
                    activeView === "categories" ? "text-white" : textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Categorías
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "limits" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("limits");
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="speedometer"
                  size={18}
                  color={
                    activeView === "limits"
                      ? "#fff"
                      : darkMode
                      ? "#fff"
                      : "#111827"
                  }
                />
                <Text
                  className={
                    activeView === "limits" ? "text-white" : textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Límites
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "credits" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("credits");
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="card"
                  size={18}
                  color={
                    activeView === "credits"
                      ? "#fff"
                      : darkMode
                      ? "#fff"
                      : "#111827"
                  }
                />
                <Text
                  className={
                    activeView === "credits" ? "text-white" : textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Créditos
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${smallBtnBgClass}`}
              onPress={async () => {
                await checkTasaDia();
                setOfficialRateError(null);
                setShowTasaModal(true);
                setShowDrawer(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="cash"
                  size={18}
                  color={darkMode ? "#fff" : "#111827"}
                />
                <Text className={textPrimary} style={{ marginLeft: 8 }}>
                  Tasa del día
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${smallBtnBgClass}`}
              onPress={() => {
                setShowDataModal(true);
                setShowDrawer(false);
              }}
              disabled={backupBusy}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="save"
                  size={18}
                  color={darkMode ? "#fff" : "#111827"}
                />
                <Text className={textPrimary} style={{ marginLeft: 8 }}>
                  Datos
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={() => setShowDrawer(false)}
          />
        </View>
      </Modal>
      <AddTransactionModal
        visible={showAddModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onCancel={() => setShowAddModal(false)}
        onSave={agregarTransaccion}
        CATEGORIES={CATEGORIES}
        darkMode={darkMode}
        modalBgClass={modalBgClass}
        textPrimary={textPrimary}
        textMuted={textMuted}
        inputBgClass={inputBgClass}
        inputBorderClass={inputBorderClass}
        inputTextClass={inputTextClass}
        placeholderColor={placeholderColor}
        smallBtnBgClass={smallBtnBgClass}
        minorBtnBgClass={minorBtnBgClass}
        accentBtnClass={accentBtnClass}
        chipSelectedBgBorder={chipSelectedBgBorder}
        chipUnselectedBgBorder={chipUnselectedBgBorder}
        chipSelectedText={chipSelectedText}
        chipUnselectedText={chipUnselectedText}
      />
      <DataModal
        visible={showDataModal}
        backupBusy={backupBusy}
        backupMessage={backupMessage}
        exportDatabase={exportDatabase}
        importDatabase={importDatabase}
        onClose={() => {
          if (!backupBusy) setShowDataModal(false);
        }}
        darkMode={darkMode}
        modalBgClass={modalBgClass}
        accentBtnClass={accentBtnClass}
        smallBtnBgClass={smallBtnBgClass}
        minorBtnBgClass={minorBtnBgClass}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />
      <SearchTransactionsModal
        visible={showSearchModal}
        searchDescription={searchDescription}
        setSearchDescription={setSearchDescription}
        searchMinAmount={searchMinAmount}
        setSearchMinAmount={setSearchMinAmount}
        searchMaxAmount={searchMaxAmount}
        setSearchMaxAmount={setSearchMaxAmount}
        searchStartDate={searchStartDate}
        setSearchStartDate={setSearchStartDate}
        searchEndDate={searchEndDate}
        setSearchEndDate={setSearchEndDate}
        onClean={resetTransactionSearch}
        onCancel={() => setShowSearchModal(false)}
        onApply={applyTransactionSearch}
        modalBgClass={modalBgClass}
        inputBgClass={inputBgClass}
        inputBorderClass={inputBorderClass}
        inputTextClass={inputTextClass}
        placeholderColor={placeholderColor}
        minorBtnBgClass={minorBtnBgClass}
        smallBtnBgClass={smallBtnBgClass}
        accentBtnClass={accentBtnClass}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MonthPickerModal
        visible={showMonthModal}
        tempYear={tempYear}
        setTempYear={setTempYear}
        tempMonthIndex={tempMonthIndex}
        setTempMonthIndex={setTempMonthIndex}
        MONTHS={MONTHS}
        onCancel={() => setShowMonthModal(false)}
        onApply={() => {
          const ym = `${tempYear}-${pad2(tempMonthIndex + 1)}`;
          setCurrentMonth(ym);
          setShowMonthModal(false);
        }}
        modalBgClass={modalBgClass}
        accentBtnClass={accentBtnClass}
        darkMode={darkMode}
      />

    </SafeAreaView>
  );
}
