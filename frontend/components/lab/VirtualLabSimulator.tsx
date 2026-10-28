"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Zap,
  Waves,
  Eye,
  Thermometer,
  RotateCcw,
  Play,
  Pause,
  Download,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  HelpCircle,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Magnet,
  Leaf,
  Sun,
  Flame,
  Timer,
  Search,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchLabModels,
  translateLabTexts,
  uploadLabModel,
  type LabModelRecord,
} from "@/lib/api";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";

// ============================================================================
// SOUND SYNTHESIZER (Web Audio API - Không cần tải file ngoài)
// ============================================================================
function playLabSound(type: "click" | "bubble" | "laser" | "splash" | "beep") {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "bubble") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "laser") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "splash") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "beep") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046, now); // C6 note
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

// ============================================================================
// LAB LESSON DEFINITIONS (Chương trình Kết Nối Tri Thức Với Cuộc Sống)
// ============================================================================
export interface LabExperiment {
  id: string;
  title: string;
  titleEn: string;
  subject: "physics" | "chemistry" | "biology";
  grade: "6" | "7" | "8" | "9";
  textbookRef: string;
  summary: string;
  summaryEn: string;
  badge: string;
  apparatus: string[];
  steps: string[];
  bilingualVocabulary: { vi: string; en: string; ipa: string }[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

type LabDisplayMode = "vi" | "en" | "both";

function LabTranslatableText({
  text,
  displayMode,
  translation,
  className,
}: {
  text: string;
  displayMode: LabDisplayMode;
  translation?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {displayMode !== "en" || !translation ? (
        <span>{text}</span>
      ) : null}
      {displayMode === "both" && translation ? (
        <span className="mt-1 block text-sky-700 dark:text-sky-300">
          {translation}
        </span>
      ) : null}
      {displayMode === "en" && translation ? <span>{translation}</span> : null}
    </span>
  );
}

export const KNTT_EXPERIMENTS: LabExperiment[] = [
  {
    id: "ohm_circuit",
    title: "Thí nghiệm Định luật Ôm & Khảo sát Mạch điện",
    titleEn: "Ohm's Law & Circuit Analysis Simulation",
    subject: "physics",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 16: Mạch điện cơ bản)",
    summary: "Khảo sát mối liên hệ tỉ lệ thuận giữa cường độ dòng điện (I) và hiệu điện thế (U), tỉ lệ nghịch với điện trở (R).",
    summaryEn: "Investigate how current (I) is directly proportional to voltage (U) and inversely proportional to resistance (R).",
    badge: "KHTN 8 KNTT",
    apparatus: ["Nguồn điện DC biến thiên (0 - 24V)", "Biến trở mẫu R (1 - 50Ω)", "Vôn kế đo điện áp", "Ampe kế đo dòng", "Bóng đèn sợi đốt", "Công tắc"],
    steps: [
      "Bước 1: Bật công tắc đóng mạch (Switch ON).",
      "Bước 2: Kéo thanh trượt điều chỉnh Hiệu điện thế nguồn (U).",
      "Bước 3: Điều chỉnh biến trở (R) và quan sát độ sáng của bóng đèn dây tóc.",
      "Bước 4: Nhấn 'Ghi số liệu' để lưu giá trị vào bảng thực nghiệm kiểm chứng I = U / R."
    ],
    bilingualVocabulary: [
      { vi: "Hiệu điện thế (Điện áp)", en: "Voltage", ipa: "/ˈvoʊltɪdʒ/" },
      { vi: "Cường độ dòng điện", en: "Electric Current", ipa: "/ɪˈlɛktrɪk ˈkɜːrənt/" },
      { vi: "Điện trở", en: "Resistance", ipa: "/rɪˈzɪstəns/" },
      { vi: "Định luật Ôm", en: "Ohm's Law", ipa: "/oʊmz lɔː/" },
    ],
    quiz: {
      question: "Khi giữ nguyên điện trở R = 10Ω, nếu tăng hiệu điện thế U từ 6V lên 12V thì cường độ dòng điện I sẽ thay đổi thế nào?",
      options: ["Giảm đi một nửa", "Tăng gấp đôi", "Không đổi", "Tăng gấp 4 lần"],
      correct: 1,
      explanation: "Theo định luật Ôm I = U / R. Khi R không đổi, I tỉ lệ thuận với U, nên khi U tăng gấp đôi thì I cũng tăng gấp đôi."
    }
  },
  {
    id: "archimedes_buoyancy",
    title: "Thí nghiệm Lực đẩy Ác-si-mét & Sự chìm nổi",
    titleEn: "Archimedes' Principle & Buoyancy Lab",
    subject: "physics",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 14: Lực đẩy Ác-si-mét)",
    summary: "Đo độ lớn lực đẩy Ác-si-mét tác dụng lên vật nhúng chìm trong chất lỏng, kiểm chứng điều kiện vật chìm, lơ lửng hoặc nổi.",
    summaryEn: "Verify that buoyant force equals the weight of displaced liquid, and investigate floating and sinking conditions.",
    badge: "KHTN 8 KNTT",
    apparatus: ["Bình chia độ thủy tinh (ml)", "Lực kế lò xo (N)", "Vật mẫu: Sắt, Nhôm, Gỗ", "Chất lỏng: Nước, Nước muối, Dầu ăn"],
    steps: [
      "Bước 1: Chọn vật liệu của vật nặng (Sắt, Nhôm hoặc Gỗ).",
      "Bước 2: Chọn chất lỏng khảo sát (Nước cất, Nước muối, Dầu).",
      "Bước 3: Kéo thanh trượt hạ vật chìm dần vào lòng chất lỏng.",
      "Bước 4: Quan sát mực nước dâng lên bằng đúng thể tích vật chiếm chỗ và số chỉ lực kế giảm dần do lực đẩy Fa."
    ],
    bilingualVocabulary: [
      { vi: "Lực đẩy Ác-si-mét", en: "Archimedes Buoyant Force", ipa: "/ˌɑːrkɪˈmiːdiːz ˈbɔɪənsi fɔːrs/" },
      { vi: "Thể tích chất lỏng chiếm chỗ", en: "Displaced Volume", ipa: "/dɪsˈpleɪst ˈvɑːljuːm/" },
      { vi: "Lực kế", en: "Spring Dynamometer", ipa: "/sprɪŋ ˌdaɪnəˈmɑːmɪtər/" },
      { vi: "Trọng lượng riêng", en: "Specific Weight", ipa: "/spəˈsɪfɪk weɪt/" },
    ],
    quiz: {
      question: "Lực đẩy Ác-si-mét tác dụng lên vật có phương và chiều như thế nào?",
      options: ["Phương thẳng đứng, chiều từ dưới lên trên", "Phương thẳng đứng, chiều từ trên xuống dưới", "Phương nằm ngang", "Theo mọi hướng vuông góc"],
      correct: 0,
      explanation: "Lực đẩy Ác-si-mét luôn có phương thẳng đứng, chiều từ dưới lên trên, ngược chiều với trọng lực."
    }
  },
  {
    id: "chemical_mass_conservation",
    title: "Thí nghiệm Định luật Bảo toàn Khối lượng",
    titleEn: "Law of Conservation of Mass Lab",
    subject: "chemistry",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 2: Phản ứng hóa học)",
    summary: "Thực hiện phản ứng giữa BaCl2 và Na2SO4 tạo kết tủa trắng BaSO4 trên cân điện tử để chứng minh tổng khối lượng không đổi.",
    summaryEn: "Mix BaCl2 and Na2SO4 solutions on a digital balance to observe white precipitation while mass remains constant.",
    badge: "KHTN 8 KNTT",
    apparatus: ["Cân điện tử độ chính xác 0.01g", "Cốc thủy tinh chứa BaCl2", "Ống nghiệm chứa Na2SO4", "Dung dịch chỉ thị"],
    steps: [
      "Bước 1: Đặt hai dung dịch lên cân điện tử, đọc tổng khối lượng ban đầu.",
      "Bước 2: Nhấn 'Rót & Phản ứng' để trộn dung dịch BaCl2 vào Na2SO4.",
      "Bước 3: Quan sát hiện tượng xuất hiện kết tủa trắng Bari sunfat (BaSO4).",
      "Bước 4: Kiểm tra số đo trên cân điện tử trước và sau phản ứng để rút ra định luật."
    ],
    bilingualVocabulary: [
      { vi: "Định luật bảo toàn khối lượng", en: "Conservation of Mass", ipa: "/ˌkɑːnsərˈveɪʃn əv mæs/" },
      { vi: "Chất kết tủa", en: "Precipitate", ipa: "/prɪˈsɪpɪteɪt/" },
      { vi: "Chất phản ứng", en: "Reactants", ipa: "/riˈæktənts/" },
      { vi: "Sản phẩm phản ứng", en: "Products", ipa: "/ˈprɑːdʌkts/" },
    ],
    quiz: {
      question: "Phương trình chữ của phản ứng hóa học trong thí nghiệm này là gì?",
      options: [
        "Bari clorua + Natri sunfat -> Bari sunfat (kết tủa) + Natri clorua",
        "Bari sunfat + Nước -> Bari oxit + Axit sunfuric",
        "Natri clorua + Bari -> Natri sunfat",
        "Axit clohidric + Natri -> Khí hydro"
      ],
      correct: 0,
      explanation: "BaCl2 + Na2SO4 -> BaSO4 (kết tủa trắng) + 2NaCl. Tổng khối lượng các chất tham gia bằng tổng khối lượng sản phẩm."
    }
  },
  {
    id: "optics_refraction",
    title: "Thí nghiệm Khúc xạ Ánh sáng & Lăng kính",
    titleEn: "Light Refraction & Prism Dispersion Lab",
    subject: "physics",
    grade: "9",
    textbookRef: "SGK Khoa học tự nhiên 9 - Kết Nối Tri Thức (Bài 5: Hiện tượng khúc xạ ánh sáng)",
    summary: "Chiếu tia sáng từ không khí vào khối bán nguyệt thủy tinh, quan sát tia khúc xạ, hiện tượng phản xạ toàn phần và tán sắc.",
    summaryEn: "Investigate Snell's refraction law, critical angle, total internal reflection, and prism dispersion.",
    badge: "KHTN 9 KNTT",
    apparatus: ["Đèn chiếu Laser đơn sắc & ánh sáng trắng", "Khối bán nguyệt thủy tinh n=1.5", "Lăng kính tam giác", "Đĩa tròn chia độ 360°"],
    steps: [
      "Bước 1: Chọn loại nguồn sáng (Laser đỏ, Laser xanh lục, hoặc Ánh sáng trắng).",
      "Bước 2: Xoay góc tới (i) từ 0° đến 85° trên đĩa chia độ.",
      "Bước 3: Quan sát góc khúc xạ (r) bẻ cong theo định luật Snell: n1*sin(i) = n2*sin(r).",
      "Bước 4: Chuyển sang chế độ Lăng kính để xem hiện tượng tán sắc thành dải 7 màu cầu vồng."
    ],
    bilingualVocabulary: [
      { vi: "Khúc xạ ánh sáng", en: "Refraction", ipa: "/rɪˈfrækʃn/" },
      { vi: "Góc tới & Góc khúc xạ", en: "Angle of Incidence & Refraction", ipa: "/ˈæŋɡl əv ˈɪnsɪdəns/" },
      { vi: "Phản xạ toàn phần", en: "Total Internal Reflection", ipa: "/ˈtoʊtl ɪnˈtɜːrnl rɪˈflɛkʃn/" },
      { vi: "Tán sắc ánh sáng", en: "Dispersion of Light", ipa: "/dɪˈspɜːrʒn əv laɪt/" },
    ],
    quiz: {
      question: "Khi truyền tia sáng từ không khí vào thủy tinh với góc tới i > 0°, góc khúc xạ r so với góc tới i như thế nào?",
      options: ["Góc khúc xạ r luôn nhỏ hơn góc tới i (r < i)", "Góc khúc xạ r luôn lớn hơn góc tới i (r > i)", "Hai góc luôn bằng nhau (r = i)", "Tia sáng không bị đổi hướng"],
      correct: 0,
      explanation: "Do chiết suất của thủy tinh (n ≈ 1.5) lớn hơn không khí (n ≈ 1.0), tia sáng bị bẻ cong lại gần pháp tuyến hơn, nên r < i."
    }
  },
  {
    id: "fluid_pressure_vessels",
    title: "Thí nghiệm Áp suất Chất lỏng & Bình thông nhau",
    titleEn: "Fluid Pressure & Communicating Vessels Lab",
    subject: "physics",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 15: Áp suất chất lỏng)",
    summary: "Đo áp suất chất lỏng ở các độ sâu và hướng khác nhau qua áp kế chữ U, tìm hiểu nguyên lý bình thông nhau.",
    summaryEn: "Measure hydrostatic pressure p = d*h using a U-tube manometer and observe equal levels in communicating vessels.",
    badge: "KHTN 8 KNTT",
    apparatus: ["Bình trụ chứa chất lỏng có thước chia cm", "Đầu đo màng cao su", "Áp kế chữ U chứa chất lỏng chỉ thị", "Bộ bình thông nhau 3 nhánh"],
    steps: [
      "Bước 1: Kéo đầu đo xuống các độ sâu khác nhau (h) trong bình chất lỏng.",
      "Bước 2: Xoay hướng đầu đo (lên, xuống, ngang) để chứng minh áp suất tác dụng theo mọi hướng.",
      "Bước 3: Thay đổi loại chất lỏng (Nước, Dầu, Thủy ngân) để thấy áp suất phụ thuộc vào trọng lượng riêng d.",
      "Bước 4: Chuyển sang mô hình bình thông nhau để xem mực chất lỏng cân bằng."
    ],
    bilingualVocabulary: [
      { vi: "Áp suất chất lỏng", en: "Hydrostatic Pressure", ipa: "/ˌhaɪdrəʊˈstætɪk ˈprɛʃər/" },
      { vi: "Bình thông nhau", en: "Communicating Vessels", ipa: "/kəˈmjuːnɪkeɪtɪŋ ˈvɛslz/" },
      { vi: "Áp kế chữ U", en: "U-tube Manometer", ipa: "/juː tjuːb məˈnɑːmɪtər/" },
      { vi: "Độ sâu", en: "Liquid Depth", ipa: "/ˈlɪkwɪd dɛpθ/" },
    ],
    quiz: {
      question: "Công thức tính áp suất chất lỏng ở độ sâu h là gì?",
      options: ["p = d * h (hoặc p = ρ * g * h)", "p = F / S", "p = m * g", "p = d / h"],
      correct: 0,
      explanation: "Áp suất chất lỏng ở độ sâu h tỉ lệ thuận với trọng lượng riêng d của chất lỏng và độ sâu h: p = d * h."
    }
  },
  {
    id: "optics_convex_lens",
    title: "Thí nghiệm Thấu kính Hội tụ & Sự tạo ảnh",
    titleEn: "Convex Lens & Image Formation Lab",
    subject: "physics",
    grade: "9",
    textbookRef: "SGK Khoa học tự nhiên 9 - Kết Nối Tri Thức (Bài 6: Thấu kính hội tụ. Thực hành đo tiêu cự)",
    summary: "Khảo sát đường truyền 3 tia sáng đặc biệt qua thấu kính hội tụ, xác định vị trí ảnh d', ảnh thật ngược chiều hay ảnh ảo cùng chiều phóng đại.",
    summaryEn: "Investigate 3 principal rays, image formation 1/f = 1/d + 1/d', real vs virtual images, and optical magnification.",
    badge: "KHTN 9 KNTT",
    apparatus: ["Giá quang học & Thước milimet", "Thấu kính hội tụ tiêu cự f = 10cm / 15cm", "Nến sáng làm vật AB", "Màn hứng ảnh mờ"],
    steps: [
      "Bước 1: Chọn tiêu cự thấu kính f (10cm hoặc 15cm).",
      "Bước 2: Di chuyển vị trí ngọn nến sáng (d) trên trục chính: từ ngoài khoảng 2f, trong khoảng f đến 2f, và trong khoảng tiêu cự (d < f).",
      "Bước 3: Quan sát đường truyền 3 tia sáng đặc biệt: tia song song trục chính qua F', tia qua quang tâm O truyền thẳng, tia qua F ló song song.",
      "Bước 4: Kiểm tra màn hứng: khi d > f nhận được ảnh thật ngược chiều; khi d < f quan sát đường kéo dài tạo ảnh ảo cùng chiều lớn hơn vật."
    ],
    bilingualVocabulary: [
      { vi: "Thấu kính hội tụ", en: "Convex (Converging) Lens", ipa: "/ˈkɑːnvɛks lɛnz/" },
      { vi: "Tiêu điểm & Tiêu cự", en: "Focal Point & Focal Length", ipa: "/ˈfoʊkl lɛŋkθ/" },
      { vi: "Ảnh thật & Ảnh ảo", en: "Real Image & Virtual Image", ipa: "/ˈriːəl ˈɪmɪdʒ/" },
      { vi: "Độ phóng đại ảnh", en: "Magnification Factor", ipa: "/ˌmæɡnɪfɪˈkeɪʃn ˈfæktər/" },
    ],
    quiz: {
      question: "Khi đặt vật sáng vuông góc với trục chính của thấu kính hội tụ và cách thấu kính một khoảng d > 2f, ảnh tạo bởi thấu kính có tính chất gì?",
      options: [
        "Ảnh thật, ngược chiều và nhỏ hơn vật",
        "Ảnh thật, cùng chiều và lớn hơn vật",
        "Ảnh ảo, cùng chiều và lớn hơn vật",
        "Không hứng được ảnh ở bất kỳ vị trí nào"
      ],
      correct: 0,
      explanation: "Khi vật đặt ngoài khoảng 2f (d > 2f), thấu kính hội tụ luôn cho ảnh thật, ngược chiều với vật và nhỏ hơn vật, nằm trong khoảng f < d' < 2f."
    }
  },
  {
    id: "electromagnet_field",
    title: "Thí nghiệm Nam châm điện & Từ trường ống dây",
    titleEn: "Electromagnet & Solenoid Magnetic Field Lab",
    subject: "physics",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 21: Nam châm điện)",
    summary: "Chế tạo nam châm điện từ ống dây quấn quanh lõi sắt non. Khảo sát các yếu tố làm tăng lực từ: cường độ dòng điện (I), số vòng dây (N) và lõi sắt non.",
    summaryEn: "Explore how current (I), coil turns (N), and soft iron core amplify electromagnet attraction of steel nails.",
    badge: "KHTN 7 KNTT",
    apparatus: ["Ống dây đồng bọc men (50, 100, 200 vòng)", "Lõi sắt non hình trụ", "Nguồn điện DC điều chỉnh (1.5V - 12V)", "Biến trở & Ampe kế", "Hộp đinh sắt nhỏ / ghim kẹp giấy"],
    steps: [
      "Bước 1: Đóng công tắc mạch điện để dòng điện chạy qua cuộn dây.",
      "Bước 2: Thay đổi cường độ dòng điện I (0.5A - 3.0A) và quan sát số đinh sắt bị hút dính vào cực nam châm.",
      "Bước 3: Tăng số vòng dây của cuộn cảm từ 50 lên 100 rồi 200 vòng.",
      "Bước 4: Rút lõi sắt non ra để nhận thấy lực từ giảm mạnh.",
      "Bước 5: Ngắt công tắc điện: từ tính biến mất ngay lập tức, đinh sắt rơi xuống hộp."
    ],
    bilingualVocabulary: [
      { vi: "Nam châm điện", en: "Electromagnet", ipa: "/ɪˌlɛktroʊˈmæɡnɪt/" },
      { vi: "Lõi sắt non", en: "Soft Iron Core", ipa: "/sɔːft ˈaɪərn kɔːr/" },
      { vi: "Ống dây (Cuộn dây)", en: "Solenoid Coil", ipa: "/ˈsoʊlənɔɪd kɔɪl/" },
      { vi: "Đường sức từ", en: "Magnetic Field Lines", ipa: "/mæɡˈnɛtɪk fiːld laɪnz/" },
    ],
    quiz: {
      question: "Vì sao người ta dùng lõi sắt non chứ không dùng lõi thép để làm nam châm điện dùng trong cần cẩu phế liệu?",
      options: [
        "Vì sắt non nhiễm từ mạnh nhưng mất từ tính ngay khi ngắt dòng điện, giúp nhả phế liệu dễ dàng",
        "Vì thép không thể bị nhiễm từ",
        "Vì sắt non rẻ hơn và nhẹ hơn thép",
        "Vì sắt non tạo ra từ trường vĩnh cửu"
      ],
      correct: 0,
      explanation: "Lõi sắt non có đặc tính nhiễm từ nhanh và mất từ tính gần như hoàn toàn khi ngắt dòng điện, rất thuận tiện để hút và nhả vật nặng."
    }
  },
  {
    id: "reaction_rate_factors",
    title: "Thí nghiệm Các yếu tố ảnh hưởng Tốc độ phản ứng",
    titleEn: "Factors Affecting Chemical Reaction Rate Lab",
    subject: "chemistry",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 11: Tốc độ phản ứng và chất xúc tác)",
    summary: "Khảo sát phản ứng Zn + 2HCl -> ZnCl2 + H2. Đo thể tích khí H2 sinh ra và tốc độ phản ứng khi thay đổi nồng độ HCl, nhiệt độ, diện tích tiếp xúc Zn và chất xúc tác CuSO4.",
    summaryEn: "Measure H2 gas generation rate in Zn + 2HCl under varying acid concentration, temperature, surface area, and catalyst.",
    badge: "KHTN 8 KNTT",
    apparatus: ["Ống nghiệm có nhánh nút kín", "Ống đong khí pít-tông chia độ (ml)", "Đồng hồ bấm giây điện tử", "Kẽm hạt & Kẽm bột", "Axit HCl 0.5M & 2.0M", "Đèn cồn", "Xúc tác CuSO4"],
    steps: [
      "Bước 1: Chọn nồng độ axit HCl (0.5M loãng hoặc 2.0M đặc).",
      "Bước 2: Chọn nhiệt độ phản ứng (25°C nhiệt độ phòng hoặc 60°C đun nóng).",
      "Bước 3: Chọn dạng kẽm (dạng viên hạt hay dạng bột mịn tăng diện tích tiếp xúc).",
      "Bước 4: Bật/tắt chất xúc tác dung dịch CuSO4.",
      "Bước 5: Nhấn 'Bắt đầu phản ứng', quan sát bọt khí H2 sủi trào và pít-tông ống đong khí dâng lên theo giây."
    ],
    bilingualVocabulary: [
      { vi: "Tốc độ phản ứng hóa học", en: "Reaction Rate", ipa: "/riˈækʃn reɪt/" },
      { vi: "Chất xúc tác", en: "Catalyst", ipa: "/ˈkætəlɪst/" },
      { vi: "Diện tích tiếp xúc", en: "Surface Area", ipa: "/ˈsɜːrfɪs ˈɛriə/" },
      { vi: "Nồng độ dung dịch", en: "Concentration", ipa: "/ˌkɑːnsnˈtreɪʃn/" },
    ],
    quiz: {
      question: "Vì sao kẽm dạng bột mịn tác dụng với dung dịch HCl sinh ra khí H2 nhanh hơn nhiều so với kẽm dạng hạt có cùng khối lượng?",
      options: [
        "Vì dạng bột có diện tích tiếp xúc giữa kẽm và axit lớn hơn nhiều",
        "Vì dạng bột có khối lượng lớn hơn",
        "Vì dạng bột có nhiệt độ cao hơn",
        "Vì kẽm bột có bản chất hóa học khác kẽm hạt"
      ],
      correct: 0,
      explanation: "Khi chia nhỏ chất rắn thành dạng bột mịn, diện tích bề mặt tiếp xúc với chất lỏng tăng lên rất nhiều, làm tăng số va chạm hiệu quả giữa các phân tử, do đó tốc độ phản ứng tăng."
    }
  },
  {
    id: "photosynthesis_starch",
    title: "Thí nghiệm Chứng minh Quang hợp tạo Tinh bột",
    titleEn: "Plant Photosynthesis & Starch Formation Lab",
    subject: "biology",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 23: Quang hợp ở thực vật)",
    summary: "Kiểm chứng lá cây chế tạo tinh bột khi có ánh sáng mặt trời qua phương pháp nhuộm màu iot: phần lá tiếp xúc ánh sáng nhuộm màu xanh tím, phần bị che tối giữ màu nâu vàng.",
    summaryEn: "Test for starch in leaves after light exposure: cover part of leaf with black paper, boil in alcohol to decolorize, and add iodine (blue-black color).",
    badge: "KHTN 7 KNTT",
    apparatus: ["Chậu cây xanh khỏe mạnh", "Băng giấy đen kẹp lá", "Cốc đun nước sôi & Đèn cồn", "Cốc đun cách thủy cồn 90°", "Đĩa petri & Thuốc thử dung dịch iot 1%"],
    steps: [
      "Bước 1: Bịt một phần lá bằng băng giấy đen ở cả hai mặt, đem chậu cây ra chiếu sáng 6 giờ.",
      "Bước 2: Ngắt chiếc lá, tháo băng giấy đen và nhúng lá vào nước sôi 100°C trong 1 phút để diệt tế bào.",
      "Bước 3: Chuyển lá vào cốc chứa cồn 90° đun cách thủy để hòa tan hết sắc tố diệp lục, lá chuyển sang màu trắng ngà.",
      "Bước 4: Rửa lá trong nước ấm, trải phẳng ra đĩa petri và nhỏ dung dịch iot loãng.",
      "Bước 5: Quan sát phần lá được chiếu sáng chuyển sang màu xanh tím (có tinh bột), phần bị che đen không đổi màu (vàng nâu của iot)."
    ],
    bilingualVocabulary: [
      { vi: "Quang hợp ở thực vật", en: "Photosynthesis", ipa: "/ˌfoʊtoʊˈsɪnθəsɪs/" },
      { vi: "Tinh bột", en: "Starch", ipa: "/stɑːrtʃ/" },
      { vi: "Sắc tố diệp lục", en: "Chlorophyll", ipa: "/ˈklɔːrəfɪl/" },
      { vi: "Thuốc thử Iot", en: "Iodine Solution", ipa: "/ˈaɪədaɪn səˈluːʃn/" },
    ],
    quiz: {
      question: "Trong thí nghiệm chứng minh quang hợp tạo tinh bột, tại sao phần lá bị bịt băng giấy đen không chuyển sang màu xanh tím khi nhỏ dung dịch iot?",
      options: [
        "Vì phần lá đó không nhận được ánh sáng nên không thể quang hợp tạo ra tinh bột",
        "Vì cồn đã hòa tan mất tinh bột ở phần đó",
        "Vì dung dịch iot không ngấm được vào phần lá đó",
        "Vì nhiệt độ ở phần lá đó quá cao"
      ],
      correct: 0,
      explanation: "Không có ánh sáng thì diệp lục không thể thực hiện quang hợp, do đó không tạo ra tinh bột để phản ứng với iot tạo màu xanh tím đặc trưng."
    }
  },
  {
    id: "mixture_separation",
    title: "Thí nghiệm Tách chất ra khỏi hỗn hợp (Lọc & Cô cạn)",
    titleEn: "Mixture Separation: Filtration & Evaporation Lab",
    subject: "chemistry",
    grade: "6",
    textbookRef: "SGK Khoa học tự nhiên 6 - Kết Nối Tri Thức (Bài 20: Tách chất ra khỏi hỗn hợp)",
    summary: "Thực hành phương pháp lọc tách chất rắn không tan (cát) khỏi nước muối và phương pháp cô cạn dung dịch muối ăn (NaCl) bằng đèn cồn để thu hồi tinh thể muối kết tinh.",
    summaryEn: "Separate insoluble sand by gravity filtration and recover dissolved NaCl salt crystals through thermal evaporation with a spirit burner.",
    badge: "KHTN 6 KNTT",
    apparatus: ["Phễu thủy tinh & Giấy lọc gấp nón", "Giá sắt kẹp phễu thí nghiệm", "Cốc thủy tinh & Đũa khuấy", "Bát sứ chịu nhiệt", "Đèn cồn & Kiềng đun có lưới amiăng"],
    steps: [
      "Bước 1: Chọn phương pháp 'Lọc tách chất rắn' hoặc 'Cô cạn dung dịch'.",
      "Bước 2: Với phương pháp lọc: rót hỗn hợp cát và nước muối dọc theo đũa thủy tinh vào phễu lọc có giấy lọc.",
      "Bước 3: Quan sát bã cát được giữ lại trên giấy lọc và nước muối trong suốt (dịch lọc) nhỏ giọt chảy vào cốc hứng.",
      "Bước 4: Chuyển sang phương pháp cô cạn: đổ nước muối vào bát sứ, châm lửa đèn cồn.",
      "Bước 5: Nước bay hơi dần, quan sát các hạt muối ăn NaCl màu trắng kết tinh bám quanh thành và đáy bát sứ."
    ],
    bilingualVocabulary: [
      { vi: "Phương pháp lọc", en: "Filtration", ipa: "/fɪlˈtreɪʃn/" },
      { vi: "Nước lọc (dịch lọc)", en: "Filtrate", ipa: "/ˈfɪltreɪt/" },
      { vi: "Bã lọc (chất rắn không tan)", en: "Residue", ipa: "/ˈrɛzɪduː/" },
      { vi: "Cô cạn & Kết tinh", en: "Evaporation & Crystallization", ipa: "/ɪˌvæpəˈreɪʃn ænd ˌkrɪstəlɪˈzeɪʃn/" },
    ],
    quiz: {
      question: "Để tách muối ăn ra khỏi dung dịch nước muối, người ta dùng phương pháp nào phù hợp nhất?",
      options: [
        "Cô cạn để nước bay hơi, thu được tinh thể muối",
        "Dùng phễu và giấy lọc để lọc muối",
        "Dùng nam châm để hút muối",
        "Chiết chất lỏng"
      ],
      correct: 0,
      explanation: "Muối ăn tan tốt trong nước tạo thành dung dịch đồng nhất nên không thể dùng phương pháp lọc. Cần đun cô cạn để nước bay hơi hết, muối ăn có nhiệt độ sôi rất cao sẽ kết tinh lại."
    }
  },
  {
    id: "friction_force",
    title: "Thí nghiệm Lực ma sát trượt trên các bề mặt",
    titleEn: "Sliding Friction Force & Surface Roughness Lab",
    subject: "physics",
    grade: "6",
    textbookRef: "SGK Khoa học tự nhiên 6 - Kết Nối Tri Thức (Bài 40: Lực ma sát)",
    summary: "Đo độ lớn lực ma sát trượt bằng lực kế lò xo khi kéo khối gỗ trên các bề mặt: mặt kính trơn bóng, mặt bàn gỗ và mặt giấy nhám ráp; khảo sát ảnh hưởng của áp lực lên lực ma sát.",
    summaryEn: "Measure sliding friction with a spring dynamometer across smooth glass, polished wood, and sandpaper surfaces under varying normal loads.",
    badge: "KHTN 6 KNTT",
    apparatus: ["Lực kế lò xo 0 - 5N", "Khối gỗ hình hộp chữ nhật có móc kéo", "Hộp quả nặng gia tải (100g - 500g)", "Tấm mặt kính trơn", "Tấm mặt gỗ phẳng", "Tấm giấy nhám sần sùi"],
    steps: [
      "Bước 1: Chọn bề mặt tiếp xúc (Mặt kính trơn, Mặt gỗ, hoặc Giấy nhám ráp).",
      "Bước 2: Thay đổi khối lượng quả nặng đặt trên khối gỗ (100g đến 500g).",
      "Bước 3: Nhấn nút 'Kéo lực kế' để kéo khối gỗ chuyển động thẳng đều trên mặt bàn.",
      "Bước 4: Đọc số chỉ lực kế khi khối gỗ đang trượt: số chỉ này chính bằng độ lớn của lực ma sát trượt.",
      "Bước 5: So sánh kết quả để rút ra kết luận: lực ma sát tỉ lệ thuận với áp lực và phụ thuộc vào tính chất bề mặt tiếp xúc."
    ],
    bilingualVocabulary: [
      { vi: "Lực ma sát trượt", en: "Sliding Friction Force", ipa: "/ˈslaɪdɪŋ ˈfrɪkʃn fɔːrs/" },
      { vi: "Bề mặt tiếp xúc", en: "Contact Surface", ipa: "/ˈkɑːntækt ˈsɜːrfɪs/" },
      { vi: "Áp lực lên mặt tiếp xúc", en: "Normal Force", ipa: "/ˈnɔːrml fɔːrs/" },
      { vi: "Chuyển động thẳng đều", en: "Uniform Linear Motion", ipa: "/ˈjuːnɪfɔːrm ˈlɪniər ˈmoʊʃn/" },
    ],
    quiz: {
      question: "Độ lớn của lực ma sát trượt KHÔNG phụ thuộc vào yếu tố nào sau đây?",
      options: [
        "Diện tích bề mặt tiếp xúc và tốc độ của vật",
        "Tính chất của bề mặt tiếp xúc (gồ ghề hay trơn nhẵn)",
        "Áp lực của vật lên mặt tiếp xúc",
        "Vật liệu làm nên các mặt tiếp xúc"
      ],
      correct: 0,
      explanation: "Độ lớn lực ma sát trượt không phụ thuộc vào diện tích tiếp xúc và tốc độ chuyển động của vật, mà chỉ phụ thuộc vào tính chất (độ nhám, vật liệu) của mặt tiếp xúc và áp lực N."
    }
  },
  {
    id: "optics_plane_mirror",
    title: "Thí nghiệm Định luật Phản xạ ánh sáng & Gương phẳng",
    titleEn: "Law of Reflection & Plane Mirror Imaging Lab",
    subject: "physics",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 12: Ánh sáng, tia sáng & Sự phản xạ)",
    summary: "Kiểm chứng định luật phản xạ ánh sáng (góc phản xạ i' = i) và tính chất ảnh ảo tạo bởi gương phẳng (đối xứng qua gương, d' = d, h' = h).",
    summaryEn: "Verify Snell's law of reflection (angle i' = i) and prove virtual image properties (symmetric, d' = d, same size) using a plane mirror.",
    badge: "KHTN 7 KNTT",
    apparatus: ["Gương phẳng đặt thẳng đứng trên đế", "Đèn chiếu tạo chùm tia sáng hẹp", "Thước đo góc hình bán nguyệt (0 - 90°)", "Vật sáng (Ngọn nến / Cây bút chì)", "Thước chia milimet"],
    steps: [
      "Bước 1: Chọn chế độ 'Tia sáng phản xạ' hoặc 'Sự tạo ảnh của vật qua gương'.",
      "Bước 2: Xoay tia tới SI với các góc tới i khác nhau (15°, 30°, 45°, 60°).",
      "Bước 3: Quan sát tia phản xạ IR và đọc số đo góc phản xạ i' để kiểm chứng i' = i.",
      "Bước 4: Chuyển sang chế độ tạo ảnh: thay đổi khoảng cách vật sáng đến gương (d).",
      "Bước 5: Đo khoảng cách từ ảnh ảo A' đến gương (d') và so sánh chiều cao ảnh với chiều cao vật."
    ],
    bilingualVocabulary: [
      { vi: "Định luật phản xạ ánh sáng", en: "Law of Reflection", ipa: "/lɔː əv rɪˈflɛkʃn/" },
      { vi: "Góc tới & Góc phản xạ", en: "Incident Angle & Reflected Angle", ipa: "/ˈæŋɡl əv ˈɪnsɪdəns/" },
      { vi: "Pháp tuyến", en: "Normal Line", ipa: "/ˈnɔːrml laɪn/" },
      { vi: "Ảnh ảo qua gương phẳng", en: "Virtual Image in Plane Mirror", ipa: "/ˈvɜːrtʃuəl ˈɪmɪdʒ/" },
    ],
    quiz: {
      question: "Chiếu một tia sáng tới gương phẳng với góc tới i = 35°. Góc phản xạ i' và góc hợp bởi tia tới và tia phản xạ lần lượt bằng bao nhiêu?",
      options: [
        "i' = 35° và góc giữa hai tia là 70°",
        "i' = 35° và góc giữa hai tia là 35°",
        "i' = 55° và góc giữa hai tia là 110°",
        "i' = 70° và góc giữa hai tia là 140°"
      ],
      correct: 0,
      explanation: "Theo định luật phản xạ ánh sáng: góc phản xạ i' = i = 35°. Góc hợp bởi tia tới và tia phản xạ là i + i' = 35° + 35° = 70°."
    }
  },
  {
    id: "sound_reflection_echo",
    title: "Thí nghiệm Phản xạ âm & Tiếng vang",
    titleEn: "Sound Reflection & Echo Perception Lab",
    subject: "physics",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 14: Phản xạ âm & Tiếng vang)",
    summary: "Đo tốc độ truyền âm trong không khí v = 340 m/s, tính thời gian âm dội lại Delta t = 2s / v, khảo sát điều kiện nghe được tiếng vang và khả năng phản xạ của các vật cản.",
    summaryEn: "Investigate acoustic reflection, calculate echo time delay Delta t = 2s/v (v = 340 m/s), test echo threshold (Delta t >= 1/15s), and compare reflective vs absorbent barriers.",
    badge: "KHTN 7 KNTT",
    apparatus: ["Nguồn phát âm (Bộ còi tín hiệu / Máy phát xung)", "Vách cản âm (Vách núi đá hoa cương, Tường gạch, Tấm xốp hút âm)", "Micro thu âm & Đồng hồ đo mili-giây", "Thước đo khoảng cách laser (m)"],
    steps: [
      "Bước 1: Chọn khoảng cách từ người phát âm đến vách cản s (từ 5m đến 50m).",
      "Bước 2: Chọn vật liệu của vách cản (Vách đá cứng phản xạ tốt, Bức tường bê tông, hoặc Rèm nhung/xốp tiêu âm).",
      "Bước 3: Nhấn nút 'Phát tín hiệu âm thanh' để phát tiếng còi.",
      "Bước 4: Quan sát sóng âm màu xanh lan truyền tới vách cản và sóng phản xạ màu cam dội ngược lại.",
      "Bước 5: Kiểm tra thời gian trễ Delta t: nếu Delta t >= 0.067s (s >= 11.3m) tai người phân biệt được tiếng vang rõ ràng."
    ],
    bilingualVocabulary: [
      { vi: "Tiếng vang (Âm phản xạ)", en: "Echo", ipa: "/ˈɛkoʊ/" },
      { vi: "Vật phản xạ âm tốt", en: "Good Sound Reflector", ipa: "/ɡʊd saʊnd rɪˈflɛktər/" },
      { vi: "Vật liệu tiêu âm (hút âm)", en: "Sound Absorbing Material", ipa: "/saʊnd əbˈzɔːrbɪŋ məˈtɪriəl/" },
      { vi: "Tốc độ truyền âm", en: "Speed of Sound", ipa: "/spiːd əv saʊnd/" },
    ],
    quiz: {
      question: "Để một người đứng trước một vách đá có thể nghe rõ tiếng vang của chính mình (với tốc độ âm trong không khí là 340 m/s), khoảng cách tối thiểu từ người đó đến vách đá là bao nhiêu?",
      options: [
        "Khoảng 11,33 mét",
        "Khoảng 5,67 mét",
        "Khoảng 22,67 mét",
        "Khoảng 17 mét"
      ],
      correct: 0,
      explanation: "Tai người chỉ phân biệt được tiếng vang khi âm trực tiếp và âm phản xạ cách nhau ít nhất 1/15 giây. Khi đó: s = (v * t) / 2 = (340 * 1/15) / 2 = 340 / 30 ≈ 11.33 mét."
    }
  },
  {
    id: "lever_balance",
    title: "Thí nghiệm Đòn bẩy & Điều kiện Cân bằng",
    titleEn: "Levers & Moment Equilibrium Principle Lab",
    subject: "physics",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 19: Đòn bẩy và ứng dụng)",
    summary: "Khảo sát đòn bẩy có điểm tựa O, kiểm chứng quy tắc cân bằng mô-men lực F1 * d1 = F2 * d2 và tìm hiểu tác dụng làm giảm lực kéo khi tăng cánh tay đòn.",
    summaryEn: "Investigate first-class levers, verify moment equilibrium law F1 * d1 = F2 * d2, and demonstrate mechanical force advantages.",
    badge: "KHTN 8 KNTT",
    apparatus: ["Thanh đòn bẩy kim loại có chia vạch cm", "Giá đỡ có trục quay O ma sát thấp", "Bộ quả nặng chuẩn 50g - 500g", "Móc treo dịch chuyển linh hoạt", "Lực kế đo lực tác dụng"],
    steps: [
      "Bước 1: Chọn khoảng cách cánh tay đòn bên trái (d1) và khối lượng quả nặng treo bên trái (m1).",
      "Bước 2: Chọn khoảng cách cánh tay đòn bên phải (d2) và khối lượng quả nặng bên phải (m2).",
      "Bước 3: Quan sát thanh đòn bẩy nghiêng theo hướng mô-men lực lớn hơn (M1 = F1*d1 so với M2 = F2*d2).",
      "Bước 4: Điều chỉnh d2 hoặc m2 sao cho F1*d1 = F2*d2 để đòn bẩy trở về trạng thái thăng bằng nằm ngang.",
      "Bước 5: Nhấn 'Cân bằng tự động' để tính toán vị trí treo lý tưởng."
    ],
    bilingualVocabulary: [
      { vi: "Đòn bẩy", en: "Lever", ipa: "/ˈlɛvər/" },
      { vi: "Điểm tựa (Trục quay)", en: "Fulcrum / Pivot Point", ipa: "/ˈfʊlkrəm/" },
      { vi: "Cánh tay đòn của lực", en: "Moment Arm (Lever Arm)", ipa: "/ˈmoʊmənt ɑːrm/" },
      { vi: "Điều kiện cân bằng mô-men", en: "Moment Equilibrium Rule", ipa: "/ˈmoʊmənt ˌiːkwɪˈlɪbriəm ruːl/" },
    ],
    quiz: {
      question: "Một đòn bẩy có điểm tựa O ở giữa. Bên trái treo vật có trọng lượng P1 = 4N ở khoảng cách d1 = 30cm. Để đòn bẩy cân bằng, bên phải treo vật P2 = 6N thì khoảng cách d2 phải bằng bao nhiêu?",
      options: [
        "20 cm",
        "45 cm",
        "15 cm",
        "30 cm"
      ],
      correct: 0,
      explanation: "Áp dụng điều kiện cân bằng đòn bẩy: P1 * d1 = P2 * d2 => d2 = (P1 * d1) / P2 = (4 * 30) / 6 = 20 cm."
    }
  },
  {
    id: "acid_base_ph_indicator",
    title: "Thí nghiệm Đo pH & Chỉ thị màu Acid - Base",
    titleEn: "Acid-Base Indicators & pH Scale Lab",
    subject: "chemistry",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 9: Acid, Base và Thang pH)",
    summary: "Nhận biết dung dịch acid, base và trung tính bằng giấy quỳ tím, dung dịch phenolphthalein và thang đo pH vạn năng.",
    summaryEn: "Identify acid, base, and neutral solutions using litmus paper, phenolphthalein, and the universal pH scale.",
    badge: "KHTN 8 KNTT",
    apparatus: [
      "Khay thử giọt sứ 6 lỗ / Giá ống nghiệm thủy tinh",
      "Giấy quỳ tím tiêu chuẩn",
      "Chỉ thị Phenolphthalein 0.1%",
      "Giấy đo pH vạn năng dải màu 1-14",
      "5 Dung dịch mẫu: Nước chanh, Giấm ăn, Nước cất, Nước xà phòng, NaOH 0.1M"
    ],
    steps: [
      "Bước 1: Chọn một dung dịch mẫu cần kiểm tra (Nước chanh, Giấm ăn, Nước cất, Nước xà phòng, hoặc NaOH).",
      "Bước 2: Chọn loại chất chỉ thị màu: Giấy quỳ tím, Dung dịch Phenolphthalein, hoặc Thang đo pH vạn năng.",
      "Bước 3: Nhấn nút 'Nhúng giấy thử / Nhỏ chỉ thị' để cho chất chỉ thị tiếp xúc với dung dịch.",
      "Bước 4: Quan sát sự biến đổi màu sắc: Quỳ tím hóa đỏ (acid) / hóa xanh (base); Phenolphthalein hóa hồng cánh sen trong môi trường base.",
      "Bước 5: So sánh với bảng màu chuẩn để đọc trị số pH và ghi chép vào bảng số liệu."
    ],
    bilingualVocabulary: [
      { vi: "Thang pH", en: "pH Scale", ipa: "/piː eɪtʃ skeɪl/" },
      { vi: "Chất chỉ thị màu", en: "pH Indicator", ipa: "/piː eɪtʃ ˈɪndɪkeɪtər/" },
      { vi: "Giấy quỳ tím", en: "Litmus Paper", ipa: "/ˈlɪtməs ˈpeɪpər/" },
      { vi: "Dung dịch Phenolphthalein", en: "Phenolphthalein Solution", ipa: "/ˌfiːnɒlfˈθeɪliːn səˈluːʃən/" },
      { vi: "Dung dịch trung tính", en: "Neutral Solution", ipa: "/ˈnuːtrəl səˈluːʃən/" },
    ],
    quiz: {
      question: "Nhỏ vài giọt dung dịch phenolphtalein không màu vào ống nghiệm chứa dung dịch sodium hydroxide (NaOH 0.1M) thì dung dịch sẽ chuyển sang màu gì?",
      options: [
        "Màu hồng cánh sen",
        "Màu xanh lam",
        "Màu đỏ tươi",
        "Vẫn không màu trong suốt"
      ],
      correct: 0,
      explanation: "Dung dịch phenolphtalein không màu khi gặp môi trường base (như NaOH có pH > 8.3) sẽ chuyển sang màu hồng cánh sen đặc trưng."
    }
  },
  {
    id: "osmosis_cell_turgor",
    title: "Thí nghiệm Thẩm thấu & Co nguyên sinh ở Tế bào",
    titleEn: "Osmosis & Plant Cell Plasmolysis Lab",
    subject: "biology",
    grade: "6",
    textbookRef: "SGK Khoa học tự nhiên 6 (Bài 17: Tế bào) & KHTN 7 (Bài 28: Trao đổi nước) - Kết Nối Tri Thức",
    summary: "Quan sát hiện tượng co nguyên sinh và phản co nguyên sinh ở tế bào biểu bì vảy hành tía trong môi trường ưu trương, đẳng trương và nhược trương.",
    summaryEn: "Observe plasmolysis and deplasmolysis in purple onion epidermal cells under hypertonic, isotonic, and hypotonic conditions.",
    badge: "KHTN 6 KNTT",
    apparatus: [
      "Kính hiển vi quang học ảo có độ phóng đại 100x - 400x",
      "Lam kính và lamen",
      "Biểu bì vảy hành tía (Allium cepa) có không bào sắc tố anthocyanin",
      "Dung dịch muối NaCl ưu trương (10%), đẳng trương (0.9%), nước cất nhược trương",
      "Giấy thấm và ống hút nhỏ giọt"
    ],
    steps: [
      "Bước 1: Đặt tiêu bản biểu bì vảy hành tía lên bàn sa kính của kính hiển vi quang học.",
      "Bước 2: Chọn môi trường dung dịch: 'Ưu trương' (Nước muối đặc 10%), 'Đẳng trương' (NaCl 0.9%), hoặc 'Nhược trương' (Nước cất).",
      "Bước 3: Nhấn nút 'Nhỏ dịch thử' và quan sát quá trình thẩm thấu của các phân tử nước qua màng sinh chất.",
      "Bước 4: Trong dung dịch ưu trương: Nước đi ra ngoài tế bào, không bào co lại, màng sinh chất tách khỏi thành tế bào (hiện tượng co nguyên sinh).",
      "Bước 5: Chuyển sang nước cất (nhược trương): Nước thẩm thấu ngược vào trong, không bào căng phồng ép sát thành tế bào (phản co nguyên sinh)."
    ],
    bilingualVocabulary: [
      { vi: "Sự thẩm thấu", en: "Osmosis", ipa: "/ɒzˈmoʊsɪs/" },
      { vi: "Hiện tượng co nguyên sinh", en: "Plasmolysis", ipa: "/plæzˈmɒlɪsɪs/" },
      { vi: "Phản co nguyên sinh (Trương bào)", en: "Deplasmolysis / Turgidity", ipa: "/diːˌplæzˈmɒlɪsɪs/" },
      { vi: "Môi trường ưu trương", en: "Hypertonic Solution", ipa: "/ˌhaɪpərˈtɒnɪk səˈluːʃən/" },
      { vi: "Không bào trung tâm", en: "Central Vacuole", ipa: "/ˈsɛntrəl ˈvækjuːoʊl/" },
    ],
    quiz: {
      question: "Khi ngâm tế bào biểu bì củ hành tía vào dung dịch nước muối đặc 10% (môi trường ưu trương), hiện tượng nào sẽ xảy ra?",
      options: [
        "Nước thẩm thấu ra ngoài, không bào co nhỏ lại, màng sinh chất tách rời thành tế bào",
        "Nước thẩm thấu vào trong, tế bào căng phồng và vỡ tung",
        "Tế bào không có hiện tượng thay đổi kích thước nào",
        "Thành tế bào bị hòa tan biến mất"
      ],
      correct: 0,
      explanation: "Trong môi trường ưu trương (nồng độ chất tan bên ngoài cao hơn bên trong), nước từ không bào thẩm thấu ra ngoài khiến thể tích không bào giảm, màng sinh chất tách khỏi thành cellulose gây nên hiện tượng co nguyên sinh."
    }
  },
  {
    id: "electromagnetic_induction",
    title: "Thí nghiệm Cảm ứng điện từ & Định luật Lenz",
    titleEn: "Electromagnetic Induction & Faraday-Lenz Law",
    subject: "physics",
    grade: "9",
    textbookRef: "SGK Khoa học tự nhiên 9 - Kết Nối Tri Thức (Bài 14: Hiện tượng Cảm ứng điện từ)",
    summary: "Khảo sát sự xuất hiện dòng điện cảm ứng khi di chuyển nam châm qua cuộn dây dẫn kín, kiểm chứng chiều dòng điện theo định luật Lenz.",
    summaryEn: "Investigate induced electric current when moving a magnet through a closed coil, verifying Lenz's direction law.",
    badge: "KHTN 9 KNTT",
    apparatus: [
      "Cuộn dây dẫn đồng nhiều vòng (200, 500, 1000 vòng)",
      "Thanh nam châm vĩnh cửu có sơn 2 cực N (Bắc) và S (Nam)",
      "Điện kế chứng minh độ nhạy cao (Galvanometer dải đo -50mA đến +50mA)",
      "2 đèn LED đỏ - xanh mắc song song ngược cực",
      "Thanh trượt định vị nam châm"
    ],
    steps: [
      "Bước 1: Chọn số vòng dây của cuộn cảm (200, 500 hoặc 1000 vòng) và cực nam châm hướng vào cuộn dây (N hoặc S).",
      "Bước 2: Di chuyển thanh trượt để đưa nam châm lại gần hoặc ra xa cuộn dây.",
      "Bước 3: Quan sát kim điện kế Galvanometer: Khi nam châm tiến vào cuộn dây, kim lệch sang một bên; khi rút ra, kim lệch sang bên đối diện.",
      "Bước 4: Khi giữ nam châm đứng yên bên trong cuộn dây, kim điện kế quay về vạch số 0 (không có dòng cảm ứng).",
      "Bước 5: Thử di chuyển nam châm với tốc độ nhanh hơn để thấy kim điện kế lệch góc lớn hơn (tốc độ biến thiên từ thông càng lớn thì dòng cảm ứng càng mạnh)."
    ],
    bilingualVocabulary: [
      { vi: "Hiện tượng cảm ứng điện từ", en: "Electromagnetic Induction", ipa: "/ɪˌlɛktrəʊmæɡˈnɛtɪk ɪnˈdʌkʃən/" },
      { vi: "Từ thông", en: "Magnetic Flux", ipa: "/mæɡˈnɛtɪk flʌks/" },
      { vi: "Dòng điện cảm ứng", en: "Induced Current", ipa: "/ɪnˈdjuːst ˈkɜːrənt/" },
      { vi: "Điện kế Galvanometer", en: "Galvanometer", ipa: "/ˌɡælvəˈnɒmɪtər/" },
      { vi: "Định luật Lenz", en: "Lenz's Law", ipa: "/lɛnzɪz lɔː/" },
    ],
    quiz: {
      question: "Dòng điện cảm ứng chỉ xuất hiện trong một cuộn dây dẫn kín trong trường hợp nào sau đây?",
      options: [
        "Khi số đường sức từ xuyên qua tiết diện cuộn dây biến thiên (tăng hoặc giảm)",
        "Khi đặt nam châm vĩnh cửu đứng yên hoàn toàn trong lòng cuộn dây",
        "Khi cuộn dây được làm bằng đồng nguyên chất",
        "Khi nối hai đầu cuộn dây với một điện trở rất lớn"
      ],
      correct: 0,
      explanation: "Điều kiện để xuất hiện dòng điện cảm ứng trong cuộn dây dẫn kín là số đường sức từ (từ thông) xuyên qua tiết diện cuộn dây phải biến thiên theo thời gian."
    }
  },
  {
    id: "sound_oscilloscope_frequency",
    title: "Thí nghiệm Dao động ký: Tần số & Độ cao của Âm",
    titleEn: "Sound Waves, Frequency & Pitch Oscilloscope Lab",
    subject: "physics",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 13: Độ to và Độ cao của âm)",
    summary: "Quan sát đồ thị dao động âm trên màn hình dao động ký điện tử, khảo sát mối liên hệ giữa tần số (Hz) với độ cao và biên độ (dB) với độ to của âm thanh.",
    summaryEn: "Visualize audio waveforms on a digital oscilloscope, investigating pitch vs. frequency (Hz) and loudness vs. amplitude (dB).",
    badge: "KHTN 7 KNTT",
    apparatus: [
      "Máy phát âm tần số điều chỉnh được (100 Hz - 2000 Hz)",
      "Dao động ký điện tử ảo (Oscilloscope) hiển thị đồ thị sóng sin thời gian thực",
      "Bộ khuếch đại biên độ âm thanh (Loa phát)",
      "Microphone thu sóng và bộ phân tích quang phổ âm"
    ],
    steps: [
      "Bước 1: Điều chỉnh tần số f của nguồn âm từ 100 Hz (âm trầm) đến 2000 Hz (âm cao/bổng).",
      "Bước 2: Điều chỉnh biên độ dao động A từ 10% đến 100% để thay đổi độ to của âm.",
      "Bước 3: Quan sát dạng sóng trên màn hình dao động ký: Khi tần số f càng lớn, các chu kỳ sóng xít lại gần nhau (chu kỳ T = 1/f càng nhỏ).",
      "Bước 4: Khi biên độ A càng lớn, chiều cao đỉnh sóng càng lớn biểu thị âm càng to.",
      "Bước 5: Nhấn nút 'Phát âm thanh tần số này' để trực tiếp nghe sự khác biệt giữa âm trầm, nốt La chuẩn 440Hz và âm bổng qua loa."
    ],
    bilingualVocabulary: [
      { vi: "Tần số dao động (Héc)", en: "Frequency (Hertz)", ipa: "/ˈfriːkwənsi (hɜːrts)/" },
      { vi: "Độ cao của âm (Cao độ)", en: "Pitch of Sound", ipa: "/pɪtʃ əv saʊnd/" },
      { vi: "Biên độ dao động", en: "Vibration Amplitude", ipa: "/vaɪˈbreɪʃən ˈæmplɪtjuːd/" },
      { vi: "Độ to của âm", en: "Loudness", ipa: "/ˈlaʊdnəs/" },
      { vi: "Dao động ký điện tử", en: "Digital Oscilloscope", ipa: "/ˈdɪdʒɪtl əˈsɪləskoʊp/" },
    ],
    quiz: {
      question: "Một lá thép dao động với tần số f = 880 Hz và một lá nhôm dao động với tần số f = 220 Hz. Âm do lá nào phát ra sẽ bổng (cao) hơn?",
      options: [
        "Lá thép phát ra âm bổng hơn vì tần số dao động lớn hơn (880 Hz > 220 Hz)",
        "Lá nhôm phát ra âm bổng hơn vì khối lượng nhẹ hơn",
        "Hai lá phát ra âm có độ bổng bằng nhau",
        "Lá nhôm phát ra âm to hơn nên sẽ bổng hơn"
      ],
      correct: 0,
      explanation: "Độ cao của âm do tần số dao động quyết định. Tần số dao động càng lớn thì âm phát ra càng bổng (cao). Vì 880 Hz > 220 Hz nên lá thép phát ra âm bổng hơn nhiều."
    }
  },
  {
    id: "thermal_expansion_solids",
    title: "Thí nghiệm Sự nở vì nhiệt của Chất rắn ('s Gravesande)",
    titleEn: "Thermal Expansion of Solids ('s Gravesande Ring Lab)",
    subject: "physics",
    grade: "6",
    textbookRef: "SGK Khoa học tự nhiên 6 (Bài 8) & KHTN 8 (Bài 26) - Kết Nối Tri Thức",
    summary: "Kiểm chứng chất rắn nở ra khi nóng lên và co lại khi lạnh đi qua thí nghiệm Quả cầu và Vòng kim loại của 's Gravesande.",
    summaryEn: "Verify that solids expand when heated and contract when cooled using 's Gravesande's metal ring and ball apparatus.",
    badge: "KHTN 6 KNTT",
    apparatus: [
      "Quả cầu kim loại (Nhôm, Đồng, Sắt) có dây xích treo",
      "Vòng kim loại 's Gravesande có tay cầm và đường kính lỗ chuẩn 40.00 mm",
      "Đèn cồn thắp lửa nung nóng",
      "Chậu thủy tinh chứa nước lạnh",
      "Thước cặp cơ khí đo đường kính chính xác 0.01 mm"
    ],
    steps: [
      "Bước 1: Ở nhiệt độ thường (25°C), thử thả quả cầu qua vòng kim loại: Quả cầu lọt qua vòng dễ dàng do đường kính cầu nhỏ hơn đường kính vòng.",
      "Bước 2: Chọn loại kim loại của quả cầu: Nhôm, Đồng, hoặc Sắt.",
      "Bước 3: Nhấn nút 'Hơ lửa đèn cồn' để đun nóng quả cầu lên 150°C - 250°C trong vài phút.",
      "Bước 4: Nhấn 'Thả quả cầu qua vòng': Quan sát thấy quả cầu nở ra vì nhiệt (đường kính tăng lên) nên BỊ KẸT LẠI trên miệng vòng, không lọt qua được.",
      "Bước 5: Nhấn 'Nhúng vào chậu nước lạnh': Quả cầu được làm lạnh nhanh, co lại kích thước ban đầu và rơi lọt qua vòng."
    ],
    bilingualVocabulary: [
      { vi: "Sự nở vì nhiệt", en: "Thermal Expansion", ipa: "/ˈθɜːrməl ɪkˈspænʃən/" },
      { vi: "Hệ số nở dài", en: "Coefficient of Linear Expansion", ipa: "/ˌkoʊɪˈfɪʃənt əv ˈlɪniər ɪkˈspænʃən/" },
      { vi: "Vòng 's Gravesande", en: "'s Gravesande Ring Apparatus", ipa: "/s-ɡrævˈsɑːnd rɪŋ/" },
      { vi: "Sự co lại do lạnh", en: "Thermal Contraction", ipa: "/ˈθɜːrməl kənˈtrækʃən/" },
    ],
    quiz: {
      question: "Vì sao khi hơ nóng quả cầu kim loại trên ngọn lửa đèn cồn, quả cầu lại không lọt qua vòng kim loại 's Gravesande nữa?",
      options: [
        "Vì khi nóng lên, quả cầu kim loại nở ra làm thể tích và đường kính tăng lên lớn hơn lỗ vòng",
        "Vì khối lượng của quả cầu tăng lên sau khi đun nóng",
        "Vì ngọn lửa làm vòng kim loại bị co nhỏ lại",
        "Vì quả cầu bị dính chặt vào không khí"
      ],
      correct: 0,
      explanation: "Chất rắn nở ra khi nóng lên. Khi đun nóng, nhiệt độ tăng làm các phân tử kim loại dao động mạnh hơn và khoảng cách giữa chúng tăng lên, dẫn đến thể tích và đường kính quả cầu tăng lên, không còn lọt qua lỗ vòng."
    }
  },
  {
    id: "spring_hooke_elasticity",
    title: "Thí nghiệm Khảo sát Độ dãn Lò xo & Định luật Húc",
    titleEn: "Spring Elongation & Hooke's Law Experiment",
    subject: "physics",
    grade: "6",
    textbookRef: "SGK Khoa học tự nhiên 6 - Kết Nối Tri Thức (Bài 36: Tác dụng của lực - Độ biến dạng của lò xo)",
    summary: "Khảo sát mối liên hệ tỉ lệ thuận giữa độ dãn lò xo (Δl) và độ lớn lực đàn hồi (Fđh) cân bằng với trọng lượng quả nặng (P = m.g).",
    summaryEn: "Investigate how spring elongation (Δl) is directly proportional to the elastic restoring force (F = k.Δl).",
    badge: "KHTN 6 KNTT",
    apparatus: [
      "Giá thí nghiệm thẳng đứng có vạch chia",
      "Thước đo milimet căn chỉnh (0 - 30cm)",
      "Lò xo xoắn thép có kim chỉ thị",
      "Bộ quả nặng móc treo gia chuẩn (mỗi quả 50g)",
      "Bảng số liệu đối chứng F = k.Δl"
    ],
    steps: [
      "Bước 1: Treo lò xo thẳng đứng vào giá thí nghiệm, ghi lại chiều dài tự nhiên ban đầu l₀ (12 cm).",
      "Bước 2: Móc lần lượt từng quả nặng 50g vào đầu dưới lò xo (từ 50g lên 300g).",
      "Bước 3: Đọc độ dài l khi lò xo cân bằng trên thước đo, tính độ dãn Δl = l - l₀.",
      "Bước 4: Nhấn 'Ghi số liệu' để lập bảng và kiểm chứng tỉ số F / Δl = k không đổi."
    ],
    bilingualVocabulary: [
      { vi: "Độ biến dạng / Độ dãn", en: "Elongation / Deformation", ipa: "/ɪˌlɒŋˈɡeɪʃən/" },
      { vi: "Lực đàn hồi", en: "Elastic Restoring Force", ipa: "/ɪˈlæstɪk fɔːrs/" },
      { vi: "Độ cứng lò xo (k)", en: "Spring Constant (Stiffness)", ipa: "/sprɪŋ ˈkɒnstənt/" },
      { vi: "Định luật Húc", en: "Hooke's Law", ipa: "/hʊks lɔː/" },
    ],
    quiz: {
      question: "Một lò xo có chiều dài tự nhiên l₀ = 10cm. Khi treo quả nặng 100g thì lò xo dài 12cm. Nếu treo quả nặng 200g thì chiều dài lò xo là bao nhiêu?",
      options: [
        "14 cm (độ dãn tăng gấp đôi thành 4cm)",
        "12 cm (không đổi)",
        "16 cm",
        "24 cm"
      ],
      correct: 0,
      explanation: "Độ dãn lò xo Δl tỉ lệ thuận với khối lượng quả nặng. Với 100g lò xo dãn Δl₁ = 12 - 10 = 2cm. Với 200g (gấp đôi) thì Δl₂ = 4cm, vậy chiều dài lò xo là l = l₀ + Δl₂ = 10 + 4 = 14cm."
    }
  },
  {
    id: "plant_phototropism",
    title: "Thí nghiệm Tính hướng sáng ở ngọn cây mầm & Auxin",
    titleEn: "Plant Phototropism & Auxin Hormone Response",
    subject: "biology",
    grade: "7",
    textbookRef: "SGK Khoa học tự nhiên 7 - Kết Nối Tri Thức (Bài 35: Cảm ứng ở thực vật - Tính hướng sáng)",
    summary: "Chứng minh tính hướng sáng dương của ngọn cây mầm do sự phân bố không đồng đều của hormone Auxin dưới tác dụng của ánh sáng đơn hướng.",
    summaryEn: "Demonstrate positive phototropism in plant shoots caused by asymmetrical distribution of Auxin hormone.",
    badge: "KHTN 7 KNTT",
    apparatus: [
      "Chậu cây mầm đậu xanh đang sinh trưởng",
      "Hộp thí nghiệm cản quang có cửa sổ chiếu sáng",
      "Đèn LED chiếu sáng điều chỉnh hướng (trái, trên, phải, tối)",
      "Kính hiển vi phóng đại tế bào mô thân",
      "Cảm biến đo góc uốn cong thân cây"
    ],
    steps: [
      "Bước 1: Đặt chậu cây mầm đậu xanh vào hộp thí nghiệm.",
      "Bước 2: Chọn hướng nguồn sáng: Chiếu bên trái, Chiếu từ trên đỉnh, Chiếu bên phải hoặc Che tối hoàn toàn.",
      "Bước 3: Kéo thanh trượt thời gian sinh trưởng (0h - 72h) để quan sát thân cây uốn cong dần về phía ánh sáng.",
      "Bước 4: Bật 'Bản đồ Auxin' để đối chiếu nồng độ hormone Auxin tập trung nhiều ở phía tối kích thích tế bào dãn dài."
    ],
    bilingualVocabulary: [
      { vi: "Tính hướng sáng", en: "Phototropism", ipa: "/ˌfoʊtoʊˈtroʊpɪzəm/" },
      { vi: "Hormone sinh trưởng Auxin", en: "Auxin Growth Hormone", ipa: "/ˈɔːksɪn ˈhɔːrmoʊn/" },
      { vi: "Sự dãn dài tế bào", en: "Cell Elongation", ipa: "/sɛl ɪˌlɒŋˈɡeɪʃən/" },
      { vi: "Cảm ứng thực vật", en: "Plant Irritability / Tropism", ipa: "/ˈtroʊpɪzəm/" },
    ],
    quiz: {
      question: "Vì sao ngọn cây mầm lại uốn cong về phía có nguồn ánh sáng đơn hướng?",
      options: [
        "Do hormone Auxin tập trung nhiều hơn ở phía tối, kích thích tế bào phía tối dãn dài nhanh hơn phía sáng",
        "Do ánh sáng hút trực tiếp các tế bào thực vật về phía nguồn sáng",
        "Do các tế bào ở phía chiếu sáng sinh trưởng nhanh hơn các tế bào ở phía tối",
        "Do lá cây bị nặng hơn ở phía có ánh sáng"
      ],
      correct: 0,
      explanation: "Ánh sáng đơn hướng làm hormone Auxin phân bố không đồng đều (tập trung nhiều ở phía bị che tối). Nồng độ Auxin cao kích thích tế bào phía tối sinh trưởng dãn dài nhanh hơn phía sáng, khiến ngọn cây uốn cong về phía có nguồn sáng."
    }
  },
  {
    id: "exothermic_endothermic_reaction",
    title: "Thí nghiệm Phản ứng Tỏa nhiệt & Thu nhiệt trong Hóa học",
    titleEn: "Exothermic & Endothermic Chemical Reactions Lab",
    subject: "chemistry",
    grade: "8",
    textbookRef: "SGK Khoa học tự nhiên 8 - Kết Nối Tri Thức (Bài 8: Tác dụng nhiệt của phản ứng - Tỏa nhiệt & Thu nhiệt)",
    summary: "Khảo sát sự thay đổi nhiệt độ môi trường phản ứng: Phản ứng tỏa nhiệt (giải phóng năng lượng, nhiệt độ tăng) và thu nhiệt (hấp thu năng lượng, nhiệt độ giảm).",
    summaryEn: "Investigate temperature shifts in exothermic (releasing heat, temp rises) and endothermic reactions (absorbing heat, temp drops).",
    badge: "KHTN 8 KNTT",
    apparatus: [
      "Bình phản ứng cách nhiệt (Nhiệt lượng kế)",
      "Nhiệt kế kỹ thuật số đo nhiệt độ thời gian thực (°C)",
      "Cốc đựng nước và que khuấy từ",
      "Vôi sống CaO & Muối amoni clorua NH₄Cl",
      "Tấm lót gỗ có giọt nước (thử đóng băng)"
    ],
    steps: [
      "Bước 1: Đo nhiệt độ ban đầu của nước cất trong cốc (T₀ = 25°C).",
      "Bước 2: Chọn loại phản ứng: Tỏa nhiệt (CaO + H₂O) hoặc Thu nhiệt (NH₄Cl + H₂O / Ba(OH)₂ + NH₄SCN).",
      "Bước 3: Nhấn 'Đổ hóa chất vào cốc' và theo dõi đồ thị nhiệt độ thay đổi trên nhiệt kế số.",
      "Bước 4: Quan sát hiện tượng kèm theo: Bốc hơi nước nóng (tỏa nhiệt) hoặc giọt nước đáy cốc đóng băng dính chặt tấm gỗ (thu nhiệt)."
    ],
    bilingualVocabulary: [
      { vi: "Phản ứng tỏa nhiệt", en: "Exothermic Reaction", ipa: "/ˌɛksoʊˈθɜːrmɪk riˈækʃən/" },
      { vi: "Phản ứng thu nhiệt", en: "Endothermic Reaction", ipa: "/ˌɛndoʊˈθɜːrmɪk riˈækʃən/" },
      { vi: "Biến thiên Enthalpy (ΔH)", en: "Enthalpy Change", ipa: "/ˈɛnθəlpi tʃeɪndʒ/" },
      { vi: "Nhiệt lượng kế", en: "Calorimeter", ipa: "/ˌkæləˈrɪmɪtər/" },
    ],
    quiz: {
      question: "Hiện tượng nào sau đây là dấu hiệu rõ rệt của một phản ứng tỏa nhiệt (Exothermic)?",
      options: [
        "Nhiệt độ hỗn hợp phản ứng tăng lên, tỏa nhiệt ra môi trường xung quanh",
        "Nhiệt độ hỗn hợp phản ứng hạ xuống thấp hơn nhiệt độ phòng",
        "Thành bình phản ứng lạnh ngắt và xuất hiện lớp sương băng",
        "Phản ứng cần phải cung cấp nhiệt liên tục mới diễn ra"
      ],
      correct: 0,
      explanation: "Phản ứng tỏa nhiệt giải phóng năng lượng ra môi trường dưới dạng nhiệt, làm nhiệt độ của hỗn hợp và môi trường xung quanh tăng lên (ví dụ: vôi sống tôi với nước)."
    }
  },
  {
    id: "electrolysis_copper_chloride",
    title: "Thí nghiệm Điện phân dung dịch Đồng(II) clorua (CuCl2)",
    titleEn: "Electrolysis of Copper(II) Chloride Solution Lab",
    subject: "chemistry",
    grade: "9",
    textbookRef: "SGK Khoa học tự nhiên 9 - Kết Nối Tri Thức (Bài 19: Sự điện phân - Điện phân dung dịch CuCl₂)",
    summary: "Khảo sát dòng điện một chiều phân tách dung dịch CuCl₂: Kim loại Cu màu đỏ bám trên cực âm (Cathode), khí Cl₂ màu vàng lục mùi xốc thoát ra ở cực dương (Anode).",
    summaryEn: "Investigate DC electrolysis of CuCl₂ solution: Copper metal deposits on Cathode, and green-yellow Chlorine gas evolves at Anode.",
    badge: "KHTN 9 KNTT",
    apparatus: [
      "Bình điện phân thủy tinh dung tích 250ml",
      "2 điện cực than chì (Graphite) trơ",
      "Nguồn điện một chiều biến thiên DC (0 - 12V)",
      "Ampe kế đo cường độ dòng điện điện phân",
      "Dung dịch CuCl₂ màu xanh lam đặc trưng",
      "Giấy quỳ tím ẩm thử khí Clo"
    ],
    steps: [
      "Bước 1: Đổ dung dịch CuCl₂ vào bình điện phân, nhúng ngập 2 điện cực than chì.",
      "Bước 2: Nối điện cực với nguồn điện DC và bật công tắc đóng mạch (Switch ON).",
      "Bước 3: Điều chỉnh hiệu điện thế nguồn (U: 3V - 12V) và quan sát hiện tượng ở 2 điện cực.",
      "Bước 4: Quan sát ở cực âm (-) có lớp kim loại đồng màu đỏ bám vào; ở cực dương (+) có bọt khí Cl₂ sủi lên làm mất màu giấy quỳ tím ẩm."
    ],
    bilingualVocabulary: [
      { vi: "Sự điện phân", en: "Electrolysis", ipa: "/ɪˌlɛkˈtrɒləsɪs/" },
      { vi: "Cực âm (Cathode)", en: "Cathode", ipa: "/ˈkæθoʊd/" },
      { vi: "Cực dương (Anode)", en: "Anode", ipa: "/ˈænoʊd/" },
      { vi: "Khí Clo & Đồng kết tủa", en: "Chlorine Gas & Copper Deposit", ipa: "/ˈklɔːriːn ɡæs/" },
    ],
    quiz: {
      question: "Trong thí nghiệm điện phân dung dịch CuCl₂, hiện tượng quan sát được ở cực âm (Cathode nối với cực âm của nguồn điện) là gì?",
      options: [
        "Có lớp kim loại màu đỏ gạch (đồng Cu) bám vào bề mặt điện cực",
        "Có bọt khí màu vàng lục mùi hắc sủi lên",
        "Điện cực bị tan dần vào dung dịch",
        "Dung dịch quanh điện cực chuyển sang màu hồng đậm"
      ],
      correct: 0,
      explanation: "Tại cực âm (Cathode), các ion Cu²⁺ mang điện tích dương chuyển dịch về và nhận electron: Cu²⁺ + 2e → Cu (kim loại). Lớp đồng màu đỏ gạch bám chắc vào điện cực than chì."
    }
  }
];

const getSliderNum = (val: number | readonly number[]): number =>
  typeof val === "number" ? val : (val[0] ?? 0);

export const EXPERIMENT_SHORT_TITLES: Record<string, string> = {
  ohm_circuit: "Định luật Ôm & Mạch điện",
  archimedes_buoyancy: "Lực đẩy Ác-si-mét",
  chemical_mass_conservation: "Bảo toàn khối lượng",
  optics_refraction: "Khúc xạ & Lăng kính",
  fluid_pressure_vessels: "Áp suất chất lỏng",
  optics_convex_lens: "Thấu kính hội tụ",
  electromagnet_field: "Nam châm điện",
  reaction_rate_factors: "Tốc độ phản ứng hóa học",
  photosynthesis_starch: "Quang hợp & Tinh bột",
  mixture_separation: "Tách chất khỏi hỗn hợp",
  friction_force: "Khảo sát lực ma sát",
  optics_plane_mirror: "Phản xạ qua gương phẳng",
  sound_reflection_echo: "Phản xạ âm & Tiếng vang",
  lever_balance: "Cân bằng đòn bẩy",
  acid_base_ph_indicator: "Đo pH & Chất chỉ thị",
  osmosis_cell_turgor: "Thẩm thấu & Co nguyên sinh",
  electromagnetic_induction: "Cảm ứng điện từ & Lenz",
  sound_oscilloscope_frequency: "Dao động âm & Tần số",
  thermal_expansion_solids: "Sự nở vì nhiệt chất rắn",
  spring_hooke_elasticity: "Độ dãn lò xo & Định luật Húc",
  plant_phototropism: "Tính hướng sáng & Auxin",
  exothermic_endothermic_reaction: "Tỏa nhiệt & Thu nhiệt",
  electrolysis_copper_chloride: "Điện phân dung dịch CuCl2",
};

export function getExperimentShortTitle(exp: LabExperiment): string {
  return EXPERIMENT_SHORT_TITLES[exp.id] || exp.title.replace(/^Thí nghiệm\s+/, "");
}

export const EXPERIMENT_VISUAL_META: Record<
  string,
  {
    gradient: string;
    icon: typeof Zap;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  ohm_circuit: {
    gradient: "from-amber-600 via-orange-600 to-indigo-950",
    icon: Zap,
    accentColor: "#f59e0b",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
  },
  archimedes_buoyancy: {
    gradient: "from-cyan-600 via-blue-600 to-indigo-950",
    icon: Waves,
    accentColor: "#06b6d4",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-400",
  },
  chemical_mass_conservation: {
    gradient: "from-purple-600 via-violet-600 to-slate-950",
    icon: FlaskConical,
    accentColor: "#a855f7",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-400",
  },
  optics_refraction: {
    gradient: "from-pink-600 via-rose-600 to-indigo-950",
    icon: Eye,
    accentColor: "#ec4899",
    badgeBg: "bg-pink-500/20",
    badgeText: "text-pink-400",
  },
  fluid_pressure_vessels: {
    gradient: "from-blue-600 via-cyan-600 to-slate-950",
    icon: Waves,
    accentColor: "#3b82f6",
    badgeBg: "bg-blue-500/20",
    badgeText: "text-blue-400",
  },
  optics_convex_lens: {
    gradient: "from-indigo-600 via-purple-600 to-slate-950",
    icon: Eye,
    accentColor: "#6366f1",
    badgeBg: "bg-indigo-500/20",
    badgeText: "text-indigo-400",
  },
  electromagnet_field: {
    gradient: "from-red-600 via-rose-700 to-slate-950",
    icon: Magnet,
    accentColor: "#ef4444",
    badgeBg: "bg-red-500/20",
    badgeText: "text-red-400",
  },
  reaction_rate_factors: {
    gradient: "from-amber-600 via-emerald-600 to-slate-950",
    icon: Sparkles,
    accentColor: "#f59e0b",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
  },
  photosynthesis_starch: {
    gradient: "from-emerald-600 via-green-600 to-teal-950",
    icon: Leaf,
    accentColor: "#10b981",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
  },
  mixture_separation: {
    gradient: "from-teal-600 via-cyan-700 to-slate-950",
    icon: FlaskConical,
    accentColor: "#14b8a6",
    badgeBg: "bg-teal-500/20",
    badgeText: "text-teal-400",
  },
  friction_force: {
    gradient: "from-orange-600 via-amber-700 to-slate-950",
    icon: Sliders,
    accentColor: "#f97316",
    badgeBg: "bg-orange-500/20",
    badgeText: "text-orange-400",
  },
  optics_plane_mirror: {
    gradient: "from-indigo-600 via-cyan-700 to-slate-950",
    icon: Eye,
    accentColor: "#6366f1",
    badgeBg: "bg-indigo-500/20",
    badgeText: "text-indigo-400",
  },
  sound_reflection_echo: {
    gradient: "from-purple-600 via-indigo-700 to-slate-950",
    icon: Volume2,
    accentColor: "#8b5cf6",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-400",
  },
  lever_balance: {
    gradient: "from-amber-600 via-yellow-700 to-slate-950",
    icon: Compass,
    accentColor: "#f59e0b",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
  },
  acid_base_ph_indicator: {
    gradient: "from-pink-600 via-fuchsia-700 to-purple-950",
    icon: FlaskConical,
    accentColor: "#d946ef",
    badgeBg: "bg-pink-500/20",
    badgeText: "text-pink-400",
  },
  osmosis_cell_turgor: {
    gradient: "from-emerald-600 via-teal-700 to-slate-950",
    icon: Leaf,
    accentColor: "#10b981",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
  },
  electromagnetic_induction: {
    gradient: "from-cyan-600 via-blue-700 to-indigo-950",
    icon: Magnet,
    accentColor: "#06b6d4",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-400",
  },
  sound_oscilloscope_frequency: {
    gradient: "from-violet-600 via-purple-700 to-slate-950",
    icon: Waves,
    accentColor: "#8b5cf6",
    badgeBg: "bg-violet-500/20",
    badgeText: "text-violet-400",
  },
  thermal_expansion_solids: {
    gradient: "from-rose-600 via-red-700 to-amber-950",
    icon: Flame,
    accentColor: "#f43f5e",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-400",
  },
  spring_hooke_elasticity: {
    gradient: "from-cyan-600 via-blue-700 to-slate-950",
    icon: Sliders,
    accentColor: "#06b6d4",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-400",
  },
  plant_phototropism: {
    gradient: "from-amber-500 via-emerald-600 to-green-950",
    icon: Sun,
    accentColor: "#eab308",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
  },
  exothermic_endothermic_reaction: {
    gradient: "from-red-600 via-orange-600 to-cyan-950",
    icon: Flame,
    accentColor: "#ef4444",
    badgeBg: "bg-red-500/20",
    badgeText: "text-red-400",
  },
  electrolysis_copper_chloride: {
    gradient: "from-cyan-600 via-sky-600 to-amber-950",
    icon: Zap,
    accentColor: "#0284c7",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-400",
  },
};

export function getExperimentMeta(id: string) {
  return (
    EXPERIMENT_VISUAL_META[id] || {
      gradient: "from-purple-600 via-indigo-600 to-slate-950",
      icon: FlaskConical,
      accentColor: "#8b5cf6",
      badgeBg: "bg-purple-500/20",
      badgeText: "text-purple-400",
    }
  );
}

export interface VirtualLabSimulatorProps {
  initialExpId?: string;
  initialViewMode?: "catalog" | "detail";
  embedded?: boolean;
}

export function VirtualLabSimulator({
  initialExpId,
  initialViewMode,
  embedded = false,
}: VirtualLabSimulatorProps = {}) {
  const { locale } = useLang();
  const { token, user } = useAuth();
  const isVi = locale === "vi";
  const [labDisplayMode, setLabDisplayMode] =
    useState<LabDisplayMode>("both");
  const [speechMessage, setSpeechMessage] = useState("");

  const speakVocabulary = (term: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      setSpeechMessage(
        isVi
          ? "Trình duyệt này chưa hỗ trợ phát âm."
          : "Speech is not supported in this browser.",
      );
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = "en-US";
    utterance.onerror = () => {
      setSpeechMessage(
        isVi ? "Không thể phát âm lúc này." : "Could not play pronunciation.",
      );
    };
    setSpeechMessage("");
    window.speechSynthesis.speak(utterance);
  };

  // View mode: "catalog" (Danh sách 23 bài hiển thị mặc định) hoặc "detail" (Trang chi tiết bài đang chọn)
  const [viewMode, setViewMode] = useState<"catalog" | "detail">(() => {
    if (initialViewMode) return initialViewMode;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("id")) return "detail";
    }
    return "catalog";
  });

  // Selected experiment ID
  const [selectedExpId, setSelectedExpId] = useState<string>(() => {
    if (initialExpId && KNTT_EXPERIMENTS.some((e) => e.id === initialExpId)) {
      return initialExpId;
    }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlId = p.get("id");
      if (urlId && KNTT_EXPERIMENTS.some((e) => e.id === urlId)) {
        return urlId;
      }
    }
    return "ohm_circuit";
  });
  const currentExp = useMemo(() => {
    return KNTT_EXPERIMENTS.find((e) => e.id === selectedExpId) || KNTT_EXPERIMENTS[0];
  }, [selectedExpId]);
  const labTranslationItems = useMemo(
    () => [
      { id: "textbook-reference", text: currentExp.textbookRef },
      ...currentExp.apparatus.map((text, idx) => ({
        id: `apparatus-${idx}`,
        text,
      })),
      ...currentExp.steps.map((text, idx) => ({ id: `step-${idx}`, text })),
      { id: "quiz-question", text: currentExp.quiz.question },
      ...currentExp.quiz.options.map((text, idx) => ({
        id: `quiz-option-${idx}`,
        text,
      })),
      { id: "quiz-explanation", text: currentExp.quiz.explanation },
    ],
    [currentExp],
  );
  const [labTranslationState, setLabTranslationState] = useState<{
    experimentId: string;
    translations: Record<string, string>;
    error: string;
  }>({ experimentId: "", translations: {}, error: "" });
  const [translationRetryKey, setTranslationRetryKey] = useState(0);

  useEffect(() => {
    if (viewMode !== "detail") return;

    let active = true;
    translateLabTexts(labTranslationItems)
      .then((translations) => {
        if (active) {
          setLabTranslationState({
            experimentId: currentExp.id,
            translations,
            error: "",
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLabTranslationState({
            experimentId: currentExp.id,
            translations: {},
            error:
              error instanceof Error
                ? error.message
                : "Không thể tải bản dịch song ngữ.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentExp.id, labTranslationItems, translationRetryKey, viewMode]);

  const labTranslations =
    labTranslationState.experimentId === currentExp.id
      ? labTranslationState.translations
      : {};
  const labTranslationError =
    labTranslationState.experimentId === currentExp.id
      ? labTranslationState.error
      : "";
  const isTranslatingLab =
    viewMode === "detail" &&
    labTranslationState.experimentId !== currentExp.id;

  const [labModels, setLabModels] = useState<LabModelRecord[]>([]);
  const [labModelFile, setLabModelFile] = useState<File | null>(null);
  const [labModelTitle, setLabModelTitle] = useState("");
  const [isUploadingLabModel, setIsUploadingLabModel] = useState(false);
  const [labModelError, setLabModelError] = useState("");
  const currentLabModel = labModels.find(
    (model) => model.experimentId === currentExp.id,
  );
  const canManageLabModels =
    user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    let active = true;
    fetchLabModels()
      .then((models) => {
        if (active) setLabModels(models);
      })
      .catch((error: unknown) => {
        if (active) {
          setLabModelError(
            error instanceof Error
              ? error.message
              : "Không thể tải mô hình Lab.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLabModelUpload = async () => {
    if (!token || !labModelFile) return;
    if (!labModelFile.name.toLowerCase().endsWith(".glb")) {
      setLabModelError("Chỉ hỗ trợ mô hình GLB (.glb).");
      return;
    }
    if (labModelFile.size > 100 * 1024 * 1024) {
      setLabModelError("Mô hình 3D không được vượt quá 100 MB.");
      return;
    }

    setIsUploadingLabModel(true);
    setLabModelError("");
    try {
      const savedModel = await uploadLabModel(
        token,
        currentExp.id,
        labModelFile,
        labModelTitle.trim() || currentExp.title,
      );
      setLabModels((models) => [
        ...models.filter((model) => model.experimentId !== savedModel.experimentId),
        savedModel,
      ]);
      setLabModelFile(null);
      setLabModelTitle("");
    } catch (error) {
      setLabModelError(
        error instanceof Error ? error.message : "Không thể tải mô hình lên.",
      );
    } finally {
      setIsUploadingLabModel(false);
    }
  };

  // Sound effects mute toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playSound = (type: "click" | "bubble" | "laser" | "splash" | "beep") => {
    if (soundEnabled) playLabSound(type);
  };

  // --------------------------------------------------------------------------
  // STATE CHO TỪNG BÀI THÍ NGHIỆM
  // --------------------------------------------------------------------------
  // 1. Mạch điện Ôm
  const [voltage, setVoltage] = useState(12); // V
  const [resistance, setResistance] = useState(10); // Ohm
  const [isSwitchClosed, setIsSwitchClosed] = useState(true);

  // 2. Lực đẩy Ác-si-mét
  const [buoyancyMaterial, setBuoyancyMaterial] = useState<"iron" | "aluminum" | "wood">("aluminum");
  const [liquidType, setLiquidType] = useState<"water" | "salt_water" | "oil">("water");
  const [submergedPercent, setSubmergedPercent] = useState(70); // 0 to 100%

  // 3. Bảo toàn khối lượng hóa học
  const [reactionStep, setReactionStep] = useState<"initial" | "mixed">("initial");
  const [chemicalType, setChemicalType] = useState<"bacl2_na2so4" | "cuso4_naoh">("bacl2_na2so4");

  // 4. Khúc xạ ánh sáng
  const [incidenceAngle, setIncidenceAngle] = useState(45); // Degrees
  const [lightSourceType, setLightSourceType] = useState<"red_laser" | "green_laser" | "white_prism">("red_laser");

  // 5. Áp suất chất lỏng
  const [fluidDepth, setFluidDepth] = useState(25); // cm
  const [probeOrientation, setProbeOrientation] = useState<"down" | "up" | "side">("down");
  const [fluidMode, setFluidMode] = useState<"depth_probe" | "communicating_vessels">("depth_probe");

  // 6. Thấu kính hội tụ (KHTN 9 Bài 6)
  const [lensFocalLength, setLensFocalLength] = useState(15); // cm
  const [objectDistance, setObjectDistance] = useState(30); // cm
  const [objectHeight, setObjectHeight] = useState(4); // cm

  // 7. Nam châm điện (KHTN 7 Bài 21)
  const [magnetSwitch, setMagnetSwitch] = useState(true);
  const [coilTurns, setCoilTurns] = useState<50 | 100 | 200>(100);
  const [magnetCurrent, setMagnetCurrent] = useState(1.5); // A
  const [hasIronCore, setHasIronCore] = useState(true);

  // 8. Tốc độ phản ứng hóa học (KHTN 8 Bài 11)
  const [acidConcentration, setAcidConcentration] = useState<0.5 | 2.0>(2.0); // M
  const [reactionTemp, setReactionTemp] = useState<25 | 60>(25); // °C
  const [zincForm, setZincForm] = useState<"granule" | "powder">("granule");
  const [hasReactionCatalyst, setHasReactionCatalyst] = useState(false);
  const [reactionProgress, setReactionProgress] = useState(0); // 0 to 100%
  const [isReacting, setIsReacting] = useState(false);

  // 9. Quang hợp & Tinh bột (KHTN 7 Bài 23)
  const [starchStep, setStarchStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // 10. Tách chất hỗn hợp (KHTN 6 Bài 20)
  const [separationMethod, setSeparationMethod] = useState<"filter" | "evaporate">("filter");
  const [separationProgress, setSeparationProgress] = useState(0); // 0 to 100%
  const [isSeparating, setIsSeparating] = useState(false);
  const [flameLevel, setFlameLevel] = useState<"low" | "medium" | "high">("medium");

  // 11. Lực ma sát (KHTN 6 Bài 40)
  const [surfaceType, setSurfaceType] = useState<"glass" | "wood" | "sandpaper">("wood");
  const [blockMassG, setBlockMassG] = useState(200); // 100 to 500 g
  const [isPullingBlock, setIsPullingBlock] = useState(false);

  // 12. Định luật phản xạ ánh sáng (KHTN 7 Bài 12)
  const [mirrorMode, setMirrorMode] = useState<"rays" | "object_image">("rays");
  const [mirrorIncidenceAngle, setMirrorIncidenceAngle] = useState(40); // 0 to 75 deg
  const [mirrorObjectDist, setMirrorObjectDist] = useState(20); // 10 to 40 cm
  const [mirrorObjectHeight, setMirrorObjectHeight] = useState(5); // 2 to 8 cm

  // 13. Phản xạ âm & Tiếng vang (KHTN 7 Bài 14)
  const [barrierDistance, setBarrierDistance] = useState(25); // 5 to 50 m
  const [barrierMaterial, setBarrierMaterial] = useState<"cliff" | "brick_wall" | "curtain">("cliff");
  const [isEmittingSound, setIsEmittingSound] = useState(false);
  const [soundWavePos, setSoundWavePos] = useState(0); // 0 to 100%

  // 14. Đòn bẩy & Cân bằng mô-men (KHTN 8 Bài 19)
  const [leftArmD1, setLeftArmD1] = useState(30); // 10 to 50 cm
  const [leftMassM1, setLeftMassM1] = useState(200); // 50 to 500 g
  const [rightArmD2, setRightArmD2] = useState(30); // 10 to 50 cm
  const [rightMassM2, setRightMassM2] = useState(200); // 50 to 500 g

  // 15. Đo pH & Chỉ thị màu Acid - Base (KHTN 8 Bài 9)
  const [selectedPhSample, setSelectedPhSample] = useState<"lemon" | "vinegar" | "pure_water" | "soap" | "naoh">("lemon");
  const [selectedIndicator, setSelectedIndicator] = useState<"litmus" | "phenolphthalein" | "universal">("litmus");
  const [isIndicatorApplied, setIsIndicatorApplied] = useState(false);

  // 16. Thẩm thấu & Co nguyên sinh (KHTN 6 Bài 17 / KHTN 7 Bài 28)
  const [osmosisMedium, setOsmosisMedium] = useState<"hypertonic" | "isotonic" | "hypotonic">("hypertonic");
  const [osmosisProgress, setOsmosisProgress] = useState(80); // 0 to 100%
  const [microscopeZoom, setMicroscopeZoom] = useState<"100x" | "400x">("400x");

  // 17. Cảm ứng điện từ & Định luật Lenz (KHTN 9 Bài 14)
  const [magnetX, setMagnetX] = useState(0); // -80 to 80 mm
  const [magnetOrientation, setMagnetOrientation] = useState<"N_left" | "S_left">("N_left");
  const [inductionCoilTurns, setInductionCoilTurns] = useState<200 | 500 | 1000>(500);
  const [isAutoOscillating, setIsAutoOscillating] = useState(false);
  const [magnetVelocity, setMagnetVelocity] = useState(0);

  // 18. Dao động ký âm thanh (KHTN 7 Bài 13)
  const [oscFreqHz, setOscFreqHz] = useState(440); // 100 to 2000 Hz
  const [oscAmplitude, setOscAmplitude] = useState(60); // 10 to 100 %
  const [oscWaveform, setOscWaveform] = useState<"sine" | "triangle" | "square">("sine");
  const [isPlayingAudioTone, setIsPlayingAudioTone] = useState(false);
  const oscAudioContextRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  // 19. Sự nở vì nhiệt chất rắn 's Gravesande (KHTN 6 Bài 8 / KHTN 8 Bài 26)
  const [solidBallMetal, setSolidBallMetal] = useState<"aluminum" | "copper" | "iron">("copper");
  const [solidBallTemp, setSolidBallTemp] = useState(25); // 20 to 300 °C
  const [isHeatingBall, setIsHeatingBall] = useState(false);
  const [isBallTestedPass, setIsBallTestedPass] = useState(false);

  // 20. Độ dãn lò xo & Định luật Húc (KHTN 6 Bài 36)
  const [springK, setSpringK] = useState<number>(50); // N/m (20, 50, 100)
  const [hangingMassG, setHangingMassG] = useState<number>(100); // 0, 50, 100, 150, 200, 250, 300g
  const [isSpringBouncing, setIsSpringBouncing] = useState<boolean>(false);
  const [springBounceOffset, setSpringBounceOffset] = useState<number>(0);

  // 21. Tính hướng sáng ở ngọn cây mầm (KHTN 7 Bài 35)
  const [lightDirection, setLightDirection] = useState<"left" | "top" | "right" | "dark">("left");
  const [phototropismHours, setPhototropismHours] = useState<number>(48); // 0 to 72 hours
  const [showAuxinHeatmap, setShowAuxinHeatmap] = useState<boolean>(true);

  // 22. Phản ứng Tỏa nhiệt & Thu nhiệt (KHTN 8 Bài 8)
  const [thermalReactionType, setThermalReactionType] = useState<"exothermic_cao" | "exothermic_acid_base" | "endothermic_nh4cl" | "endothermic_barium">("exothermic_cao");
  const [reagentAmountG, setReagentAmountG] = useState<number>(15); // 5 to 25g
  const [isThermalReacting, setIsThermalReacting] = useState<boolean>(false);
  const [thermalReactionTemp, setThermalReactionTemp] = useState<number>(25); // °C

  // 23. Điện phân dung dịch CuCl2 (KHTN 9 Bài 19)
  const [electrolysisVoltage, setElectrolysisVoltage] = useState<number>(6); // 3 to 12V
  const [isElectrolysisSwitchClosed, setIsElectrolysisSwitchClosed] = useState<boolean>(true);
  const [electrolysisCuCl2Concentration, setElectrolysisCuCl2Concentration] = useState<number>(0.5); // M
  const [electrolysisSeconds, setElectrolysisSeconds] = useState<number>(30); // 0 to 120s

  // Bộ lọc Khối lớp và Môn học KNTT
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"all" | "6" | "7" | "8" | "9">("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<"all" | "physics" | "chemistry" | "biology">("all");

  // Tìm kiếm & Điều hướng cuộn mượt
  const [searchQuery, setSearchQuery] = useState("");
  const labStageRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Danh sách bài thí nghiệm đã lọc theo Khối, Môn và Từ khóa tìm kiếm
  const filteredExperiments = useMemo(() => {
    return KNTT_EXPERIMENTS.filter((exp) => {
      const matchGrade = selectedGradeFilter === "all" || exp.grade === selectedGradeFilter;
      const matchSubject = selectedSubjectFilter === "all" || exp.subject === selectedSubjectFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        exp.title.toLowerCase().includes(q) ||
        exp.titleEn.toLowerCase().includes(q) ||
        exp.summary.toLowerCase().includes(q) ||
        exp.textbookRef.toLowerCase().includes(q) ||
        exp.apparatus.some((a) => a.toLowerCase().includes(q));
      return matchGrade && matchSubject && matchSearch;
    });
  }, [selectedGradeFilter, selectedSubjectFilter, searchQuery]);

  // Đồng bộ URL & hỗ trợ nút Back / Forward trên trình duyệt
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Kiểm tra query param 'id' khi component mount
    const p = new URLSearchParams(window.location.search);
    const urlId = p.get("id");
    if (urlId && KNTT_EXPERIMENTS.some((e) => e.id === urlId)) {
      setSelectedExpId(urlId);
      setViewMode("detail");
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id && KNTT_EXPERIMENTS.some((e) => e.id === id)) {
        setSelectedExpId(id);
        setViewMode("detail");
      } else {
        setViewMode("catalog");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenExperiment = (id: string) => {
    setSelectedExpId(id);
    setViewMode("detail");
    playSound("click");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", id);
      window.history.pushState({ expId: id }, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToCatalog = () => {
    setViewMode("catalog");
    playSound("click");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.pushState({}, "", url.pathname);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentExpIndex = useMemo(() => {
    const idx = KNTT_EXPERIMENTS.findIndex((e) => e.id === selectedExpId);
    return idx >= 0 ? idx : 0;
  }, [selectedExpId]);

  const handlePrevExperiment = () => {
    const prevIdx = (currentExpIndex - 1 + KNTT_EXPERIMENTS.length) % KNTT_EXPERIMENTS.length;
    handleOpenExperiment(KNTT_EXPERIMENTS[prevIdx].id);
  };

  const handleNextExperiment = () => {
    const nextIdx = (currentExpIndex + 1) % KNTT_EXPERIMENTS.length;
    handleOpenExperiment(KNTT_EXPERIMENTS[nextIdx].id);
  };

  const relatedExperiments = useMemo(() => {
    return KNTT_EXPERIMENTS.filter(
      (e) => e.id !== currentExp.id && (e.grade === currentExp.grade || e.subject === currentExp.subject)
    ).slice(0, 3);
  }, [currentExp, selectedExpId]);

  // --------------------------------------------------------------------------
  // DATA LOGGER TABLE (Bảng ghi số liệu thực nghiệm)
  // --------------------------------------------------------------------------
  interface LogRow {
    id: string;
    expId: string;
    time: string;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
  }
  const [recordedData, setRecordedData] = useState<LogRow[]>([]);

  // Quiz state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);

  // Reset quiz when experiment changes
  useEffect(() => {
    setSelectedQuizAnswer(null);
    setShowQuizExplanation(false);
  }, [selectedExpId]);

  // --------------------------------------------------------------------------
  // TÍNH TOÁN VẬT LÝ / HÓA HỌC THỜI GIAN THỰC
  // --------------------------------------------------------------------------
  // Mạch điện:
  const currentAmp = useMemo(() => {
    if (!isSwitchClosed) return 0;
    return parseFloat((voltage / resistance).toFixed(2));
  }, [isSwitchClosed, voltage, resistance]);

  const powerWatt = useMemo(() => {
    return parseFloat((voltage * currentAmp).toFixed(2));
  }, [voltage, currentAmp]);

  // Ác-si-mét:
  // Khối lượng riêng (kg/m3): Sắt 7800, Nhôm 2700, Gỗ 500
  // Khối lượng riêng chất lỏng: Nước 1000, Nước muối 1150, Dầu 800
  const materialDensities = { iron: 7800, aluminum: 2700, wood: 500 };
  const liquidDensities = { water: 1000, salt_water: 1150, oil: 800 };
  const objVolumeM3 = 0.0001; // 100 cm3
  const objMassKg = materialDensities[buoyancyMaterial] * objVolumeM3;
  const inAirWeightN = parseFloat((objMassKg * 9.8).toFixed(2));
  const displacedVolM3 = objVolumeM3 * (submergedPercent / 100);
  const buoyantForceN = parseFloat((liquidDensities[liquidType] * 9.8 * displacedVolM3).toFixed(2));
  const dynamometerReadingN = useMemo(() => {
    const net = inAirWeightN - buoyantForceN;
    return Math.max(0, parseFloat(net.toFixed(2)));
  }, [inAirWeightN, buoyantForceN]);

  // Khúc xạ ánh sáng:
  // n1 = 1.0 (không khí), n2 = 1.5 (thủy tinh)
  const n1 = 1.0;
  const n2 = 1.5;
  const refractionAngle = useMemo(() => {
    const radI = (incidenceAngle * Math.PI) / 180;
    const sinR = (n1 * Math.sin(radI)) / n2;
    if (sinR > 1) return 90; // Phản xạ toàn phần
    const radR = Math.asin(sinR);
    return parseFloat(((radR * 180) / Math.PI).toFixed(1));
  }, [incidenceAngle]);

  // Áp suất chất lỏng:
  // p = d * h = rho * g * h
  const currentPressurePa = useMemo(() => {
    const rho = 1000; // Nước kg/m3
    const hMeter = fluidDepth / 100;
    return Math.round(rho * 9.8 * hMeter);
  }, [fluidDepth]);

  const manometerDiffCm = useMemo(() => {
    return parseFloat((fluidDepth * 1.0).toFixed(1));
  }, [fluidDepth]);

  // 6. Tính toán quang học Thấu kính hội tụ
  const lensCalculations = useMemo(() => {
    const f = lensFocalLength;
    const d = objectDistance;
    const h = objectHeight;
    if (d === f) {
      return {
        imageDistance: 9999,
        imageHeight: 9999,
        magnification: 9999,
        isReal: false,
        isInfinite: true,
        typeLabel: "Ảnh ở vô cực (Tia ló song song)"
      };
    }
    const dPrime = parseFloat(((d * f) / (d - f)).toFixed(1));
    const k = parseFloat((-dPrime / d).toFixed(2));
    const hPrime = parseFloat((Math.abs(k) * h).toFixed(1));
    const isReal = d > f;
    const typeLabel = isReal
      ? `Ảnh thật ngược chiều (k = ${k})`
      : `Ảnh ảo cùng chiều lớn hơn vật (k = ${Math.abs(k)})`;
    return {
      imageDistance: dPrime,
      imageHeight: hPrime,
      magnification: Math.abs(k),
      isReal,
      isInfinite: false,
      typeLabel
    };
  }, [lensFocalLength, objectDistance, objectHeight]);

  // 7. Tính toán Nam châm điện
  const electromagnetStrength = useMemo(() => {
    if (!magnetSwitch) return { attractedNails: 0, fieldLevel: "Không có từ trường", bTesla: 0 };
    const coreFactor = hasIronCore ? 8 : 1;
    const bTesla = parseFloat(((4 * Math.PI * 1e-7 * (coilTurns / 0.1) * magnetCurrent * coreFactor) * 100).toFixed(2));
    const nails = Math.min(32, Math.max(1, Math.round(magnetCurrent * (coilTurns / 25) * (hasIronCore ? 1.5 : 0.2))));
    const fieldLevel = nails > 20 ? "Từ trường rất mạnh" : nails > 8 ? "Từ trường trung bình" : "Từ trường yếu";
    return { attractedNails: nails, fieldLevel, bTesla };
  }, [magnetSwitch, magnetCurrent, coilTurns, hasIronCore]);

  // 8. Tính toán Tốc độ phản ứng hóa học
  const reactionRateCalculations = useMemo(() => {
    const concFactor = acidConcentration === 2.0 ? 2.5 : 1.0;
    const tempFactor = reactionTemp === 60 ? 2.8 : 1.0;
    const surfaceFactor = zincForm === "powder" ? 3.0 : 1.0;
    const catalystFactor = hasReactionCatalyst ? 2.2 : 1.0;
    const speedMultiplier = parseFloat((concFactor * tempFactor * surfaceFactor * catalystFactor).toFixed(1));
    const gasVolumeMl = Math.min(50, parseFloat(((reactionProgress / 100) * 50).toFixed(1)));
    return { speedMultiplier, gasVolumeMl };
  }, [acidConcentration, reactionTemp, zincForm, hasReactionCatalyst, reactionProgress]);

  // Tự động tăng reactionProgress khi isReacting = true
  useEffect(() => {
    if (!isReacting) return;
    const interval = setInterval(() => {
      setReactionProgress((prev) => {
        if (prev >= 100) {
          setIsReacting(false);
          return 100;
        }
        return Math.min(100, prev + 5);
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isReacting]);

  // 10. Tách chất hỗn hợp calculations & timer
  const separationCalculations = useMemo(() => {
    const isDone = separationProgress >= 100;
    const saltGrams = parseFloat(((separationProgress / 100) * 15).toFixed(1));
    const statusText = separationMethod === "filter"
      ? (isDone ? "Đã lọc hoàn tất: Bã cát trên giấy lọc, nước muối trong suốt trong cốc" : isSeparating ? "Đang lọc: Từng giọt dịch lọc nhỏ xuống cốc hứng..." : "Sẵn sàng lọc hỗn hợp cát và nước muối")
      : (isDone ? `Đã cô cạn hoàn toàn: Thu được ${saltGrams}g muối NaCl kết tinh trắng` : isSeparating ? `Nước đang sôi bay hơi mãnh liệt (Lửa ${flameLevel === "high" ? "lớn" : flameLevel === "medium" ? "vừa" : "nhỏ"})...` : "Sẵn sàng đun cô cạn dung dịch muối");
    return { isDone, saltGrams, statusText };
  }, [separationMethod, separationProgress, isSeparating, flameLevel]);

  useEffect(() => {
    if (!isSeparating) return;
    const speed = flameLevel === "high" ? 6 : flameLevel === "medium" ? 4 : 2;
    const interval = setInterval(() => {
      setSeparationProgress((prev) => {
        if (prev >= 100) {
          setIsSeparating(false);
          playSound("beep");
          return 100;
        }
        return Math.min(100, prev + speed);
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isSeparating, flameLevel]);

  // 11. Lực ma sát calculations
  const frictionCalculations = useMemo(() => {
    const mu = surfaceType === "glass" ? 0.12 : surfaceType === "wood" ? 0.32 : 0.65;
    const normalForceN = parseFloat(((blockMassG / 1000) * 9.8).toFixed(2));
    const frictionForceN = parseFloat((mu * normalForceN).toFixed(2));
    const pullReadingN = isPullingBlock ? frictionForceN : 0;
    const surfaceLabel = surfaceType === "glass" ? "Mặt kính bóng (μ = 0.12)" : surfaceType === "wood" ? "Mặt gỗ bào (μ = 0.32)" : "Giấy nhám ráp (μ = 0.65)";
    return { mu, normalForceN, frictionForceN, pullReadingN, surfaceLabel };
  }, [surfaceType, blockMassG, isPullingBlock]);

  // 12. Gương phẳng calculations
  const planeMirrorCalculations = useMemo(() => {
    const i = mirrorIncidenceAngle;
    const iPrime = i;
    const angleBetweenRays = 2 * i;
    const d = mirrorObjectDist;
    const dPrime = d;
    const h = mirrorObjectHeight;
    const hPrime = h;
    return { i, iPrime, angleBetweenRays, d, dPrime, h, hPrime };
  }, [mirrorIncidenceAngle, mirrorObjectDist, mirrorObjectHeight]);

  // 13. Phản xạ âm & Tiếng vang calculations
  const soundEchoCalculations = useMemo(() => {
    const v = 340; // m/s
    const deltaT = parseFloat(((2 * barrierDistance) / v).toFixed(3));
    const minTimeEcho = 0.067; // 1/15s
    const minDistanceEcho = 11.33; // m
    const canHearEcho = deltaT >= minTimeEcho && barrierMaterial !== "curtain";
    const barrierLabel = barrierMaterial === "cliff" ? "Vách đá hoa cương (Phản xạ 95%)" : barrierMaterial === "brick_wall" ? "Bức tường gạch (Phản xạ 80%)" : "Rèm nhung dày (Tiêu âm 85%)";
    const conclusion = barrierMaterial === "curtain"
      ? "Âm bị vật liệu xốp nhung hấp thụ gần như hoàn toàn, không tạo tiếng vang."
      : canHearEcho
      ? `Nghe rõ TIẾNG VANG dội lại sau ${deltaT}s (do s = ${barrierDistance}m ≥ ${minDistanceEcho}m, Δt ≥ ${minTimeEcho}s).`
      : `KHÔNG nghe được tiếng vang riêng biệt do s = ${barrierDistance}m < ${minDistanceEcho}m (Δt = ${deltaT}s < ${minTimeEcho}s, âm phản xạ chập vào âm trực tiếp).`;
    return { v, deltaT, canHearEcho, barrierLabel, conclusion, minDistanceEcho };
  }, [barrierDistance, barrierMaterial]);

  // Phát xung âm thanh cho thí nghiệm tiếng vang
  const emitLabSound = useCallback(() => {
    setIsEmittingSound(true);
    setSoundWavePos(0);
    playSound("beep");
    const interval = setInterval(() => {
      setSoundWavePos((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsEmittingSound(false);
          if (barrierMaterial !== "curtain" && barrierDistance >= 11.33) {
            setTimeout(() => playSound("beep"), 120);
          }
          return 100;
        }
        return prev + 5;
      });
    }, 35);
  }, [barrierMaterial, barrierDistance, soundEnabled]);

  // 14. Đòn bẩy calculations
  const leverCalculations = useMemo(() => {
    const f1 = parseFloat(((leftMassM1 / 1000) * 9.8).toFixed(2));
    const f2 = parseFloat(((rightMassM2 / 1000) * 9.8).toFixed(2));
    const m1 = parseFloat((f1 * (leftArmD1 / 100)).toFixed(2));
    const m2 = parseFloat((f2 * (rightArmD2 / 100)).toFixed(2));
    const deltaM = parseFloat((m2 - m1).toFixed(2));
    const isBalanced = Math.abs(deltaM) < 0.03;
    const tiltAngle = isBalanced ? 0 : Math.max(-14, Math.min(14, deltaM * 20));
    const idealD2 = parseFloat(((m1 / f2) * 100).toFixed(1));
    const advantage = parseFloat((leftArmD1 / rightArmD2).toFixed(2));
    return { f1, f2, m1, m2, deltaM, isBalanced, tiltAngle, idealD2, advantage };
  }, [leftMassM1, leftArmD1, rightMassM2, rightArmD2]);

  // 15. pH & Chỉ thị màu calculations
  const phCalculations = useMemo(() => {
    const sampleData = {
      lemon: { name: "Nước chanh tươi", formula: "C6H8O7 (Acid Citric)", ph: 2.4, env: "Acid mạnh" },
      vinegar: { name: "Giấm ăn 5%", formula: "CH3COOH (Acid Acetic)", ph: 3.0, env: "Acid yếu" },
      pure_water: { name: "Nước cất tinh khiết", formula: "H2O", ph: 7.0, env: "Trung tính" },
      soap: { name: "Nước xà phòng sinh hoạt", formula: "R-COONa", ph: 9.5, env: "Base nhẹ" },
      naoh: { name: "Dung dịch NaOH 0.1M", formula: "Sodium Hydroxide", ph: 13.0, env: "Base mạnh" },
    }[selectedPhSample];

    let indicatorColor = "#94a3b8";
    let indicatorLabel = "Chưa nhúng chất chỉ thị vào dung dịch";
    let paperColor = "#f1f5f9";

    if (isIndicatorApplied) {
      if (selectedIndicator === "litmus") {
        if (sampleData.ph < 6) {
          indicatorColor = "#ef4444";
          indicatorLabel = "Quỳ tím hóa ĐỎ (Môi trường Acid)";
        } else if (sampleData.ph > 8) {
          indicatorColor = "#3b82f6";
          indicatorLabel = "Quỳ tím hóa XANH (Môi trường Base)";
        } else {
          indicatorColor = "#a855f7";
          indicatorLabel = "Quỳ tím giữ màu TÍM (Môi trường Trung tính)";
        }
        paperColor = indicatorColor;
      } else if (selectedIndicator === "phenolphthalein") {
        if (sampleData.ph >= 8.3) {
          indicatorColor = "#ec4899";
          indicatorLabel = "Phenolphthalein chuyển sang HỒNG CÁNH SEN (Môi trường Base)";
        } else {
          indicatorColor = "#e2e8f0";
          indicatorLabel = "Phenolphthalein KHÔNG MÀU (Môi trường Acid / Trung tính)";
        }
        paperColor = indicatorColor;
      } else {
        // universal pH paper
        if (sampleData.ph <= 3) {
          indicatorColor = "#dc2626";
          paperColor = "#dc2626";
          indicatorLabel = `pH vạn năng: Đỏ cam đậm (pH ~ ${sampleData.ph})`;
        } else if (sampleData.ph < 7) {
          indicatorColor = "#f59e0b";
          paperColor = "#f59e0b";
          indicatorLabel = `pH vạn năng: Vàng cam (pH ~ ${sampleData.ph})`;
        } else if (sampleData.ph === 7) {
          indicatorColor = "#22c55e";
          paperColor = "#22c55e";
          indicatorLabel = "pH vạn năng: Xanh lá cây chuẩn (pH = 7.0)";
        } else if (sampleData.ph < 11) {
          indicatorColor = "#0284c7";
          paperColor = "#0284c7";
          indicatorLabel = `pH vạn năng: Xanh lam (pH ~ ${sampleData.ph})`;
        } else {
          indicatorColor = "#6d28d9";
          paperColor = "#6d28d9";
          indicatorLabel = `pH vạn năng: Tím thẫm (pH ~ ${sampleData.ph})`;
        }
      }
    }

    return { ...sampleData, indicatorColor, indicatorLabel, paperColor };
  }, [selectedPhSample, selectedIndicator, isIndicatorApplied]);

  // 16. Thẩm thấu & Co nguyên sinh calculations
  const osmosisCalculations = useMemo(() => {
    let vacuoleScale = 0.75;
    let title = "Đẳng trương (NaCl 0.9%)";
    let desc = "Nồng độ chất tan bằng dịch bào: Lượng nước đi vào và ra cân bằng, tế bào giữ nguyên trạng thái.";
    let waterDirection: "in" | "out" | "balanced" = "balanced";
    let isPlasmolyzed = false;

    if (osmosisMedium === "hypertonic") {
      vacuoleScale = Math.max(0.35, 0.85 - (osmosisProgress / 100) * 0.5);
      title = "Ưu trương (Dung dịch muối đặc NaCl 10%)";
      desc = "Nước thẩm thấu ra ngoài: Không bào co nhỏ lại, màng sinh chất tách khỏi thành cellulose (Co nguyên sinh).";
      waterDirection = "out";
      isPlasmolyzed = true;
    } else if (osmosisMedium === "hypotonic") {
      vacuoleScale = Math.min(0.96, 0.75 + (osmosisProgress / 100) * 0.21);
      title = "Nhược trương (Nước cất tinh khiết H2O)";
      desc = "Nước thẩm thấu ồ ạt vào tế bào: Không bào trương phồng ép màng sát thành tế bào (Trương bào / Phản co nguyên sinh).";
      waterDirection = "in";
      isPlasmolyzed = false;
    }

    return { vacuoleScale, title, desc, waterDirection, isPlasmolyzed };
  }, [osmosisMedium, osmosisProgress]);

  // 17. Cảm ứng điện từ calculations
  useEffect(() => {
    if (!isAutoOscillating) return;
    let step = 0;
    const interval = setInterval(() => {
      step += 0.08;
      const newX = Math.round(Math.sin(step) * 60);
      const vel = Math.round(Math.cos(step) * 60);
      setMagnetX(newX);
      setMagnetVelocity(vel);
    }, 40);
    return () => clearInterval(interval);
  }, [isAutoOscillating]);

  const inductionCalculations = useMemo(() => {
    const N = inductionCoilTurns;
    const orientationSign = magnetOrientation === "N_left" ? 1 : -1;
    const gradient = -magnetX / 80;
    const dPhiDt = (magnetVelocity / 40) * gradient * orientationSign;
    const inducedVoltageMv = parseFloat((-N * dPhiDt * 0.06).toFixed(1));
    const inducedCurrentMa = parseFloat((inducedVoltageMv / 8).toFixed(1));
    const needleAngle = Math.max(-45, Math.min(45, inducedCurrentMa * 1.8));
    const isGreenLedLit = needleAngle > 2.5;
    const isRedLedLit = needleAngle < -2.5;

    return { N, inducedVoltageMv, inducedCurrentMa, needleAngle, isGreenLedLit, isRedLedLit };
  }, [inductionCoilTurns, magnetOrientation, magnetX, magnetVelocity]);

  // 18. Dao động ký âm thanh calculations
  const oscilloscopeCalculations = useMemo(() => {
    const f = oscFreqHz;
    const periodMs = parseFloat((1000 / f).toFixed(2));
    const wavelengthCm = parseFloat(((340 / f) * 100).toFixed(1));
    const pitchCategory = f < 250 ? "Âm trầm (Bass)" : f <= 800 ? "Âm trung (Midrange)" : "Âm bổng / cao (Treble)";
    const loudnessCategory = oscAmplitude < 35 ? "Âm lượng nhỏ (Yếu)" : oscAmplitude <= 75 ? "Âm lượng vừa phải" : "Âm lượng lớn (Mạnh)";
    const decibelEst = Math.round(30 + (oscAmplitude / 100) * 55);

    return { f, periodMs, wavelengthCm, pitchCategory, loudnessCategory, decibelEst };
  }, [oscFreqHz, oscAmplitude]);

  // Web Audio Tone toggle
  const toggleOscAudioTone = () => {
    if (isPlayingAudioTone) {
      if (oscAudioContextRef.current) {
        try {
          oscAudioContextRef.current.osc.stop();
          oscAudioContextRef.current.ctx.close();
        } catch {}
        oscAudioContextRef.current = null;
      }
      setIsPlayingAudioTone(false);
      playSound("click");
    } else {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscWaveform;
        osc.frequency.setValueAtTime(oscFreqHz, ctx.currentTime);
        const safeVol = (oscAmplitude / 100) * 0.12;
        gain.gain.setValueAtTime(safeVol, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscAudioContextRef.current = { ctx, osc, gain };
        setIsPlayingAudioTone(true);
        playSound("click");
      } catch {
        // Audio policy
      }
    }
  };

  useEffect(() => {
    if (isPlayingAudioTone && oscAudioContextRef.current) {
      try {
        const now = oscAudioContextRef.current.ctx.currentTime;
        oscAudioContextRef.current.osc.frequency.setValueAtTime(oscFreqHz, now);
        oscAudioContextRef.current.osc.type = oscWaveform;
        const safeVol = (oscAmplitude / 100) * 0.12;
        oscAudioContextRef.current.gain.gain.setValueAtTime(safeVol, now);
      } catch {}
    }
  }, [oscFreqHz, oscAmplitude, oscWaveform, isPlayingAudioTone]);

  useEffect(() => {
    return () => {
      if (oscAudioContextRef.current) {
        try {
          oscAudioContextRef.current.osc.stop();
          oscAudioContextRef.current.ctx.close();
        } catch {}
        oscAudioContextRef.current = null;
      }
    };
  }, [selectedExpId]);

  // 19. Sự nở vì nhiệt của chất rắn calculations
  const thermalExpansionCalculations = useMemo(() => {
    const alphaMap = { aluminum: 0.000023, copper: 0.000017, iron: 0.000012 };
    const metalLabels = {
      aluminum: "Nhôm (Al) - α = 23 × 10⁻⁶ /K",
      copper: "Đồng (Cu) - α = 17 × 10⁻⁶ /K",
      iron: "Sắt (Fe) - α = 12 × 10⁻⁶ /K",
    };
    const alpha = alphaMap[solidBallMetal];
    const initialDiameter = 39.80; // mm at 25°C
    const ringDiameter = 40.00; // mm
    const deltaT = solidBallTemp - 25;
    const currentDiameter = parseFloat((initialDiameter * (1 + alpha * deltaT)).toFixed(2));
    const clearance = parseFloat((ringDiameter - currentDiameter).toFixed(2));
    const canPass = currentDiameter <= ringDiameter;

    return {
      metalLabel: metalLabels[solidBallMetal],
      alpha,
      initialDiameter,
      ringDiameter,
      currentDiameter,
      clearance,
      canPass,
      deltaT,
    };
  }, [solidBallMetal, solidBallTemp]);

  useEffect(() => {
    if (!isHeatingBall) return;
    const interval = setInterval(() => {
      setSolidBallTemp((prev) => {
        if (prev >= 260) {
          setIsHeatingBall(false);
          playSound("beep");
          return 260;
        }
        return prev + 15;
      });
    }, 280);
    return () => clearInterval(interval);
  }, [isHeatingBall]);

  // 20. Spring Hooke calculations (KHTN 6 Bài 36)
  const springCalculations = useMemo(() => {
    const naturalLengthCm = 12; // l₀ = 12 cm
    const massKg = hangingMassG / 1000;
    const forceN = parseFloat((massKg * 9.8).toFixed(2));
    const elongationCm = parseFloat(((forceN / springK) * 100).toFixed(1));
    const totalLengthCm = parseFloat((naturalLengthCm + elongationCm).toFixed(1));
    const kRatio = elongationCm > 0 ? parseFloat((forceN / (elongationCm / 100)).toFixed(1)) : springK;
    const weightsCount = Math.floor(hangingMassG / 50);

    return {
      naturalLengthCm,
      forceN,
      elongationCm,
      totalLengthCm,
      kRatio,
      weightsCount,
    };
  }, [hangingMassG, springK]);

  useEffect(() => {
    if (!isSpringBouncing) {
      setSpringBounceOffset(0);
      return;
    }
    let frame = 0;
    const interval = setInterval(() => {
      frame += 0.25;
      const decay = Math.exp(-frame * 0.15);
      const offset = Math.sin(frame * 4) * 18 * decay;
      setSpringBounceOffset(offset);
      if (decay < 0.05) {
        setIsSpringBouncing(false);
        setSpringBounceOffset(0);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [isSpringBouncing]);

  // 21. Phototropism calculations (KHTN 7 Bài 35)
  const phototropismCalculations = useMemo(() => {
    const progress = Math.min(1, phototropismHours / 72);
    let bendAngle = 0;
    let stemColor = "#22c55e";
    let title = "Chiếu sáng bên trái";
    let desc = "Auxin phân bố dồn sang phía tối (bên phải), kích thích tế bào dãn dài uốn cong ngọn cây sang trái.";

    if (lightDirection === "left") {
      bendAngle = -36 * progress;
      title = "Nguồn sáng phía Trái (Hướng sáng dương)";
      desc = "Auxin dồn sang phía Phải (68%), tế bào phía phải dãn dài nhanh hơn ép ngọn cây uốn cong sang trái.";
    } else if (lightDirection === "right") {
      bendAngle = 36 * progress;
      title = "Nguồn sáng phía Phải (Hướng sáng dương)";
      desc = "Auxin dồn sang phía Trái (68%), tế bào phía trái dãn dài nhanh hơn ép ngọn cây uốn cong sang phải.";
    } else if (lightDirection === "top") {
      bendAngle = 0;
      title = "Chiếu sáng từ Đỉnh (Mọc thẳng)";
      desc = "Auxin phân bố đều hai bên thân, ngọn cây vươn thẳng đứng về phía ánh sáng mặt trời.";
    } else {
      bendAngle = 0;
      stemColor = "#facc15";
      title = "Che tối hoàn toàn (Mọc vống)";
      desc = "Cây thiếu sáng bị hiện tượng mọc vống (etiolation): Thân mọc dài ngoằng, yếu ớt, lá nhỏ màu vàng nhạt.";
    }

    const darkAuxinPercent = lightDirection === "dark" || lightDirection === "top" ? 50 : 68;
    const lightAuxinPercent = 100 - darkAuxinPercent;

    return {
      bendAngle,
      progress,
      stemColor,
      title,
      desc,
      darkAuxinPercent,
      lightAuxinPercent,
    };
  }, [lightDirection, phototropismHours]);

  // 22. Thermal reactions calculations (KHTN 8 Bài 8)
  const thermalCalculations = useMemo(() => {
    const configs = {
      exothermic_cao: {
        name: "Tôi vôi: CaO + H₂O → Ca(OH)₂",
        type: "Tỏa nhiệt mạnh (Exothermic)",
        deltaH: "-65.2 kJ/mol (ΔH < 0)",
        targetTemp: Math.min(88, 25 + reagentAmountG * 2.6),
        isExo: true,
        phenomenon: "Sủi bọt mạnh, hơi nước bốc lên nghi ngút, dung dịch nóng sôi",
      },
      exothermic_acid_base: {
        name: "Trung hòa: HCl + NaOH → NaCl + H₂O",
        type: "Tỏa nhiệt (Exothermic)",
        deltaH: "-57.3 kJ/mol (ΔH < 0)",
        targetTemp: Math.min(62, 25 + reagentAmountG * 1.5),
        isExo: true,
        phenomenon: "Dung dịch trong suốt, nhiệt kế tăng nhanh, tỏa nhiệt ấm bình",
      },
      endothermic_nh4cl: {
        name: "Hòa tan: NH₄Cl(r) + H₂O → NH₄Cl(dd)",
        type: "Thu nhiệt (Endothermic)",
        deltaH: "+14.8 kJ/mol (ΔH > 0)",
        targetTemp: Math.max(6, 25 - reagentAmountG * 0.8),
        isExo: false,
        phenomenon: "Bình lạnh buốt, xuất hiện sương đọng quanh thành cốc thủy tinh",
      },
      endothermic_barium: {
        name: "Ba(OH)₂·8H₂O + 2NH₄SCN",
        type: "Thu nhiệt cực mạnh (Endothermic)",
        deltaH: "+102.2 kJ/mol (ΔH > 0)",
        targetTemp: Math.max(-6, 25 - reagentAmountG * 1.3),
        isExo: false,
        phenomenon: "Nhiệt độ âm (-5°C), giọt nước đáy cốc đóng băng dính chặt tấm gỗ!",
      },
    };
    return configs[thermalReactionType];
  }, [thermalReactionType, reagentAmountG]);

  useEffect(() => {
    if (!isThermalReacting) {
      setThermalReactionTemp(25);
      return;
    }
    const target = thermalCalculations.targetTemp;
    const interval = setInterval(() => {
      setThermalReactionTemp((prev) => {
        if (Math.abs(prev - target) <= 1) {
          return target;
        }
        return prev + (target > prev ? 2 : -2);
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isThermalReacting, thermalCalculations.targetTemp]);

  // 23. Electrolysis calculations (KHTN 9 Bài 19)
  const electrolysisCalculations = useMemo(() => {
    if (!isElectrolysisSwitchClosed || electrolysisVoltage === 0) {
      return {
        isActive: false,
        currentMa: 0,
        copperMassMg: 0,
        gasVolumeMl: 0,
        cathodeDepositThick: 0,
      };
    }
    const resistanceOhm = (1 / electrolysisCuCl2Concentration) * 12;
    const currentA = electrolysisVoltage / resistanceOhm;
    const currentMa = Math.round(currentA * 1000);
    const copperMassG = (64 * currentA * electrolysisSeconds) / (2 * 96485);
    const copperMassMg = parseFloat((copperMassG * 1000).toFixed(1));
    const gasVolumeMl = parseFloat(((currentA * electrolysisSeconds / (2 * 96485)) * 24790).toFixed(1));
    const cathodeDepositThick = Math.min(8, Math.round(copperMassMg / 4));

    return {
      isActive: true,
      currentMa,
      copperMassMg,
      gasVolumeMl,
      cathodeDepositThick,
    };
  }, [isElectrolysisSwitchClosed, electrolysisVoltage, electrolysisCuCl2Concentration, electrolysisSeconds]);

  useEffect(() => {
    if (!isElectrolysisSwitchClosed || electrolysisVoltage === 0) return;
    const interval = setInterval(() => {
      setElectrolysisSeconds((prev) => (prev >= 180 ? 180 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isElectrolysisSwitchClosed, electrolysisVoltage]);

  // Ghi số liệu thực nghiệm
  const handleLogData = () => {
    playSound("beep");
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    let row: LogRow;

    if (selectedExpId === "ohm_circuit") {
      row = {
        id: crypto.randomUUID(),
        expId: "ohm_circuit",
        time: nowStr,
        col1: `${voltage} V`,
        col2: `${resistance} Ω`,
        col3: `${currentAmp} A`,
        col4: `${powerWatt} W`,
      };
    } else if (selectedExpId === "archimedes_buoyancy") {
      row = {
        id: crypto.randomUUID(),
        expId: "archimedes_buoyancy",
        time: nowStr,
        col1: `${submergedPercent}%`,
        col2: `${inAirWeightN} N`,
        col3: `${buoyantForceN} N (Fa)`,
        col4: `${dynamometerReadingN} N (Lực kế)`,
      };
    } else if (selectedExpId === "optics_refraction") {
      row = {
        id: crypto.randomUUID(),
        expId: "optics_refraction",
        time: nowStr,
        col1: `${incidenceAngle}° (Góc tới i)`,
        col2: `${refractionAngle}° (Góc khúc xạ r)`,
        col3: `sin(i)/sin(r) = 1.50`,
        col4: lightSourceType === "white_prism" ? "Tán sắc 7 màu" : "Tia đơn sắc",
      };
    } else if (selectedExpId === "chemical_mass_conservation") {
      row = {
        id: crypto.randomUUID(),
        expId: "chemical_mass_conservation",
        time: nowStr,
        col1: reactionStep === "initial" ? "Trước phản ứng" : "Sau phản ứng",
        col2: "142.50 g",
        col3: reactionStep === "initial" ? "Dung dịch trong" : "Kết tủa trắng BaSO4",
        col4: "m(trước) = m(sau)",
      };
    } else if (selectedExpId === "optics_convex_lens") {
      row = {
        id: crypto.randomUUID(),
        expId: "optics_convex_lens",
        time: nowStr,
        col1: `d = ${objectDistance} cm`,
        col2: `f = ${lensFocalLength} cm`,
        col3: lensCalculations.isInfinite ? "d' = ∞" : `d' = ${lensCalculations.imageDistance} cm`,
        col4: lensCalculations.typeLabel,
      };
    } else if (selectedExpId === "electromagnet_field") {
      row = {
        id: crypto.randomUUID(),
        expId: "electromagnet_field",
        time: nowStr,
        col1: `I = ${magnetCurrent} A`,
        col2: `N = ${coilTurns} vòng`,
        col3: `Hút ${electromagnetStrength.attractedNails} đinh`,
        col4: hasIronCore ? "Có lõi sắt non" : "Không có lõi sắt",
      };
    } else if (selectedExpId === "reaction_rate_factors") {
      row = {
        id: crypto.randomUUID(),
        expId: "reaction_rate_factors",
        time: nowStr,
        col1: `HCl ${acidConcentration}M, ${reactionTemp}°C`,
        col2: `Zn ${zincForm === "powder" ? "bột mịn" : "hạt"}`,
        col3: `V(H2) = ${reactionRateCalculations.gasVolumeMl} ml`,
        col4: `Tốc độ x${reactionRateCalculations.speedMultiplier}`,
      };
    } else if (selectedExpId === "photosynthesis_starch") {
      row = {
        id: crypto.randomUUID(),
        expId: "photosynthesis_starch",
        time: nowStr,
        col1: `Giai đoạn ${starchStep}/5`,
        col2: "Thuốc thử Iot 1%",
        col3: "Vùng sáng: Xanh tím",
        col4: "Vùng tối: Vàng nâu",
      };
    } else if (selectedExpId === "mixture_separation") {
      row = {
        id: crypto.randomUUID(),
        expId: "mixture_separation",
        time: nowStr,
        col1: separationMethod === "filter" ? "Phương pháp Lọc tách cát" : "Phương pháp Cô cạn muối",
        col2: `${separationProgress}% tiến độ`,
        col3: separationMethod === "filter" ? "Bã cát & Nước muối trong" : `Thu ${separationCalculations.saltGrams}g NaCl`,
        col4: separationCalculations.isDone ? "Hoàn thành" : "Đang xử lý",
      };
    } else if (selectedExpId === "friction_force") {
      row = {
        id: crypto.randomUUID(),
        expId: "friction_force",
        time: nowStr,
        col1: frictionCalculations.surfaceLabel,
        col2: `m = ${blockMassG}g (N = ${frictionCalculations.normalForceN}N)`,
        col3: `F_ms = ${frictionCalculations.frictionForceN} N`,
        col4: `Lực kéo kế: ${frictionCalculations.pullReadingN} N`,
      };
    } else if (selectedExpId === "optics_plane_mirror") {
      row = {
        id: crypto.randomUUID(),
        expId: "optics_plane_mirror",
        time: nowStr,
        col1: `Góc tới i = ${planeMirrorCalculations.i}°`,
        col2: `Góc phản xạ i' = ${planeMirrorCalculations.iPrime}°`,
        col3: `Góc (SI, IR) = ${planeMirrorCalculations.angleBetweenRays}°`,
        col4: `Ảnh ảo: d' = ${planeMirrorCalculations.dPrime}cm, h' = ${planeMirrorCalculations.hPrime}cm`,
      };
    } else if (selectedExpId === "sound_reflection_echo") {
      row = {
        id: crypto.randomUUID(),
        expId: "sound_reflection_echo",
        time: nowStr,
        col1: `Khoảng cách s = ${barrierDistance} m`,
        col2: soundEchoCalculations.barrierLabel,
        col3: `Độ trễ Δt = ${soundEchoCalculations.deltaT} s`,
        col4: soundEchoCalculations.canHearEcho ? "Có tiếng vang" : "Không có tiếng vang",
      };
    } else if (selectedExpId === "lever_balance") {
      row = {
        id: crypto.randomUUID(),
        expId: "lever_balance",
        time: nowStr,
        col1: `Trái: ${leftMassM1}g @ ${leftArmD1}cm (M1=${leverCalculations.m1}N.m)`,
        col2: `Phải: ${rightMassM2}g @ ${rightArmD2}cm (M2=${leverCalculations.m2}N.m)`,
        col3: `ΔM = ${leverCalculations.deltaM} N.m`,
        col4: leverCalculations.isBalanced ? "Cân bằng thăng bằng" : `Nghiêng ${leverCalculations.tiltAngle.toFixed(1)}°`,
      };
    } else if (selectedExpId === "acid_base_ph_indicator") {
      row = {
        id: crypto.randomUUID(),
        expId: "acid_base_ph_indicator",
        time: nowStr,
        col1: `${phCalculations.name} (${phCalculations.formula})`,
        col2: `pH = ${phCalculations.ph} (${phCalculations.env})`,
        col3: selectedIndicator === "litmus" ? "Quỳ tím" : selectedIndicator === "phenolphthalein" ? "Phenolphthalein" : "Giấy pH vạn năng",
        col4: phCalculations.indicatorLabel,
      };
    } else if (selectedExpId === "osmosis_cell_turgor") {
      row = {
        id: crypto.randomUUID(),
        expId: "osmosis_cell_turgor",
        time: nowStr,
        col1: osmosisCalculations.title,
        col2: `Không bào chiếm ~${Math.round(osmosisCalculations.vacuoleScale * 100)}% thể tích`,
        col3: osmosisCalculations.waterDirection === "out" ? "Nước thẩm thấu ra ngoài" : osmosisCalculations.waterDirection === "in" ? "Nước thẩm thấu vào trong" : "Dòng nước cân bằng",
        col4: osmosisCalculations.isPlasmolyzed ? "Co nguyên sinh" : "Trương phồng bình thường",
      };
    } else if (selectedExpId === "electromagnetic_induction") {
      row = {
        id: crypto.randomUUID(),
        expId: "electromagnetic_induction",
        time: nowStr,
        col1: `Nam châm x = ${magnetX}mm (${magnetOrientation === "N_left" ? "Cực N" : "Cực S"})`,
        col2: `Cuộn dây N = ${inductionCalculations.N} vòng`,
        col3: `Suất điện động e = ${inductionCalculations.inducedVoltageMv} mV`,
        col4: `Dòng điện Icư = ${inductionCalculations.inducedCurrentMa} mA (Kim lệch ${inductionCalculations.needleAngle.toFixed(1)}°)`,
      };
    } else if (selectedExpId === "sound_oscilloscope_frequency") {
      row = {
        id: crypto.randomUUID(),
        expId: "sound_oscilloscope_frequency",
        time: nowStr,
        col1: `Tần số f = ${oscFreqHz} Hz (${oscilloscopeCalculations.pitchCategory})`,
        col2: `Chu kỳ T = ${oscilloscopeCalculations.periodMs} ms`,
        col3: `Bước sóng λ = ${oscilloscopeCalculations.wavelengthCm} cm`,
        col4: `Biên độ ${oscAmplitude}% (~${oscilloscopeCalculations.decibelEst} dB - ${oscilloscopeCalculations.loudnessCategory})`,
      };
    } else if (selectedExpId === "thermal_expansion_solids") {
      row = {
        id: crypto.randomUUID(),
        expId: "thermal_expansion_solids",
        time: nowStr,
        col1: `${thermalExpansionCalculations.metalLabel}`,
        col2: `Nhiệt độ T = ${solidBallTemp}°C (ΔT = +${thermalExpansionCalculations.deltaT}°C)`,
        col3: `Đường kính cầu: ${thermalExpansionCalculations.currentDiameter} mm (Vòng: 40.00 mm)`,
        col4: thermalExpansionCalculations.canPass ? "Lọt qua vòng dễ dàng" : "BỊ KẸT LẠI TRÊN VÒNG",
      };
    } else if (selectedExpId === "spring_hooke_elasticity") {
      row = {
        id: crypto.randomUUID(),
        expId: "spring_hooke_elasticity",
        time: nowStr,
        col1: `m = ${hangingMassG}g (P = ${springCalculations.forceN}N)`,
        col2: `k = ${springK} N/m`,
        col3: `Δl = ${springCalculations.elongationCm} cm (l = ${springCalculations.totalLengthCm}cm)`,
        col4: `F_đh = ${springCalculations.forceN}N (k_đo = ${springCalculations.kRatio}N/m)`,
      };
    } else if (selectedExpId === "plant_phototropism") {
      row = {
        id: crypto.randomUUID(),
        expId: "plant_phototropism",
        time: nowStr,
        col1: phototropismCalculations.title,
        col2: `${phototropismHours} giờ chiếu sáng`,
        col3: `Góc uốn: ${Math.round(phototropismCalculations.bendAngle)}°`,
        col4: `Auxin: ${phototropismCalculations.darkAuxinPercent}% tối / ${phototropismCalculations.lightAuxinPercent}% sáng`,
      };
    } else if (selectedExpId === "exothermic_endothermic_reaction") {
      row = {
        id: crypto.randomUUID(),
        expId: "exothermic_endothermic_reaction",
        time: nowStr,
        col1: thermalCalculations.name.split(":")[0],
        col2: `${reagentAmountG}g chất phản ứng`,
        col3: `T_đo = ${thermalReactionTemp}°C (T₀=25°C)`,
        col4: `${thermalCalculations.type} - ${thermalCalculations.deltaH}`,
      };
    } else if (selectedExpId === "electrolysis_copper_chloride") {
      row = {
        id: crypto.randomUUID(),
        expId: "electrolysis_copper_chloride",
        time: nowStr,
        col1: `U = ${electrolysisVoltage}V, CuCl₂ ${electrolysisCuCl2Concentration}M`,
        col2: `I = ${electrolysisCalculations.currentMa} mA`,
        col3: `Đồng: ${electrolysisCalculations.copperMassMg} mg (Cathode -)`,
        col4: `Khí Clo: ${electrolysisCalculations.gasVolumeMl} ml (Anode +)`,
      };
    } else {
      row = {
        id: crypto.randomUUID(),
        expId: "fluid_pressure_vessels",
        time: nowStr,
        col1: `Độ sâu: ${fluidDepth} cm`,
        col2: `Hướng: ${probeOrientation}`,
        col3: `p = ${currentPressurePa} Pa`,
        col4: `Chênh lệch: ${manometerDiffCm} cm`,
      };
    }

    setRecordedData((prev) => [row, ...prev]);
  };

  const handleClearData = () => {
    playSound("click");
    setRecordedData((prev) => prev.filter((r) => r.expId !== selectedExpId));
  };

  return (
    <div className="w-full space-y-10">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. VIEW 1: CATALOG LIST (DANH SÁCH HIỂN THỊ MẶC ĐỊNH)     */}
      {/* ────────────────────────────────────────────────────────── */}
      {viewMode === "catalog" && (
        <div ref={catalogRef} className="w-full space-y-8 animate-in fade-in duration-300">
          {/* Catalog Hero Banner (chỉ hiển thị khi không bị nhúng trong trang khác) */}
          {!embedded && (
            <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/90 dark:border-purple-800/60 dark:bg-purple-950/50 px-4 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Phòng Thực Nghiệm Mô Phỏng KHTN K-9 • Kết Nối Tri Thức</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance leading-tight">
                Phòng Thí Nghiệm{" "}
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Mô Hình Ảo
                </span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-slate-300 leading-relaxed text-balance max-w-2xl mx-auto">
                Hệ thống 23 mô hình thực nghiệm chuẩn SGK Khoa học Tự nhiên Kết Nối Tri Thức (Lớp 6 - 9). Chọn bất kỳ bài thí nghiệm nào bên dưới để vào trang thực hành chi tiết với đầy đủ dụng cụ, số liệu đo và câu hỏi củng cố.
              </p>

              <div className="flex items-center justify-center gap-3 pt-1">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                >
                  <Box className="w-4 h-4" />
                  <span>Xem Kho Học Liệu 3D Đầy Đủ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200/70 dark:border-neutral-800/70">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/90 dark:border-purple-800/60 dark:bg-purple-950/50 px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>KHO MÔ HÌNH THỰC HÀNH KHTN • 23 BÀI CHUẨN KNTT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
                Danh Mục Thí Nghiệm Thực Hành KNTT
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-slate-400 max-w-2xl text-balance">
                Danh sách bài thí nghiệm hiển thị trực quan. Nhấp vào bài bất kỳ để mở phòng thực hành chi tiết.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 px-4 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
                Hiển thị <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-sm">{filteredExperiments.length}</span> / {KNTT_EXPERIMENTS.length} bài
              </div>
            </div>
          </div>

          {/* Filter Bar & Search Box */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Category Tabs / Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Grade Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-x-auto [scrollbar-width:none]">
                {[
                  { id: "all", label: "Tất cả khối (23)" },
                  { id: "6", label: "Lớp 6 (5)" },
                  { id: "7", label: "Lớp 7 (6)" },
                  { id: "8", label: "Lớp 8 (8)" },
                  { id: "9", label: "Lớp 9 (4)" },
                ].map((tab) => {
                  const isActive = selectedGradeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedGradeFilter(tab.id as any);
                        playSound("click");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-xs font-bold scale-[1.02]"
                          : "text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Subject Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                {[
                  { id: "all", label: "Tất cả môn" },
                  { id: "physics", label: "⚡ Vật lý" },
                  { id: "chemistry", label: "🧪 Hóa học" },
                  { id: "biology", label: "🌿 Sinh học" },
                ].map((tab) => {
                  const isActive = selectedSubjectFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectFilter(tab.id as any);
                        playSound("click");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs font-bold scale-[1.02]"
                          : "text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Box with Search Icon */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài thí nghiệm, dụng cụ, SGK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiments.map((exp) => {
              const meta = getExperimentMeta(exp.id);
              const IconComponent = meta.icon;

              return (
                <div
                  key={exp.id}
                  onClick={() => handleOpenExperiment(exp.id)}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-neutral-200/90 dark:border-neutral-800 hover:border-purple-400 dark:hover:border-purple-500/60 hover:shadow-2xl hover:-translate-y-1.5 bg-white dark:bg-neutral-900 transition-all duration-300 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Visual Thumbnail Banner */}
                    <div className={`aspect-[16/10] bg-gradient-to-br ${meta.gradient} relative overflow-hidden flex items-center justify-center p-6 select-none`}>
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,white,transparent)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

                      {/* Central Icon */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-20 h-20 rounded-full bg-white/10 blur-xl animate-pulse" />
                        <IconComponent className="w-16 h-16 text-white drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                      </div>

                      {/* Top Left Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/15 shadow-xs">
                          {exp.badge} • Lớp {exp.grade}
                        </span>
                      </div>

                      {/* Top Right Subject Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-neutral-900 dark:text-white shadow-xs">
                          {exp.subject === "physics" ? "Vật lý" : exp.subject === "chemistry" ? "Hóa học" : "Sinh học"}
                        </span>
                      </div>

                      {/* Bottom Status Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-white/80 font-mono">
                        <span className="truncate max-w-[180px] bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-md">
                          {exp.apparatus.length} dụng cụ thực hành
                        </span>
                        <span className="bg-purple-500/90 text-white font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                          Mở phòng Lab
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                          {exp.title}
                        </h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5 line-clamp-1">
                          {exp.titleEn}
                        </p>
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {exp.summary}
                      </p>

                      {/* Key Apparatus preview chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {exp.apparatus.slice(0, 3).map((tool, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 truncate max-w-[160px]"
                          >
                            • {tool.split("(")[0]}
                          </span>
                        ))}
                        {exp.apparatus.length > 3 && (
                          <span className="inline-block px-1.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-400">
                            +{exp.apparatus.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current text-purple-500" />
                        <span>Xem chi tiết &amp; Thực hành</span>
                      </span>

                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Mở Lab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty search results state */}
          {filteredExperiments.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-3">
              <FlaskConical className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <h3 className="text-base font-bold text-neutral-800 dark:text-white">
                Không tìm thấy bài thí nghiệm phù hợp
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Không có bài thí nghiệm nào khớp với từ khóa &quot;{searchQuery}&quot;. Hãy thử tìm với từ khóa khác như &quot;định luật Ôm&quot;, &quot;thấu kính&quot;, &quot;quang hợp&quot;...
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGradeFilter("all");
                  setSelectedSubjectFilter("all");
                }}
                className="rounded-xl text-xs font-semibold mt-2"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. VIEW 2: DEDICATED DETAIL PAGE (TRANG CHI TIẾT THÍ NGHIỆM) */}
      {/* ────────────────────────────────────────────────────────── */}
      {viewMode === "detail" && (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          {/* Top Navigation Bar: Back button, Breadcrumbs, Prev/Next switcher */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-4 sm:p-5 backdrop-blur-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToCatalog}
                  className="rounded-2xl border-purple-200 dark:border-purple-800/80 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-bold text-xs gap-2 py-2 px-3.5 shadow-xs transition-all hover:-translate-x-0.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại danh mục thí nghiệm</span>
                </Button>

                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="hover:text-purple-600 dark:hover:text-purple-400 font-medium cursor-pointer"
                  >
                    Phòng Lab KNTT
                  </button>
                  <span>/</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {labDisplayMode === "en" ? "Grade" : "Lớp"} {currentExp.grade} • {labDisplayMode === "en"
                      ? currentExp.subject === "physics"
                        ? "Physics"
                        : currentExp.subject === "chemistry"
                          ? "Chemistry"
                          : "Biology"
                      : currentExp.subject === "physics"
                        ? "Vật lý"
                        : currentExp.subject === "chemistry"
                          ? "Hóa học"
                          : "Sinh học"}
                  </span>
                  <span>/</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 truncate max-w-[200px] sm:max-w-[320px]">
                    {labDisplayMode === "en"
                      ? currentExp.titleEn
                      : currentExp.title}
                  </span>
                </div>
              </div>

              {/* Prev / Next Lab switchers */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevExperiment}
                  className="rounded-xl text-xs gap-1 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Chuyển sang bài thí nghiệm trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bài trước</span>
                </Button>

                <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 px-1.5">
                  <span className="font-bold text-neutral-700 dark:text-neutral-200">{currentExpIndex + 1}</span> / {KNTT_EXPERIMENTS.length}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextExperiment}
                  className="rounded-xl text-xs gap-1 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Chuyển sang bài thí nghiệm tiếp theo"
                >
                  <span className="hidden md:inline">Bài tiếp</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Ngôn ngữ Lab / Lab language
              </span>
              <div
                className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
                role="group"
                aria-label="Chọn ngôn ngữ nội dung Lab"
              >
                {([
                  ["vi", "Tiếng Việt"],
                  ["en", "English"],
                  ["both", "Song ngữ / Both"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLabDisplayMode(mode)}
                    aria-pressed={labDisplayMode === mode}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      labDisplayMode === mode
                        ? "bg-white text-purple-700 shadow-xs dark:bg-neutral-700 dark:text-purple-300"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-neutral-500 dark:text-neutral-400">
              Bản dịch AI chỉ được tạo khi bạn yêu cầu và chỉ lưu trong phiên hiện tại.
              / AI translations are generated on request and kept only for this session.
            </p>
          </div>

          <section className="rounded-3xl border border-sky-200/70 bg-sky-50/70 p-4 shadow-xs dark:border-sky-900/60 dark:bg-sky-950/20">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              {labDisplayMode === "en"
                ? currentExp.titleEn
                : currentExp.title}
            </h2>
            {labDisplayMode === "both" ? (
              <p className="mt-1 text-xs font-semibold text-sky-800 dark:text-sky-200">
                {currentExp.titleEn}
              </p>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {labDisplayMode === "en"
                ? currentExp.summaryEn
                : currentExp.summary}
            </p>
            {labDisplayMode === "both" ? (
              <p className="mt-1 text-xs leading-relaxed text-sky-800 dark:text-sky-200">
                {currentExp.summaryEn}
              </p>
            ) : null}
          </section>

          {(currentLabModel || canManageLabModels || labModelError) && (
            <section className="space-y-4 rounded-3xl border border-indigo-200/70 bg-white/95 p-5 shadow-xs dark:border-indigo-900/60 dark:bg-neutral-900/95">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <Box className="h-4 w-4 text-indigo-500" />
                  {labDisplayMode === "en"
                    ? "Uploaded 3D model"
                    : "Mô hình 3D của bài Lab"}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {labDisplayMode === "en"
                    ? "A visual companion for this experiment. It does not change the simulation results."
                    : "Mô hình trực quan bổ trợ cho bài thí nghiệm; không làm thay đổi số liệu mô phỏng."}
                </p>
              </div>
              {currentLabModel ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {currentLabModel.title}
                  </p>
                  <Uploaded3DModelViewer
                    url={currentLabModel.url}
                    title={currentLabModel.title}
                    className="h-[60vh] max-h-[38rem]"
                  />
                </div>
              ) : null}
              {canManageLabModels ? (
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-indigo-300 p-3 dark:border-indigo-800">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {currentLabModel
                      ? "Thay mô hình hiện tại bằng tệp GLB mới"
                      : "Tải mô hình GLB lên cho bài thí nghiệm này"}
                  </label>
                  <input
                    type="text"
                    value={labModelTitle}
                    onChange={(event) => setLabModelTitle(event.target.value)}
                    placeholder={currentExp.title}
                    aria-label="Tên mô hình 3D"
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <input
                    type="file"
                    accept=".glb,model/gltf-binary,application/octet-stream"
                    onChange={(event) =>
                      setLabModelFile(event.currentTarget.files?.[0] ?? null)
                    }
                    disabled={isUploadingLabModel}
                    aria-label="Chọn tệp mô hình GLB"
                    className="block w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:font-semibold file:text-indigo-700 dark:text-neutral-300 dark:file:text-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => void handleLabModelUpload()}
                    disabled={!labModelFile || isUploadingLabModel}
                    className="self-start rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploadingLabModel
                      ? "Đang tải mô hình..."
                      : currentLabModel
                        ? "Thay mô hình"
                        : "Tải mô hình lên"}
                  </button>
                </div>
              ) : null}
              {labModelError ? (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {labModelError}
                </p>
              ) : null}
            </section>
          )}

          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                {labDisplayMode === "en"
                  ? "Procedure / Lab steps"
                  : "Các bước tiến hành (Chuẩn KNTT)"}
              </h4>
            </div>

            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <LabTranslatableText
                key={`${currentExp.id}-textbook-reference`}
                text={currentExp.textbookRef}
                displayMode={labDisplayMode}
                translation={labTranslations["textbook-reference"]}
              />
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              {labDisplayMode === "en"
                ? "The original is the reference. AI translation is for reading support; confirm safety instructions with your teacher."
                : "Bản gốc là nội dung tham chiếu. Bản dịch AI chỉ hỗ trợ đọc hiểu; hãy xác nhận hướng dẫn an toàn với giáo viên."}
            </p>

            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              {currentExp.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <LabTranslatableText
                    key={`${currentExp.id}-step-${idx}`}
                    text={step}
                    displayMode={labDisplayMode}
                    translation={labTranslations[`step-${idx}`]}
                  />
                </li>
              ))}
            </ul>
            {isTranslatingLab ? (
              <p role="status" className="text-[11px] text-sky-700 dark:text-sky-300">
                {labDisplayMode === "en"
                  ? "Preparing English translations..."
                  : "Đang chuẩn bị nội dung song ngữ..."}
              </p>
            ) : null}
            {labTranslationError ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400">
                <span role="alert">{labTranslationError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setLabTranslationState({
                      experimentId: "",
                      translations: {},
                      error: "",
                    });
                    setTranslationRetryKey((current) => current + 1);
                  }}
                  className="font-semibold underline"
                >
                  {labDisplayMode === "en" ? "Retry" : "Thử lại"}
                </button>
              </div>
            ) : null}
          </div>

          {/* ── 1. ACTIVE SIMULATION STUDIO (PHẦN HIỂN THỊ THÍ NGHIỆM ĐANG LÀM CHI TIẾT) ── */}
          <div ref={labStageRef} className="scroll-mt-28 space-y-5">
            {/* macOS Style Window Top Bar matching ThreeD Studio */}
            <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 backdrop-blur-xl shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-3 w-3 rounded-full bg-rose-400/80 hover:bg-rose-500 cursor-pointer transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/80 hover:bg-amber-500 cursor-pointer transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80 hover:bg-emerald-500 cursor-pointer transition-colors" />
                  </div>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                        {labDisplayMode === "en"
                          ? currentExp.titleEn
                          : currentExp.title}
                      </h2>
                      <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {currentExp.badge}
                      </span>
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {currentExp.subject === "physics" ? "Vật lý" : currentExp.subject === "chemistry" ? "Hóa học" : "Sinh học"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-slate-400 truncate mt-0.5">
                      {currentExp.titleEn} • {currentExp.textbookRef}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer transition-all hover:scale-105"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Quay lại danh mục</span>
                    <span className="sm:hidden">Danh mục</span>
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      playSound("click");
                    }}
                    className="rounded-xl text-xs gap-1.5 border-neutral-200 dark:border-neutral-800 cursor-pointer"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Âm thanh: Bật</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="hidden sm:inline">Âm thanh: Tắt</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick jump carousel pills for fast switching */}
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 shrink-0 mr-1">
                  Chuyển nhanh:
                </span>
                {KNTT_EXPERIMENTS.slice(0, 8).map((exp) => {
                  const isSelected = selectedExpId === exp.id;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => handleOpenExperiment(exp.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-purple-600 text-white font-bold shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <span>{getExperimentShortTitle(exp)}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleBackToCatalog}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 shrink-0 cursor-pointer"
                >
                  Xem toàn bộ 23 bài →
                </button>
              </div>
            </div>
        </div>

        {/* ── MAIN EXPERIMENT STAGE: CANVAS + INTERACTIVE CONTROLS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: SIMULATION CANVAS (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-950 text-white shadow-xl overflow-hidden relative">
            {/* Stage Header Info Bar */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/80 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                  {currentExp.badge}
                </Badge>
                <span className="text-xs sm:text-sm font-bold truncate">
                  {currentExp.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Physics Live
                </span>
              </div>
            </div>

            {/* ── 2D/3D INTERACTIVE SVG/CANVAS STAGE ── */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-gradient-to-b from-neutral-950 via-[#0a0f1d] to-[#05070e] flex items-center justify-center p-4 select-none overflow-hidden">
              {/* Background Lab Grid Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

              {/* ────────────────────────────────────────────────────────── */}
              {/* 1. MÔ PHỎNG: MẠCH ĐIỆN & ĐỊNH LUẬT ÔM                   */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "ohm_circuit" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 700 400" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    {/* Wires */}
                    <path
                      d="M 120 100 L 580 100 L 580 300 L 120 300 Z"
                      fill="none"
                      stroke={isSwitchClosed ? "#38bdf8" : "#475569"}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={isSwitchClosed ? "12 8" : "none"}
                      className={isSwitchClosed ? "animate-pulse" : ""}
                    />

                    {/* DC Power Supply (Nguồn điện) */}
                    <g transform="translate(70, 160)">
                      <rect x="0" y="0" width="100" height="80" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <text x="50" y="30" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">NGUỒN DC</text>
                      <text x="50" y="55" textAnchor="middle" fill="#38bdf8" fontSize="18" fontWeight="bold" fontFamily="monospace">
                        {voltage} V
                      </text>
                      {/* Positive & Negative Terminals */}
                      <circle cx="20" cy="80" r="6" fill="#ef4444" />
                      <text x="20" y="75" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">+</text>
                      <circle cx="80" cy="80" r="6" fill="#3b82f6" />
                      <text x="80" y="75" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">-</text>
                    </g>

                    {/* Resistor (Biến trở R) */}
                    <g transform="translate(300, 70)">
                      <rect x="0" y="10" width="100" height="40" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                      <path d="M 15 30 L 25 18 L 35 42 L 45 18 L 55 42 L 65 18 L 75 42 L 85 30" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                      <text x="50" y="-5" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
                        R = {resistance} Ω
                      </text>
                    </g>

                    {/* Light Bulb (Bóng đèn dây tóc) */}
                    <g transform="translate(530, 160)">
                      <circle cx="50" cy="40" r="32" fill={isSwitchClosed && currentAmp > 0 ? "rgba(253, 224, 71, 0.25)" : "#0f172a"} stroke="#eab308" strokeWidth="2" />
                      {/* Glow aura when powered */}
                      {isSwitchClosed && currentAmp > 0 && (
                        <circle
                          cx="50"
                          cy="40"
                          r={Math.min(70, 32 + powerWatt * 0.4)}
                          fill="url(#bulbGlow)"
                          opacity="0.85"
                          className="animate-pulse"
                        />
                      )}
                      {/* Filament */}
                      <path d="M 40 46 L 47 30 L 53 30 L 60 46" fill="none" stroke={isSwitchClosed ? "#fde047" : "#64748b"} strokeWidth="2" />
                      <text x="50" y="85" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                        ĐÈN ({powerWatt} W)
                      </text>
                    </g>

                    {/* Switch (Công tắc K) */}
                    <g transform="translate(300, 280)">
                      <circle cx="20" cy="20" r="5" fill="#e2e8f0" />
                      <circle cx="80" cy="20" r="5" fill="#e2e8f0" />
                      {isSwitchClosed ? (
                        <line x1="20" y1="20" x2="80" y2="20" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                      ) : (
                        <line x1="20" y1="20" x2="70" y2="-5" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                      )}
                      <text x="50" y="45" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                        {isSwitchClosed ? "KHÓA K: ĐÓNG" : "KHÓA K: MỞ"}
                      </text>
                    </g>

                    {/* Voltmeter Instrument (Vôn kế đo 2 đầu bóng đèn) */}
                    <g transform="translate(420, 20)">
                      <circle cx="40" cy="40" r="30" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                      <text x="40" y="32" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold">V</text>
                      <text x="40" y="52" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                        {voltage}V
                      </text>
                    </g>

                    {/* Ammeter Instrument (Ampe kế đo dòng mạch chính) */}
                    <g transform="translate(180, 20)">
                      <circle cx="40" cy="40" r="30" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
                      <text x="40" y="32" textAnchor="middle" fill="#a78bfa" fontSize="16" fontWeight="bold">A</text>
                      <text x="40" y="52" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                        {currentAmp}A
                      </text>
                    </g>

                    {/* Glow definitions */}
                    <defs>
                      <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#eab308" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 2. MÔ PHỎNG: LỰC ĐẨY ÁC-SI-MÉT                            */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "archimedes_buoyancy" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 600 400" className="w-full h-full max-h-[380px]">
                    {/* Stand & Suspension */}
                    <line x1="120" y1="40" x2="350" y2="40" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
                    <line x1="120" y1="40" x2="120" y2="360" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                    <line x1="80" y1="360" x2="180" y2="360" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />

                    {/* Spring Dynamometer (Lực kế lò xo) */}
                    <g transform="translate(230, 45)">
                      <rect x="0" y="0" width="36" height="110" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      {/* Scale markings */}
                      {[0, 1, 2, 3, 4, 5].map((val) => (
                        <g key={val}>
                          <line x1="24" y1={18 + val * 16} x2="32" y2={18 + val * 16} stroke="#94a3b8" strokeWidth="1.5" />
                          <text x="18" y={22 + val * 16} textAnchor="end" fill="#94a3b8" fontSize="9">{val}</text>
                        </g>
                      ))}
                      {/* Pointer */}
                      <polygon
                        points={`28,${18 + Math.min(5, dynamometerReadingN) * 16} 36,${14 + Math.min(5, dynamometerReadingN) * 16} 36,${22 + Math.min(5, dynamometerReadingN) * 16}`}
                        fill="#ef4444"
                      />
                      {/* Digital reading banner */}
                      <text x="18" y="125" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                        {dynamometerReadingN} N
                      </text>
                    </g>

                    {/* Hanging String & Object */}
                    {(() => {
                      const objectY = 160 + (submergedPercent / 100) * 85;
                      const objColor =
                        buoyancyMaterial === "iron" ? "#94a3b8" : buoyancyMaterial === "aluminum" ? "#cbd5e1" : "#d97706";
                      return (
                        <g>
                          <line x1="248" y1="155" x2="248" y2={objectY} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 2" />
                          <rect
                            x="224"
                            y={objectY}
                            width="48"
                            height="60"
                            rx="4"
                            fill={objColor}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="transition-all duration-300"
                          />
                          <text x="248" y={objectY + 34} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {buoyancyMaterial === "iron" ? "SẮT" : buoyancyMaterial === "aluminum" ? "NHÔM" : "GỖ"}
                          </text>

                          {/* Force vectors */}
                          {/* Gravity P (Downwards) */}
                          <line x1="265" y1={objectY + 30} x2="265" y2={objectY + 80} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrowRed)" />
                          <text x="275" y={objectY + 70} fill="#ef4444" fontSize="10" fontWeight="bold">P={inAirWeightN}N</text>

                          {/* Buoyant force Fa (Upwards) */}
                          {submergedPercent > 0 && (
                            <>
                              <line x1="230" y1={objectY + 30} x2="230" y2={objectY - 20} stroke="#10b981" strokeWidth="2.5" />
                              <text x="205" y={objectY - 10} fill="#10b981" fontSize="10" fontWeight="bold">Fa={buoyantForceN}N</text>
                            </>
                          )}
                        </g>
                      );
                    })()}

                    {/* Beaker with Liquid (Bình chia độ chứa chất lỏng) */}
                    <g transform="translate(180, 220)">
                      {/* Glass Container */}
                      <path d="M 10 0 L 10 140 Q 10 148 18 148 L 122 148 Q 130 148 130 140 L 130 0" fill="none" stroke="#60a5fa" strokeWidth="3" />
                      {/* Liquid fill (Level rises with submergedPercent) */}
                      {(() => {
                        const waterLevelY = 145 - 65 - (submergedPercent / 100) * 18;
                        const liquidColor =
                          liquidType === "water"
                            ? "rgba(56, 189, 248, 0.45)"
                            : liquidType === "salt_water"
                            ? "rgba(99, 102, 241, 0.45)"
                            : "rgba(234, 179, 8, 0.45)";
                        return (
                          <rect
                            x="12"
                            y={waterLevelY}
                            width="116"
                            height={148 - waterLevelY}
                            fill={liquidColor}
                            className="transition-all duration-300"
                          />
                        );
                      })()}
                      {/* Measurement scale on glass */}
                      {[0, 100, 200, 300, 400].map((ml, idx) => (
                        <g key={ml}>
                          <line x1="12" y1={130 - idx * 25} x2="22" y2={130 - idx * 25} stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                          <text x="26" y={133 - idx * 25} fill="#ffffff" fontSize="8" opacity="0.8">{ml}ml</text>
                        </g>
                      ))}
                      <text x="70" y="165" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">
                        {liquidType === "water" ? "NƯỚC CẤT (d=10000 N/m³)" : liquidType === "salt_water" ? "NƯỚC MUỐI (d=11500 N/m³)" : "DẦU ĂN (d=8000 N/m³)"}
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 3. MÔ PHỎNG: BẢO TOÀN KHỐI LƯỢNG HÓA HỌC                   */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "chemical_mass_conservation" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 650 380" className="w-full h-full max-h-[360px]">
                    {/* Electronic Scale (Cân điện tử) */}
                    <g transform="translate(180, 230)">
                      {/* Scale Plate */}
                      <rect x="0" y="0" width="290" height="18" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                      {/* Scale Body */}
                      <rect x="25" y="18" width="240" height="75" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                      {/* Digital LCD screen */}
                      <rect x="80" y="32" width="130" height="38" rx="6" fill="#022c22" stroke="#059669" strokeWidth="1.5" />
                      <text x="145" y="58" textAnchor="middle" fill="#34d399" fontSize="22" fontWeight="bold" fontFamily="monospace">
                        142.50 g
                      </text>
                      <text x="145" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">CÂN ĐIỆN TỬ TIỂU LY (d=0.01g)</text>
                    </g>

                    {/* Flask 1 & 2 on the scale */}
                    {reactionStep === "initial" ? (
                      <>
                        {/* Beaker A (BaCl2) */}
                        <g transform="translate(220, 110)">
                          <path d="M 5 0 L 5 110 Q 5 118 15 118 L 65 118 Q 75 118 75 110 L 75 0" fill="none" stroke="#93c5fd" strokeWidth="2.5" />
                          <rect x="7" y="60" width="66" height="56" fill="rgba(147, 197, 253, 0.35)" />
                          <text x="40" y="85" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="bold">BaCl₂ (50ml)</text>
                          <text x="40" y="100" textAnchor="middle" fill="#e2e8f0" fontSize="9">Dung dịch trong</text>
                        </g>

                        {/* Test tube B (Na2SO4) */}
                        <g transform="translate(340, 110)">
                          <path d="M 10 0 L 10 105 Q 10 118 25 118 Q 40 118 40 105 L 40 0" fill="none" stroke="#93c5fd" strokeWidth="2.5" />
                          <rect x="12" y="55" width="26" height="60" fill="rgba(147, 197, 253, 0.35)" rx="3" />
                          <text x="25" y="85" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="bold">Na₂SO₄</text>
                        </g>
                      </>
                    ) : (
                      /* Mixed state with white precipitate BaSO4 */
                      <g transform="translate(270, 95)">
                        <path d="M 10 0 L 10 125 Q 10 133 20 133 L 90 133 Q 100 133 100 125 L 100 0" fill="none" stroke="#93c5fd" strokeWidth="3" />
                        {/* Liquid becomes cloudy white */}
                        <rect x="12" y="50" width="86" height="80" fill="rgba(241, 245, 249, 0.75)" />
                        {/* Precipitate settling at bottom */}
                        <rect x="12" y="112" width="86" height="18" fill="#ffffff" />
                        <text x="55" y="80" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="bold">KẾT TỦA TRẮNG</text>
                        <text x="55" y="98" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="bold">BaSO₄ ↓ + 2NaCl</text>
                      </g>
                    )}

                    {/* Chemical Equation Banner */}
                    <g transform="translate(325, 40)">
                      <rect x="-190" y="-18" width="380" height="36" rx="10" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
                      <text x="0" y="5" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="bold">
                        BaCl₂ + Na₂SO₄ ➔ BaSO₄ ↓ (trắng) + 2NaCl
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 4. MÔ PHỎNG: KHÚC XẠ ÁNH SÁNG & LĂNG KÍNH                 */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "optics_refraction" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 650 400" className="w-full h-full max-h-[380px]">
                    {/* Semicircular Glass Block or Circular Protractor */}
                    <g transform="translate(325, 200)">
                      {/* Protractor circle & ticks */}
                      <circle cx="0" cy="0" r="140" fill="#020617" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="-150" y1="0" x2="150" y2="0" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="0" y1="-150" x2="0" y2="150" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="5" y="-135" fill="#06b6d4" fontSize="10">Pháp tuyến N</text>

                      {/* Semicircular glass prism (Bottom half) */}
                      <path d="M -120 0 A 120 120 0 0 0 120 0 Z" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" strokeWidth="2" />
                      <text x="0" y="60" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="bold">
                        KHỐI BÁN NGUYỆT THỦY TINH (n = 1.5)
                      </text>
                      <text x="0" y="-60" textAnchor="middle" fill="#94a3b8" fontSize="10">
                        KHÔNG KHÍ (n = 1.0)
                      </text>

                      {/* Incident Ray (Tia tới) */}
                      {(() => {
                        const radI = (incidenceAngle * Math.PI) / 180;
                        const startX = -Math.sin(radI) * 160;
                        const startY = -Math.cos(radI) * 160;
                        const rayColor = lightSourceType === "red_laser" ? "#ef4444" : lightSourceType === "green_laser" ? "#10b981" : "#f8fafc";
                        return (
                          <>
                            <line x1={startX} y1={startY} x2="0" y2="0" stroke={rayColor} strokeWidth="3" />
                            {/* Angle arc for incidence i */}
                            <path
                              d={`M 0 -40 A 40 40 0 0 0 ${-Math.sin(radI) * 40} ${-Math.cos(radI) * 40}`}
                              fill="none"
                              stroke={rayColor}
                              strokeWidth="1.5"
                            />
                            <text x={-Math.sin(radI / 2) * 55 - 10} y={-Math.cos(radI / 2) * 55} fill={rayColor} fontSize="11" fontWeight="bold">
                              i={incidenceAngle}°
                            </text>
                          </>
                        );
                      })()}

                      {/* Refracted Ray (Tia khúc xạ bẻ cong) */}
                      {(() => {
                        const radR = (refractionAngle * Math.PI) / 180;
                        const endX = Math.sin(radR) * 120;
                        const endY = Math.cos(radR) * 120;

                        if (lightSourceType === "white_prism") {
                          // Dispersion rainbow rays
                          const colors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6"];
                          return (
                            <g>
                              {colors.map((c, idx) => {
                                const angleOffset = (idx - 3) * 1.8;
                                const radSpec = ((refractionAngle + angleOffset) * Math.PI) / 180;
                                return (
                                  <line
                                    key={c}
                                    x1="0"
                                    y1="0"
                                    x2={Math.sin(radSpec) * 120}
                                    y2={Math.cos(radSpec) * 120}
                                    stroke={c}
                                    strokeWidth="2"
                                  />
                                );
                              })}
                              <text x="30" y="100" fill="#f8fafc" fontSize="10" fontWeight="bold">TÁN SẮC 7 MÀU</text>
                            </g>
                          );
                        }

                        const rayColor = lightSourceType === "red_laser" ? "#ef4444" : "#10b981";
                        return (
                          <g>
                            <line x1="0" y1="0" x2={endX} y2={endY} stroke={rayColor} strokeWidth="3" />
                            <text x={endX + 12} y={endY} fill={rayColor} fontSize="11" fontWeight="bold">
                              r={refractionAngle}°
                            </text>
                          </g>
                        );
                      })()}

                      {/* Reflected Ray (Tia phản xạ một phần) */}
                      {(() => {
                        const radI = (incidenceAngle * Math.PI) / 180;
                        const refX = Math.sin(radI) * 130;
                        const refY = -Math.cos(radI) * 130;
                        return (
                          <line x1="0" y1="0" x2={refX} y2={refY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        );
                      })()}
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 5. MÔ PHỎNG: ÁP SUẤT CHẤT LỎNG & BÌNH THÔNG NHAU          */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "fluid_pressure_vessels" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 650 380" className="w-full h-full max-h-[360px]">
                    {/* Water Tank */}
                    <g transform="translate(100, 70)">
                      <rect x="0" y="0" width="220" height="260" rx="6" fill="#082f49" stroke="#38bdf8" strokeWidth="3" />
                      <rect x="2" y="30" width="216" height="228" fill="rgba(56, 189, 248, 0.4)" />
                      {/* Depth ruler */}
                      {[0, 10, 20, 30, 40, 50].map((cm) => (
                        <g key={cm}>
                          <line x1="2" y1={30 + cm * 4.4} x2="16" y2={30 + cm * 4.4} stroke="#ffffff" strokeWidth="1.5" />
                          <text x="20" y={34 + cm * 4.4} fill="#ffffff" fontSize="9">{cm}cm</text>
                        </g>
                      ))}

                      {/* Probe sensor in water */}
                      {(() => {
                        const probeY = 30 + (fluidDepth / 50) * 220;
                        return (
                          <g>
                            <line x1="120" y1="0" x2="120" y2={probeY} stroke="#94a3b8" strokeWidth="3" />
                            {/* Probe membrane head */}
                            <ellipse cx="120" cy={probeY} rx="16" ry="7" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                            {/* Soft flexible tube going to manometer */}
                            <path d={`M 120 0 Q 220 -20 270 90`} fill="none" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="3 2" />
                          </g>
                        );
                      })()}
                      <text x="110" y="280" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">BÌNH NƯỚC (ρ = 1000 kg/m³)</text>
                    </g>

                    {/* U-Tube Manometer (Áp kế hình chữ U) */}
                    <g transform="translate(400, 120)">
                      <rect x="-10" y="-10" width="160" height="200" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                      {/* U-shape glass tube */}
                      <path d="M 40 20 L 40 140 Q 40 165 70 165 Q 100 165 100 140 L 100 20" fill="none" stroke="#60a5fa" strokeWidth="14" strokeLinecap="round" />
                      <path d="M 40 20 L 40 140 Q 40 165 70 165 Q 100 165 100 140 L 100 20" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />

                      {/* Red indicator fluid in U-tube (displaced by pressure) */}
                      {(() => {
                        const shift = Math.min(50, (fluidDepth / 50) * 45);
                        return (
                          <g>
                            {/* Left column drops, right column rises */}
                            <path d={`M 40 ${90 + shift} L 40 140 Q 40 165 70 165 Q 100 165 100 140 L 100 ${90 - shift}`} fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                            {/* Delta h indicator line */}
                            <line x1="20" y1={90 + shift} x2="120" y2={90 + shift} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                            <line x1="20" y1={90 - shift} x2="120" y2={90 - shift} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                            <text x="70" y="5" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                              Δh = {manometerDiffCm} cm
                            </text>
                          </g>
                        );
                      })()}

                      <text x="70" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">ÁP KẾ CHỮ U</text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 6. MÔ PHỎNG: THẤU KÍNH HỘI TỤ (KHTN 9 Bài 6)           */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "optics_convex_lens" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 760 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="lensGlassGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                      </linearGradient>
                      <radialGradient id="flameGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Optical Axis (Trục chính Δ) */}
                    <line x1="20" y1="190" x2="740" y2="190" stroke="#64748b" strokeWidth="1.5" strokeDasharray="6 4" />
                    <text x="735" y="185" fill="#64748b" fontSize="12" fontWeight="bold">Δ</text>

                    {/* Centimeter Grid Ticks */}
                    {[-30, -20, -10, 0, 10, 20, 30].map((t) => (
                      <g key={t} transform={`translate(${380 + t * 9}, 190)`}>
                        <line x1="0" y1="-4" x2="0" y2="4" stroke="#475569" strokeWidth="1" />
                        {t !== 0 && (
                          <text x="0" y="16" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">
                            {Math.abs(t)}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Converging Double Convex Lens at x=380 */}
                    <g transform="translate(380, 190)">
                      {/* Lens Glass Profile */}
                      <path
                        d="M 0 -130 Q 18 0 0 130 Q -18 0 0 -130 Z"
                        fill="url(#lensGlassGrad)"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      {/* Optical Center O */}
                      <circle cx="0" cy="0" r="4" fill="#38bdf8" />
                      <text x="-12" y="-8" fill="#38bdf8" fontSize="12" fontWeight="bold">O</text>
                      {/* Arrow ends representing converging lens */}
                      <path d="M -8 -125 L 0 -135 L 8 -125" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      <path d="M -8 125 L 0 135 L 8 125" fill="none" stroke="#38bdf8" strokeWidth="2.5" />

                      {/* Focal Points F and F' */}
                      <circle cx={-lensFocalLength * 9} cy="0" r="3.5" fill="#eab308" />
                      <text x={-lensFocalLength * 9} y="-8" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="bold">F</text>
                      <circle cx={-lensFocalLength * 18} cy="0" r="3" fill="#ca8a04" />
                      <text x={-lensFocalLength * 18} y="-8" textAnchor="middle" fill="#ca8a04" fontSize="10">2F</text>

                      <circle cx={lensFocalLength * 9} cy="0" r="3.5" fill="#eab308" />
                      <text x={lensFocalLength * 9} y="-8" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="bold">F&apos;</text>
                      <circle cx={lensFocalLength * 18} cy="0" r="3" fill="#ca8a04" />
                      <text x={lensFocalLength * 18} y="-8" textAnchor="middle" fill="#ca8a04" fontSize="10">2F&apos;</text>
                    </g>

                    {/* Object (Candle AB) at x = 380 - objectDistance * 9 */}
                    {(() => {
                      const objX = 380 - objectDistance * 9;
                      const candleH = objectHeight * 14;
                      const candleTop = 190 - candleH;
                      const dPrime = lensCalculations.imageDistance;
                      const imgX = 380 + dPrime * 9;
                      const imgH = Math.min(140, lensCalculations.imageHeight * 14);

                      return (
                        <g>
                          {/* Candle AB */}
                          <g>
                            <rect x={objX - 6} y={candleTop + 14} width="12" height={candleH - 14} rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                            <line x1={objX} y1={candleTop + 14} x2={objX} y2={candleTop + 8} stroke="#1e293b" strokeWidth="2" />
                            <ellipse cx={objX} cy={candleTop} rx="6" ry="10" fill="url(#flameGrad)" className="animate-pulse" />
                            <line x1={objX} y1="190" x2={objX} y2={candleTop} stroke="#38bdf8" strokeWidth="2.5" />
                            <polygon points={`${objX},${candleTop} ${objX - 4},${candleTop + 8} ${objX + 4},${candleTop + 8}`} fill="#38bdf8" />
                            <text x={objX - 10} y="185" fill="#94a3b8" fontSize="11" fontWeight="bold">A</text>
                            <text x={objX - 10} y={candleTop - 4} fill="#38bdf8" fontSize="11" fontWeight="bold">B</text>
                            <text x={objX} y="215" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">VẬT (AB)</text>
                          </g>

                          {/* Ray Tracing Lines */}
                          {/* Ray 1: Parallel to axis, then through F' */}
                          <line x1={objX} y1={candleTop} x2="380" y2={candleTop} stroke="#06b6d4" strokeWidth="2" strokeDasharray="none" />
                          {lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <line x1="380" y1={candleTop} x2={imgX} y2={190 + imgH} stroke="#06b6d4" strokeWidth="2" />
                          )}
                          {!lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <>
                              <line x1="380" y1={candleTop} x2="740" y2={candleTop + ((190 - candleTop) / (lensFocalLength * 9)) * (740 - 380)} stroke="#06b6d4" strokeWidth="2" />
                              <line x1="380" y1={candleTop} x2={380 - Math.abs(dPrime) * 9} y2={190 - imgH} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
                            </>
                          )}

                          {/* Ray 2: Through optical center O */}
                          {lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <line x1={objX} y1={candleTop} x2={imgX} y2={190 + imgH} stroke="#eab308" strokeWidth="2" />
                          )}
                          {!lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <>
                              <line x1={objX} y1={candleTop} x2="740" y2={190 + ((190 - candleTop) / (380 - objX)) * (740 - 380)} stroke="#eab308" strokeWidth="2" />
                              <line x1="380" y1="190" x2={380 - Math.abs(dPrime) * 9} y2={190 - imgH} stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" />
                            </>
                          )}

                          {/* Image A'B' */}
                          {lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <g>
                              <rect x={imgX - 4} y="40" width="8" height="300" rx="3" fill="rgba(255,255,255,0.15)" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
                              <text x={imgX} y="35" textAnchor="middle" fill="#94a3b8" fontSize="9">MÀN HỨNG</text>

                              <rect x={imgX - 6} y="190" width="12" height={imgH - 12} rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" opacity="0.8" />
                              <line x1={imgX} y1={190 + imgH - 12} x2={imgX} y2={190 + imgH - 4} stroke="#1e293b" strokeWidth="2" />
                              <ellipse cx={imgX} cy={190 + imgH} rx="5" ry="8" fill="url(#flameGrad)" className="animate-pulse" />
                              <line x1={imgX} y1="190" x2={imgX} y2={190 + imgH} stroke="#22c55e" strokeWidth="2.5" />
                              <polygon points={`${imgX},${190 + imgH} ${imgX - 4},${190 + imgH - 8} ${imgX + 4},${190 + imgH - 8}`} fill="#22c55e" />
                              <text x={imgX + 12} y="185" fill="#94a3b8" fontSize="11" fontWeight="bold">A&apos;</text>
                              <text x={imgX + 12} y={190 + imgH} fill="#22c55e" fontSize="11" fontWeight="bold">B&apos;</text>
                              <text x={imgX} y="225" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">ẢNH THẬT</text>
                            </g>
                          )}

                          {!lensCalculations.isReal && !lensCalculations.isInfinite && (
                            <g>
                              {(() => {
                                const vImgX = 380 - Math.abs(dPrime) * 9;
                                return (
                                  <g opacity="0.75">
                                    <line x1={vImgX} y1="190" x2={vImgX} y2={190 - imgH} stroke="#a855f7" strokeWidth="2.5" strokeDasharray="5 3" />
                                    <polygon points={`${vImgX},${190 - imgH} ${vImgX - 4},${190 - imgH + 8} ${vImgX + 4},${190 - imgH + 8}`} fill="#a855f7" />
                                    <ellipse cx={vImgX} cy={190 - imgH} rx="6" ry="10" fill="url(#flameGrad)" opacity="0.6" />
                                    <text x={vImgX - 12} y="185" fill="#94a3b8" fontSize="11" fontWeight="bold">A&apos;</text>
                                    <text x={vImgX - 12} y={190 - imgH} fill="#a855f7" fontSize="11" fontWeight="bold">B&apos;</text>
                                    <text x={vImgX} y="215" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">ẢNH ẢO</text>
                                  </g>
                                );
                              })()}
                            </g>
                          )}

                          {lensCalculations.isInfinite && (
                            <g transform="translate(380, 80)">
                              <rect x="-140" y="0" width="280" height="35" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                              <text x="0" y="22" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
                                VẬT ĐẶT TẠI TIÊU ĐIỂM F: ẢNH Ở VÔ CỰC (d&apos; = ∞)
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 7. MÔ PHỎNG: NAM CHÂM ĐIỆN & TỪ TRƯỜNG (KHTN 7 Bài 21)   */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "electromagnet_field" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="ironCoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="50%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#64748b" />
                      </linearGradient>
                      <linearGradient id="copperWireGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#b45309" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                    </defs>

                    {/* Magnetic Field Lines (When switch is closed) */}
                    {magnetSwitch && (
                      <g opacity={hasIronCore ? "0.6" : "0.2"}>
                        {[-60, -40, -20, 20, 40, 60].map((offset, i) => (
                          <ellipse
                            key={i}
                            cx="370"
                            cy="170"
                            rx={180 + Math.abs(offset) * 2}
                            ry={50 + Math.abs(offset) * 1.5}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                            strokeDasharray="8 6"
                            className="animate-pulse"
                          />
                        ))}
                      </g>
                    )}

                    {/* Circuit Wires */}
                    <path
                      d="M 180 80 L 180 140 M 180 200 L 180 280 L 560 280 L 560 140"
                      fill="none"
                      stroke={magnetSwitch ? "#38bdf8" : "#475569"}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* DC Power Supply & Switch at Bottom */}
                    <g transform="translate(320, 260)">
                      <rect x="0" y="0" width="100" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <text x="50" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
                        {magnetSwitch ? `${(magnetCurrent * 4).toFixed(1)}V DC` : "TẮT NGUỒN"}
                      </text>
                    </g>

                    {/* Switch K (Left wire) */}
                    <g transform="translate(180, 140)">
                      <circle cx="0" cy="0" r="4" fill="#38bdf8" />
                      <circle cx="0" cy="60" r="4" fill="#38bdf8" />
                      <line
                        x1="0"
                        y1="0"
                        x2={magnetSwitch ? "0" : "-24"}
                        y2={magnetSwitch ? "60" : "40"}
                        stroke={magnetSwitch ? "#38bdf8" : "#ef4444"}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <text x="-35" y="35" fill="#94a3b8" fontSize="11" fontWeight="bold">KHÓA K</text>
                    </g>

                    {/* Solenoid + Iron Core (Center) */}
                    <g transform="translate(240, 130)">
                      {hasIronCore ? (
                        <g>
                          <rect x="0" y="20" width="260" height="40" rx="6" fill="url(#ironCoreGrad)" stroke="#475569" strokeWidth="2" />
                          <rect x="0" y="20" width="30" height="40" rx="4" fill="#ef4444" />
                          <text x="15" y="45" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">N</text>
                          <rect x="230" y="20" width="30" height="40" rx="4" fill="#3b82f6" />
                          <text x="245" y="45" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">S</text>
                          <text x="130" y="45" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">LÕI SẮT NON</text>
                        </g>
                      ) : (
                        <g>
                          <rect x="0" y="20" width="260" height="40" rx="6" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                          <text x="130" y="45" textAnchor="middle" fill="#64748b" fontSize="10">KHÔNG CÓ LÕI SẮT (KHÔNG KHÍ)</text>
                        </g>
                      )}

                      {/* Copper Wire Coils wound around core */}
                      {(() => {
                        const loops = coilTurns === 50 ? 8 : coilTurns === 100 ? 14 : 22;
                        const spacing = 180 / loops;
                        return Array.from({ length: loops }).map((_, idx) => (
                          <g key={idx} transform={`translate(${40 + idx * spacing}, 14)`}>
                            <ellipse cx="6" cy="26" rx="5" ry="24" fill="none" stroke="url(#copperWireGrad)" strokeWidth="4" />
                          </g>
                        ));
                      })()}
                    </g>

                    {/* Steel Nails Collection Under North Pole */}
                    <g transform="translate(220, 200)">
                      <rect x="-30" y="40" width="90" height="14" rx="4" fill="#334155" />
                      <text x="15" y="70" textAnchor="middle" fill="#94a3b8" fontSize="10">KHAY ĐINH SẮT</text>

                      {magnetSwitch && electromagnetStrength.attractedNails > 0 ? (
                        <g>
                          {Array.from({ length: electromagnetStrength.attractedNails }).map((_, idx) => {
                            const angle = (idx % 7 - 3) * 14;
                            const yOff = -15 + Math.floor(idx / 7) * 12;
                            return (
                              <g key={idx} transform={`translate(15, ${yOff}) rotate(${angle})`}>
                                <line x1="0" y1="0" x2="0" y2="18" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="0" cy="0" r="2.5" fill="#94a3b8" />
                              </g>
                            );
                          })}
                        </g>
                      ) : (
                        <g transform="translate(0, 36)">
                          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <line key={i} x1={-15 + i * 8} y1="0" x2={-5 + i * 8} y2="2" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                          ))}
                        </g>
                      )}
                    </g>

                    {/* Digital Field Strength Badge */}
                    <g transform="translate(520, 80)">
                      <rect x="0" y="0" width="180" height="60" rx="10" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                      <text x="90" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">CẢM ỨNG TỪ (B)</text>
                      <text x="90" y="46" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold" fontFamily="monospace">
                        {electromagnetStrength.bTesla} mT
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 8. MÔ PHỎNG: TỐC ĐỘ PHẢN ỨNG HÓA HỌC (KHTN 8 Bài 11)     */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "reaction_rate_factors" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="acidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
                      </linearGradient>
                      <linearGradient id="flameLampGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="60%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fef08a" />
                      </linearGradient>
                    </defs>

                    {/* Equation Banner */}
                    <g transform="translate(370, 30)">
                      <rect x="-200" y="-12" width="400" height="28" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="6" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                        Zn (rắn) + 2HCl (dd) ➔ ZnCl₂ (dd) + H₂ ↑ (khí)
                      </text>
                    </g>

                    {/* Test Tube on Stand (Left) */}
                    <g transform="translate(180, 90)">
                      <rect x="0" y="0" width="60" height="180" rx="8" fill="rgba(255,255,255,0.06)" stroke="#94a3b8" strokeWidth="2" />
                      <path d="M 0 170 Q 0 195 30 195 Q 60 195 60 170" fill="rgba(255,255,255,0.06)" stroke="#94a3b8" strokeWidth="2" />

                      {/* HCl Acid Solution inside */}
                      <path d="M 2 70 L 58 70 L 58 170 Q 58 193 30 193 Q 2 193 2 170 Z" fill="url(#acidGrad)" />
                      <text x="30" y="100" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                        HCl {acidConcentration}M
                      </text>

                      {/* Zinc pieces at bottom */}
                      {zincForm === "granule" ? (
                        <g>
                          <circle cx="18" cy="180" r="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
                          <circle cx="32" cy="183" r="6" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                          <circle cx="44" cy="179" r="6.5" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
                        </g>
                      ) : (
                        <g>
                          {Array.from({ length: 18 }).map((_, i) => (
                            <circle key={i} cx={10 + (i % 6) * 7} cy={175 + Math.floor(i / 6) * 5} r="2" fill="#94a3b8" />
                          ))}
                        </g>
                      )}

                      {/* Catalyst CuSO4 deposit */}
                      {hasReactionCatalyst && (
                        <ellipse cx="30" cy="182" rx="20" ry="4" fill="#3b82f6" opacity="0.6" />
                      )}

                      {/* Bubbles of H2 rising */}
                      {(isReacting || reactionProgress > 0) && (
                        <g>
                          {Array.from({ length: Math.round(reactionRateCalculations.speedMultiplier * 2.5) }).map((_, i) => {
                            const bY = 75 + ((i * 19 + (reactionProgress * 4)) % 100);
                            const bX = 15 + (i * 13) % 32;
                            return (
                              <circle key={i} cx={bX} cy={bY} r={1.5 + (i % 3)} fill="#ffffff" opacity="0.8" className="animate-pulse" />
                            );
                          })}
                        </g>
                      )}

                      {/* Alcohol Burner Flame (if temp == 60°C) */}
                      {reactionTemp === 60 && (
                        <g transform="translate(15, 215)">
                          <rect x="-10" y="20" width="50" height="30" rx="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                          <text x="15" y="38" textAnchor="middle" fill="#e2e8f0" fontSize="8">ĐÈN CỒN</text>
                          <ellipse cx="15" cy="10" rx="8" ry="14" fill="url(#flameLampGrad)" className="animate-pulse" />
                        </g>
                      )}

                      {/* Side delivery glass tube */}
                      <path d="M 60 40 L 160 40 L 160 100 L 220 100" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                    </g>

                    {/* Gas Syringe */}
                    <g transform="translate(420, 150)">
                      <rect x="0" y="0" width="220" height="50" rx="6" fill="rgba(255,255,255,0.06)" stroke="#94a3b8" strokeWidth="2" />
                      {[0, 10, 20, 30, 40, 50].map((v) => {
                        const mX = (v / 50) * 180;
                        return (
                          <g key={v} transform={`translate(${mX}, 0)`}>
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
                            <text x="0" y="24" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                              {v}
                            </text>
                          </g>
                        );
                      })}

                      {(() => {
                        const gasW = (reactionRateCalculations.gasVolumeMl / 50) * 180;
                        return (
                          <g>
                            <rect x="0" y="2" width={gasW} height="46" fill="rgba(56, 189, 248, 0.25)" />
                            <rect x={gasW} y="-5" width="10" height="60" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                            <rect x={gasW + 10} y="18" width="60" height="14" rx="2" fill="#94a3b8" />
                          </g>
                        );
                      })()}
                      <text x="90" y="75" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
                        ỐNG ĐONG THU KHÍ H₂ (ĐÃ THU: {reactionRateCalculations.gasVolumeMl} ml)
                      </text>
                    </g>

                    {/* Speed Multiplier Gauge */}
                    <g transform="translate(440, 260)">
                      <rect x="0" y="0" width="240" height="44" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
                      <text x="12" y="26" fill="#94a3b8" fontSize="11">Tốc độ phản ứng:</text>
                      <text x="140" y="28" fill="#22c55e" fontSize="16" fontWeight="bold" fontFamily="monospace">
                        x{reactionRateCalculations.speedMultiplier} LẦN
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 9. MÔ PHỎNG: QUANG HỢP TẠO TINH BỘT (KHTN 7 Bài 23)       */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "photosynthesis_starch" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="leafGreenGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#15803d" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#166534" />
                      </linearGradient>
                      <linearGradient id="leafStarchGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#312e81" />
                        <stop offset="35%" stopColor="#4338ca" />
                        <stop offset="40%" stopColor="#d97706" />
                        <stop offset="60%" stopColor="#d97706" />
                        <stop offset="65%" stopColor="#4338ca" />
                        <stop offset="100%" stopColor="#312e81" />
                      </linearGradient>
                    </defs>

                    {/* Stage Header Banner */}
                    <g transform="translate(370, 30)">
                      <rect x="-240" y="-14" width="480" height="30" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                      <text x="0" y="6" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">
                        {starchStep === 1 && "GIAI ĐOẠN 1: BỊT BĂNG GIẤY ĐEN & CHIẾU SÁNG 6 GIỜ"}
                        {starchStep === 2 && "GIAI ĐOẠN 2: NHÚNG LÁ VÀO NƯỚC SÔI 100°C ĐỂ DIỆT TẾ BÀO"}
                        {starchStep === 3 && "GIAI ĐOẠN 3: ĐUN CÁCH THỦY TRONG CỒN 90° ĐỂ TẨY SẠCH DIỆP LỤC"}
                        {starchStep === 4 && "GIAI ĐOẠN 4: TRẢI LÁ RA ĐĨA PETRI & NHỎ DUNG DỊCH THUỐC THỬ IOT"}
                        {starchStep === 5 && "GIAI ĐOẠN 5: ĐỐI CHỨNG MÀU XANH TÍM (CÓ TINH BỘT) VÀ VÀNG NÂU"}
                      </text>
                    </g>

                    {/* STAGE 1: Leaf on plant with black paper strip */}
                    {starchStep === 1 && (
                      <g transform="translate(370, 200)">
                        <g transform="translate(-160, -90)">
                          <circle cx="0" cy="0" r="24" fill="#fbbf24" className="animate-pulse" />
                          {Array.from({ length: 8 }).map((_, i) => (
                            <line key={i} x1="0" y1="0" x2={Math.cos(i * 0.785) * 36} y2={Math.sin(i * 0.785) * 36} stroke="#fde047" strokeWidth="2.5" />
                          ))}
                          <text x="0" y="45" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">ÁNH SÁNG MẶT TRỜI</text>
                        </g>

                        <path
                          d="M -60 60 C -120 -30 0 -100 80 -100 C 120 0 40 60 -60 60 Z"
                          fill="url(#leafGreenGrad)"
                          stroke="#14532d"
                          strokeWidth="2"
                        />
                        <path d="M -60 60 Q 20 -20 80 -100" fill="none" stroke="#86efac" strokeWidth="2" />

                        <g transform="translate(-10, -35) rotate(-20)">
                          <rect x="-35" y="-15" width="70" height="30" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" rx="3" />
                          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">BĂNG ĐEN</text>
                        </g>

                        <text x="0" y="110" textAnchor="middle" fill="#94a3b8" fontSize="11">
                          Phần che băng đen không nhận được ánh sáng để quang hợp
                        </text>
                      </g>
                    )}

                    {/* STAGE 2: Boiling in water */}
                    {starchStep === 2 && (
                      <g transform="translate(370, 210)">
                        <rect x="-70" y="-80" width="140" height="130" rx="8" fill="rgba(56, 189, 248, 0.2)" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="-70" y1="-30" x2="70" y2="-30" stroke="#38bdf8" strokeWidth="1.5" />
                        <text x="0" y="-10" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">NƯỚC SÔI 100°C</text>
                        <path d="M -20 -90 Q -30 -115 -15 -135 M 0 -90 Q 15 -115 0 -135 M 20 -90 Q 10 -115 25 -135" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" className="animate-pulse" />
                        <ellipse cx="0" cy="15" rx="35" ry="20" fill="url(#leafGreenGrad)" stroke="#14532d" strokeWidth="1.5" opacity="0.8" />
                        <text x="0" y="80" textAnchor="middle" fill="#94a3b8" fontSize="11">Nhúng 1 phút để phá hủy tế bào lá</text>
                      </g>
                    )}

                    {/* STAGE 3: Alcohol bath 90° */}
                    {starchStep === 3 && (
                      <g transform="translate(370, 210)">
                        <rect x="-90" y="-90" width="180" height="140" rx="8" fill="rgba(255, 255, 255, 0.08)" stroke="#94a3b8" strokeWidth="2" />
                        <text x="0" y="-70" textAnchor="middle" fill="#94a3b8" fontSize="10">NƯỚC ĐUN CÁCH THỦY</text>
                        <rect x="-45" y="-50" width="90" height="90" rx="6" fill="rgba(34, 197, 94, 0.35)" stroke="#22c55e" strokeWidth="1.5" />
                        <text x="0" y="-30" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="bold">CỒN 90°</text>
                        <ellipse cx="0" cy="15" rx="30" ry="16" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" opacity="0.9" />
                        <text x="0" y="80" textAnchor="middle" fill="#fef08a" fontSize="11">
                          Chất diệp lục tan vào cồn làm cồn xanh lá, lá biến thành màu trắng ngà
                        </text>
                      </g>
                    )}

                    {/* STAGE 4: Adding Iodine Drops */}
                    {starchStep === 4 && (
                      <g transform="translate(370, 210)">
                        <ellipse cx="0" cy="40" rx="140" ry="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                        <ellipse cx="0" cy="38" rx="80" ry="24" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
                        <g transform="translate(0, -70)">
                          <rect x="-6" y="-30" width="12" height="60" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                          <rect x="-10" y="-45" width="20" height="18" rx="4" fill="#ef4444" />
                          <path d="M -6 30 L 0 45 L 6 30 Z" fill="#b45309" />
                          <circle cx="0" cy="65" r="4" fill="#b45309" className="animate-bounce" />
                          <text x="35" y="0" fill="#f59e0b" fontSize="11" fontWeight="bold">DUNG DỊCH IOT (NÂU)</text>
                        </g>
                      </g>
                    )}

                    {/* STAGE 5: Final Result (Contrast Colors) */}
                    {starchStep === 5 && (
                      <g transform="translate(370, 200)">
                        <ellipse cx="0" cy="40" rx="150" ry="45" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                        <g>
                          <ellipse cx="0" cy="38" rx="100" ry="30" fill="url(#leafStarchGrad)" stroke="#1e1b4b" strokeWidth="2" />
                          <line x1="-60" y1="20" x2="-140" y2="-40" stroke="#818cf8" strokeWidth="1.5" />
                          <circle cx="-60" cy="20" r="3" fill="#818cf8" />
                          <rect x="-260" y="-65" width="210" height="40" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                          <text x="-155" y="-48" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="bold">PHẦN CHIẾU SÁNG:</text>
                          <text x="-155" y="-34" textAnchor="middle" fill="#ffffff" fontSize="10">Có tinh bột ➔ Xanh tím</text>

                          <line x1="0" y1="38" x2="110" y2="-40" stroke="#f59e0b" strokeWidth="1.5" />
                          <circle cx="0" cy="38" r="3" fill="#f59e0b" />
                          <rect x="70" y="-65" width="210" height="40" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x="175" y="-48" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">PHẦN CHE BĂNG ĐEN:</text>
                          <text x="175" y="-34" textAnchor="middle" fill="#ffffff" fontSize="10">Không quang hợp ➔ Vàng nâu</text>
                        </g>
                        <text x="0" y="110" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
                          KẾT LUẬN: QUANG HỢP Ở LÁ CÂY CHẾ TẠO TINH BỘT KHI CÓ ÁNH SÁNG
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 10. MÔ PHỎNG: TÁCH CHẤT HỖN HỢP (KHTN 6 Bài 20)           */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "mixture_separation" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                      <linearGradient id="saltSolutionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                        <stop offset="100%" stopColor="rgba(14, 165, 233, 0.6)" />
                      </linearGradient>
                      <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="40%" stopColor="#f97316" />
                        <stop offset="80%" stopColor="#fde047" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>

                    {/* Mode 1: Lọc tách chất rắn (cát) */}
                    {separationMethod === "filter" ? (
                      <g>
                        {/* Iron Stand */}
                        <rect x="140" y="50" width="12" height="280" rx="3" fill="#64748b" />
                        <rect x="90" y="320" width="160" height="14" rx="4" fill="#334155" />
                        {/* Ring clamp */}
                        <rect x="146" y="145" width="130" height="8" rx="2" fill="#475569" />
                        <ellipse cx="276" cy="149" rx="38" ry="10" fill="none" stroke="#475569" strokeWidth="6" />

                        {/* Glass Funnel */}
                        <polygon points="230,135 322,135 284,215 284,260 278,265 278,215" fill="rgba(255, 255, 255, 0.12)" stroke="#94a3b8" strokeWidth="2" />
                        
                        {/* Filter Paper inside funnel */}
                        <polygon points="238,138 314,138 280,210" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                        
                        {/* Sand residue on filter paper */}
                        <ellipse cx="276" cy="165" rx="22" ry="12" fill="url(#sandGrad)" stroke="#78350f" strokeWidth="1" />
                        <text x="276" y="150" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">BÃ CÁT (KHÔNG TAN)</text>

                        {/* Glass Stirring Rod */}
                        <line x1="220" y1="80" x2="278" y2="185" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                        <text x="210" y="70" textAnchor="end" fill="#93c5fd" fontSize="10">Đũa thủy tinh</text>

                        {/* Receiving Beaker below */}
                        <rect x="238" y="240" width="76" height="85" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#94a3b8" strokeWidth="2" />
                        {/* Filtrate liquid level */}
                        {(() => {
                          const liquidH = (separationProgress / 100) * 45;
                          return (
                            <g>
                              <rect x="240" y={323 - liquidH} width="72" height={liquidH} fill="url(#saltSolutionGrad)" rx="2" />
                              <ellipse cx="276" cy={323 - liquidH} rx="36" ry="6" fill="#38bdf8" opacity="0.4" />
                            </g>
                          );
                        })()}
                        <text x="276" y="315" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">NƯỚC MUỐI (DỊCH LỌC)</text>

                        {/* Falling liquid droplets when separating */}
                        {isSeparating && (
                          <g className="animate-bounce">
                            <ellipse cx="281" cy="235" rx="2" ry="3.5" fill="#38bdf8" />
                            <ellipse cx="281" cy="255" rx="2" ry="3.5" fill="#38bdf8" />
                          </g>
                        )}

                        {/* Right Information & Process card */}
                        <g transform="translate(420, 90)">
                          <rect x="0" y="0" width="280" height="200" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                          <text x="20" y="32" fill="#38bdf8" fontSize="13" fontWeight="bold">PHƯƠNG PHÁP LỌC (FILTRATION)</text>
                          <text x="20" y="60" fill="#94a3b8" fontSize="11">Hỗn hợp: Cát hạt không tan + Nước muối</text>
                          
                          <g transform="translate(20, 80)">
                            <rect x="0" y="0" width="240" height="26" rx="6" fill="#1e293b" />
                            <rect x="0" y="0" width={(separationProgress / 100) * 240} height="26" rx="6" fill="#0284c7" />
                            <text x="120" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                              Tiến trình lọc: {separationProgress}%
                            </text>
                          </g>

                          <text x="20" y="135" fill="#e2e8f0" fontSize="11">
                            • Giấy lọc giữ lại: <tspan fill="#f59e0b" fontWeight="bold">Bã cát</tspan>
                          </text>
                          <text x="20" y="155" fill="#e2e8f0" fontSize="11">
                            • Cốc hứng thu được: <tspan fill="#38bdf8" fontWeight="bold">Nước muối trong suốt</tspan>
                          </text>
                          <text x="20" y="180" fill="#10b981" fontSize="11" fontWeight="bold">
                            {separationProgress >= 100 ? "✓ ĐÃ TÁCH HOÀN TOÀN CÁT RA KHỎI NƯỚC" : isSeparating ? "⏳ Đang lọc qua phễu..." : "Nhấn 'Bắt đầu' để lọc"}
                          </text>
                        </g>
                      </g>
                    ) : (
                      /* Mode 2: Cô cạn kết tinh muối */
                      <g>
                        {/* Tripod Stand with wire mesh */}
                        <line x1="200" y1="320" x2="235" y2="200" stroke="#64748b" strokeWidth="4" />
                        <line x1="330" y1="320" x2="295" y2="200" stroke="#64748b" strokeWidth="4" />
                        <line x1="265" y1="320" x2="265" y2="200" stroke="#475569" strokeWidth="4" />
                        <ellipse cx="265" cy="200" rx="55" ry="12" fill="#334155" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
                        <text x="265" y="196" textAnchor="middle" fill="#cbd5e1" fontSize="9">Lưới amiăng tản nhiệt</text>

                        {/* Porcelain Evaporating Dish */}
                        <path d="M 220 185 Q 265 220 310 185 Q 315 178 305 178 Q 265 190 225 178 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                        
                        {/* Salt Water solution in dish diminishing */}
                        {(() => {
                          const liquidOpacity = Math.max(0, 1 - separationProgress / 100);
                          return (
                            <path
                              d="M 230 184 Q 265 212 300 184 Q 265 188 230 184 Z"
                              fill="url(#saltSolutionGrad)"
                              opacity={liquidOpacity}
                            />
                          );
                        })()}

                        {/* White NaCl Crystals accumulating */}
                        {(() => {
                          const crystalOpacity = Math.min(1, separationProgress / 80);
                          return (
                            <g opacity={crystalOpacity}>
                              <ellipse cx="265" cy="203" rx="28" ry="7" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                              <circle cx="255" cy="202" r="2" fill="#e2e8f0" />
                              <circle cx="268" cy="204" r="2.5" fill="#e2e8f0" />
                              <circle cx="278" cy="201" r="2" fill="#e2e8f0" />
                              <text x="265" y="218" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">TINH THỂ MUỐI (NaCl)</text>
                            </g>
                          );
                        })()}

                        {/* Rising Steam when separating */}
                        {isSeparating && (
                          <g className="animate-pulse">
                            <path d="M 245 160 Q 235 130 250 100" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
                            <path d="M 265 155 Q 275 125 260 95" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.8" />
                            <path d="M 285 160 Q 295 130 280 100" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
                            <text x="265" y="85" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">HƠI NƯỚC BAY LÊN</text>
                          </g>
                        )}

                        {/* Spirit Burner beneath */}
                        <rect x="240" y="245" width="50" height="60" rx="8" fill="rgba(255, 255, 255, 0.15)" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="242" y="265" width="46" height="38" rx="4" fill="rgba(239, 68, 68, 0.25)" />
                        <rect x="258" y="235" width="14" height="12" rx="2" fill="#d97706" />
                        
                        {/* Flickering Flame */}
                        <path
                          d={flameLevel === "high" ? "M 260 235 Q 265 180 270 235 Z" : flameLevel === "medium" ? "M 261 235 Q 265 195 269 235 Z" : "M 262 235 Q 265 210 268 235 Z"}
                          fill="url(#flameGrad)"
                          className="animate-pulse drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                        />
                        <text x="265" y="325" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="bold">ĐÈN CỒN (LỬA {flameLevel.toUpperCase()})</text>

                        {/* Right Information Card */}
                        <g transform="translate(420, 90)">
                          <rect x="0" y="0" width="280" height="200" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                          <text x="20" y="32" fill="#f59e0b" fontSize="13" fontWeight="bold">PHƯƠNG PHÁP CÔ CẠN (EVAPORATION)</text>
                          <text x="20" y="60" fill="#94a3b8" fontSize="11">Tách chất tan rắn khỏi dung dịch</text>
                          
                          <g transform="translate(20, 80)">
                            <rect x="0" y="0" width="240" height="26" rx="6" fill="#1e293b" />
                            <rect x="0" y="0" width={(separationProgress / 100) * 240} height="26" rx="6" fill="#f59e0b" />
                            <text x="120" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                              Tiến độ bốc hơi: {separationProgress}%
                            </text>
                          </g>

                          <text x="20" y="135" fill="#e2e8f0" fontSize="11">
                            • Nước (nhiệt độ sôi 100°C) ➔ <tspan fill="#38bdf8" fontWeight="bold">Bay hơi hết</tspan>
                          </text>
                          <text x="20" y="155" fill="#e2e8f0" fontSize="11">
                            • Thu hồi: <tspan fill="#10b981" fontWeight="bold">{separationCalculations.saltGrams} g muối NaCl kết tinh</tspan>
                          </text>
                          <text x="20" y="180" fill="#10b981" fontSize="11" fontWeight="bold">
                            {separationProgress >= 100 ? "✓ ĐÃ THU ĐƯỢC TOÀN BỘ MUỐI ĂN KẾT TINH" : isSeparating ? "🔥 Đang đun sôi cô cạn..." : "Nhấn 'Bắt đầu' để đun"}
                          </text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 11. MÔ PHỎNG: LỰC MA SÁT TRƯỢT (KHTN 6 Bài 40)             */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "friction_force" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="glassSurface" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="woodSurface" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#78350f" />
                        <stop offset="50%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                      <linearGradient id="sandpaperSurface" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="50%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                    </defs>

                    {/* Surface Base Track */}
                    <rect x="60" y="250" width="620" height="24" rx="4"
                      fill={surfaceType === "glass" ? "url(#glassSurface)" : surfaceType === "wood" ? "url(#woodSurface)" : "url(#sandpaperSurface)"}
                      stroke="#94a3b8" strokeWidth="1.5"
                    />
                    {/* Texture Details for Sandpaper */}
                    {surfaceType === "sandpaper" && (
                      <g opacity="0.6">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <circle key={i} cx={80 + i * 20} cy={262} r={1.5} fill="#f1f5f9" />
                        ))}
                      </g>
                    )}
                    <text x="370" y="295" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold">
                      BỀ MẶT TIẾP XÚC: {frictionCalculations.surfaceLabel.toUpperCase()}
                    </text>

                    {/* Rulers / Scale on table */}
                    <line x1="60" y1="274" x2="680" y2="274" stroke="#64748b" strokeWidth="1" />
                    {Array.from({ length: 11 }).map((_, i) => (
                      <line key={i} x1={80 + i * 56} y1="274" x2={80 + i * 56} y2="280" stroke="#94a3b8" strokeWidth="1" />
                    ))}

                    {/* Wooden Block with weights */}
                    {(() => {
                      const blockX = isPullingBlock ? 220 : 160;
                      return (
                        <g transform={`translate(${blockX}, 170)`} className="transition-all duration-300">
                          {/* Wooden Block Body */}
                          <rect x="0" y="0" width="100" height="80" rx="4" fill="#d97706" stroke="#92400e" strokeWidth="2" />
                          <text x="50" y="45" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">KHỐI GỖ</text>
                          <text x="50" y="62" textAnchor="middle" fill="#fef3c7" fontSize="10">{blockMassG} gam</text>

                          {/* Stacked slotted weights on top */}
                          {blockMassG >= 200 && (
                            <rect x="25" y="-14" width="50" height="14" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                          )}
                          {blockMassG >= 300 && (
                            <rect x="28" y="-28" width="44" height="14" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                          )}
                          {blockMassG >= 400 && (
                            <rect x="31" y="-42" width="38" height="14" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                          )}
                          {blockMassG >= 500 && (
                            <rect x="34" y="-56" width="32" height="14" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                          )}

                          {/* Eye hook */}
                          <circle cx="102" cy="40" r="5" fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                          {/* Pull hook connected to dynamometer */}
                          <line x1="107" y1="40" x2="140" y2="40" stroke="#e2e8f0" strokeWidth="2.5" />

                          {/* Spring Dynamometer (Lực kế lò xo) */}
                          <g transform="translate(140, 20)">
                            {/* Dynamometer Cylinder Case */}
                            <rect x="0" y="8" width="150" height="24" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                            {/* Internal Spring */}
                            <path
                              d={isPullingBlock
                                ? "M 10 20 Q 25 10 40 20 Q 55 30 70 20 Q 85 10 100 20"
                                : "M 10 20 Q 20 12 30 20 Q 40 28 50 20 Q 60 12 70 20"}
                              fill="none" stroke="#f59e0b" strokeWidth="2"
                            />
                            {/* Indicator needle */}
                            <line x1={isPullingBlock ? 60 + frictionCalculations.frictionForceN * 20 : 30} y1="8" x2={isPullingBlock ? 60 + frictionCalculations.frictionForceN * 20 : 30} y2="32" stroke="#ef4444" strokeWidth="2.5" />
                            {/* Pull handle ring */}
                            <circle cx="160" cy="20" r="10" fill="none" stroke="#38bdf8" strokeWidth="3" />
                            <line x1="150" y1="20" x2="160" y2="20" stroke="#38bdf8" strokeWidth="2.5" />
                            <text x="75" y="48" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                              LỰC KẾ KÉO ({frictionCalculations.pullReadingN} N)
                            </text>
                          </g>

                          {/* Vectors of Forces */}
                          {/* Gravity Force P (Down) */}
                          <line x1="50" y1="40" x2="50" y2="120" stroke="#ef4444" strokeWidth="2.5" />
                          <polygon points="50,125 46,115 54,115" fill="#ef4444" />
                          <text x="58" y="115" fill="#ef4444" fontSize="10" fontWeight="bold">P = {frictionCalculations.normalForceN}N</text>

                          {/* Normal Force N (Up) */}
                          <line x1="50" y1="40" x2="50" y2="-70" stroke="#3b82f6" strokeWidth="2.5" />
                          <polygon points="50,-75 46,-65 54,-65" fill="#3b82f6" />
                          <text x="58" y="-60" fill="#3b82f6" fontSize="10" fontWeight="bold">N = {frictionCalculations.normalForceN}N</text>

                          {/* Friction Force F_ms (Left) */}
                          <line x1="50" y1="80" x2={50 - frictionCalculations.frictionForceN * 25} y2="80" stroke="#f59e0b" strokeWidth="2.5" />
                          <polygon points={`${50 - frictionCalculations.frictionForceN * 25 - 5},80 ${50 - frictionCalculations.frictionForceN * 25 + 5},76 ${50 - frictionCalculations.frictionForceN * 25 + 5},84`} fill="#f59e0b" />
                          <text x={30 - frictionCalculations.frictionForceN * 25} y="95" fill="#f59e0b" fontSize="10" fontWeight="bold">
                            F_ms = {frictionCalculations.frictionForceN}N
                          </text>

                          {/* Pull Force F_k (Right) */}
                          {isPullingBlock && (
                            <g>
                              <line x1="50" y1="40" x2="135" y2="40" stroke="#22c55e" strokeWidth="2.5" />
                              <polygon points="140,40 130,36 130,44" fill="#22c55e" />
                              <text x="110" y="30" fill="#22c55e" fontSize="10" fontWeight="bold">F_k = {frictionCalculations.frictionForceN}N</text>
                            </g>
                          )}
                        </g>
                      );
                    })()}

                    {/* Summary Box */}
                    <g transform="translate(480, 50)">
                      <rect x="0" y="0" width="220" height="90" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <text x="15" y="24" fill="#94a3b8" fontSize="11">Hệ số ma sát trượt (μ):</text>
                      <text x="170" y="24" fill="#38bdf8" fontSize="12" fontWeight="bold">{frictionCalculations.mu}</text>
                      <text x="15" y="46" fill="#94a3b8" fontSize="11">Áp lực vuông góc (N):</text>
                      <text x="170" y="46" fill="#3b82f6" fontSize="12" fontWeight="bold">{frictionCalculations.normalForceN} N</text>
                      <line x1="15" y1="56" x2="205" y2="56" stroke="#1e293b" />
                      <text x="15" y="74" fill="#f59e0b" fontSize="11" fontWeight="bold">Lực ma sát F_ms:</text>
                      <text x="170" y="74" fill="#f59e0b" fontSize="13" fontWeight="bold">{frictionCalculations.frictionForceN} N</text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 12. MÔ PHỎNG: PHẢN XẠ ÁNH SÁNG & GƯƠNG PHẲNG (KHTN 7 Bài 12)*/}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "optics_plane_mirror" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="mirrorSilver" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>

                    {/* Center Mirror Line at x = 370 */}
                    <line x1="370" y1="40" x2="370" y2="340" stroke="url(#mirrorSilver)" strokeWidth="4" />
                    {/* Hatching on the silver coated back (Right side) */}
                    {Array.from({ length: 15 }).map((_, i) => (
                      <line key={i} x1="370" y1={50 + i * 19} x2="382" y2={60 + i * 19} stroke="#64748b" strokeWidth="1.5" />
                    ))}
                    <text x="388" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">GƯƠNG PHẲNG (M)</text>

                    {mirrorMode === "rays" ? (
                      /* Ray Reflection Investigation */
                      <g>
                        {/* Normal Line (IN) */}
                        <line x1="120" y1="190" x2="420" y2="190" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" />
                        <text x="130" y="180" fill="#94a3b8" fontSize="10">Pháp tuyến (N)</text>
                        <circle cx="370" cy="190" r="3" fill="#ffffff" />
                        <text x="375" y="185" fill="#ffffff" fontSize="11" fontWeight="bold">I</text>

                        {/* Incident Ray SI */}
                        {(() => {
                          const radI = (planeMirrorCalculations.i * Math.PI) / 180;
                          const srcX = 370 - Math.cos(radI) * 220;
                          const srcY = 190 - Math.sin(radI) * 220;
                          return (
                            <g>
                              <line x1={srcX} y1={srcY} x2="370" y2="190" stroke="#f59e0b" strokeWidth="3" />
                              <circle cx={srcX} cy={srcY} r="6" fill="#f59e0b" />
                              <text x={srcX - 10} y={srcY - 10} fill="#f59e0b" fontSize="11" fontWeight="bold">S (Nguồn sáng)</text>
                              {/* Arrow on ray */}
                              <polygon points="300,190 288,186 288,194" fill="#f59e0b" transform={`rotate(${planeMirrorCalculations.i}, 370, 190)`} />
                            </g>
                          );
                        })()}

                        {/* Reflected Ray IR */}
                        {(() => {
                          const radI = (planeMirrorCalculations.i * Math.PI) / 180;
                          const refX = 370 - Math.cos(radI) * 220;
                          const refY = 190 + Math.sin(radI) * 220;
                          return (
                            <g>
                              <line x1="370" y1="190" x2={refX} y2={refY} stroke="#22c55e" strokeWidth="3" />
                              <circle cx={refX} cy={refY} r="5" fill="#22c55e" />
                              <text x={refX - 10} y={refY + 18} fill="#22c55e" fontSize="11" fontWeight="bold">R (Tia phản xạ)</text>
                            </g>
                          );
                        })()}

                        {/* Angle arcs */}
                        <path
                          d={`M ${370 - 70 * Math.cos((planeMirrorCalculations.i * Math.PI) / 180)} ${190 - 70 * Math.sin((planeMirrorCalculations.i * Math.PI) / 180)} A 70 70 0 0 1 300 190`}
                          fill="none" stroke="#f59e0b" strokeWidth="2"
                        />
                        <text x="320" y="165" fill="#f59e0b" fontSize="11" fontWeight="bold">i = {planeMirrorCalculations.i}°</text>

                        <path
                          d={`M 300 190 A 70 70 0 0 1 ${370 - 70 * Math.cos((planeMirrorCalculations.i * Math.PI) / 180)} ${190 + 70 * Math.sin((planeMirrorCalculations.i * Math.PI) / 180)}`}
                          fill="none" stroke="#22c55e" strokeWidth="2"
                        />
                        <text x="320" y="225" fill="#22c55e" fontSize="11" fontWeight="bold">i&apos; = {planeMirrorCalculations.iPrime}°</text>

                        {/* Law Banner */}
                        <g transform="translate(140, 310)">
                          <rect x="0" y="0" width="460" height="40" rx="10" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
                          <text x="230" y="25" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="bold">
                            ĐỊNH LUẬT PHẢN XẠ ÁNH SÁNG: GÓC PHẢN XẠ i&apos; = i = {planeMirrorCalculations.i}° (GÓC HỢP LỰC = {planeMirrorCalculations.angleBetweenRays}°)
                          </text>
                        </g>
                      </g>
                    ) : (
                      /* Object & Virtual Image Mode */
                      <g>
                        {/* Object Candle at distance d left of mirror */}
                        {(() => {
                          const objX = 370 - planeMirrorCalculations.d * 6;
                          const candleH = planeMirrorCalculations.h * 12;
                          const imgX = 370 + planeMirrorCalculations.dPrime * 6;
                          return (
                            <g>
                              {/* Object Candle */}
                              <g transform={`translate(${objX}, ${230 - candleH})`}>
                                <rect x="-8" y="0" width="16" height={candleH} rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
                                <ellipse cx="0" cy="-6" rx="5" ry="9" fill="#f59e0b" className="animate-pulse" />
                                <text x="0" y={candleH + 20} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                                  VẬT THẬT AB (h = {planeMirrorCalculations.h}cm)
                                </text>
                              </g>

                              {/* Virtual Image Candle (Dashed, Symmetric) */}
                              <g transform={`translate(${imgX}, ${230 - candleH})`}>
                                <rect x="-8" y="0" width="16" height={candleH} rx="2" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
                                <ellipse cx="0" cy="-6" rx="5" ry="9" fill="rgba(245, 158, 11, 0.6)" opacity="0.7" />
                                <text x="0" y={candleH + 20} textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
                                  ẢNH ẢO A&apos;B&apos; (h&apos; = {planeMirrorCalculations.hPrime}cm)
                                </text>
                              </g>

                              {/* Ray tracing lines */}
                              <line x1={objX} y1={230 - candleH} x2="370" y2={230 - candleH} stroke="#f59e0b" strokeWidth="1.5" />
                              <line x1="370" y1={230 - candleH} x2={imgX} y2={230 - candleH} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />

                              <line x1={objX} y1={230 - candleH} x2="370" y2="210" stroke="#f59e0b" strokeWidth="1.5" />
                              <line x1="370" y1="210" x2={imgX} y2={230 - candleH} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
                              <line x1="370" y1="210" x2="160" y2="290" stroke="#22c55e" strokeWidth="1.5" />

                              {/* Eye observer */}
                              <g transform="translate(130, 280)">
                                <path d="M 0 0 Q 20 -12 40 0 Q 20 12 0 0 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                                <circle cx="20" cy="0" r="6" fill="#38bdf8" />
                                <text x="20" y="25" textAnchor="middle" fill="#94a3b8" fontSize="10">Mắt nhìn</text>
                              </g>

                              {/* Distance ruler lines */}
                              <line x1={objX} y1="290" x2="370" y2="290" stroke="#f59e0b" strokeWidth="1.5" />
                              <text x={(objX + 370) / 2} y="284" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                                d = {planeMirrorCalculations.d} cm
                              </text>

                              <line x1="370" y1="290" x2={imgX} y2="290" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                              <text x={(imgX + 370) / 2} y="284" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                                d&apos; = {planeMirrorCalculations.dPrime} cm
                              </text>
                            </g>
                          );
                        })()}

                        {/* Properties Banner */}
                        <g transform="translate(120, 325)">
                          <rect x="0" y="0" width="500" height="36" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                          <text x="250" y="23" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                            TÍNH CHẤT ẢNH: ẢNH ẢO ĐỐI XỨNG QUA GƯƠNG • d&apos; = d = {planeMirrorCalculations.d}cm • h&apos; = h = {planeMirrorCalculations.h}cm
                          </text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 13. MÔ PHỎNG: PHẢN XẠ ÂM & TIẾNG VANG (KHTN 7 Bài 14)       */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "sound_reflection_echo" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    {/* Sound Emitter / Person on left at x = 110 */}
                    <g transform="translate(110, 220)">
                      <circle cx="0" cy="-60" r="14" fill="#cbd5e1" />
                      <rect x="-8" y="-44" width="16" height="50" rx="3" fill="#3b82f6" />
                      <line x1="-8" y1="-30" x2="-22" y2="0" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                      <line x1="8" y1="-30" x2="25" y2="-40" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                      {/* Megaphone / Horn */}
                      <polygon points="25,-44 65,-58 65,-22 25,-36" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
                      <ellipse cx="65" cy="-40" rx="6" ry="18" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                      <text x="0" y="25" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">NGƯỜI PHÁT ÂM</text>
                    </g>

                    {/* Target Barrier on Right at fixed x=620 */}
                    <g transform="translate(620, 110)">
                      {barrierMaterial === "cliff" ? (
                        <g>
                          <path d="M 0 0 Q 30 50 10 100 Q 40 150 15 200 L 70 200 L 70 0 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                          <text x="35" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="bold" transform="rotate(90, 35, 105)">
                            VÁCH ĐÁ
                          </text>
                        </g>
                      ) : barrierMaterial === "brick_wall" ? (
                        <g>
                          <rect x="0" y="0" width="50" height="200" rx="4" fill="#991b1b" stroke="#f87171" strokeWidth="2" />
                          {Array.from({ length: 8 }).map((_, i) => (
                            <line key={i} x1="0" y1={i * 25} x2="50" y2={i * 25} stroke="#fca5a5" strokeWidth="1" />
                          ))}
                          <text x="25" y="105" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" transform="rotate(90, 25, 105)">
                            TƯỜNG GẠCH
                          </text>
                        </g>
                      ) : (
                        <g>
                          <rect x="0" y="0" width="40" height="200" rx="4" fill="#581c87" stroke="#c084fc" strokeWidth="2" />
                          {Array.from({ length: 6 }).map((_, i) => (
                            <path key={i} d={`M 0 ${i * 35} Q 20 ${i * 35 + 17} 0 ${i * 35 + 35}`} fill="none" stroke="#e9d5ff" strokeWidth="1.5" />
                          ))}
                          <text x="20" y="105" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold" transform="rotate(90, 20, 105)">
                            RÈM NHUNG
                          </text>
                        </g>
                      )}
                    </g>

                    {/* Outgoing Sound Waves (Cyan arcs moving right) */}
                    {isEmittingSound && soundWavePos < 50 && (
                      <g opacity="0.85">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const arcRadius = ((soundWavePos * 2 + i * 15) / 100) * 440;
                          return (
                            <path
                              key={i}
                              d={`M ${175 + arcRadius * Math.cos(-0.4)} ${180 + arcRadius * Math.sin(-0.4)} A ${arcRadius} ${arcRadius} 0 0 1 ${175 + arcRadius * Math.cos(0.4)} ${180 + arcRadius * Math.sin(0.4)}`}
                              fill="none" stroke="#38bdf8" strokeWidth="3" opacity={Math.max(0, 1 - arcRadius / 450)}
                            />
                          );
                        })}
                        <text x="360" y="150" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                          SÓNG ÂM TRỰC TIẾP LAN TRUYỀN (v = 340 m/s) ➔
                        </text>
                      </g>
                    )}

                    {/* Reflected Sound Waves (Orange arcs bouncing back) */}
                    {isEmittingSound && soundWavePos >= 50 && barrierMaterial !== "curtain" && (
                      <g opacity="0.85">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const arcRadius = (((soundWavePos - 50) * 2 + i * 15) / 100) * 440;
                          return (
                            <path
                              key={i}
                              d={`M ${620 - arcRadius * Math.cos(-0.4)} ${180 + arcRadius * Math.sin(-0.4)} A ${arcRadius} ${arcRadius} 0 0 1 ${620 - arcRadius * Math.cos(0.4)} ${180 + arcRadius * Math.sin(0.4)}`}
                              fill="none" stroke="#f59e0b" strokeWidth="3" opacity={Math.max(0, 1 - arcRadius / 450)}
                            />
                          );
                        })}
                        <text x="360" y="150" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
                          ⬅ TIẾNG VANG (SÓNG PHẢN XẠ DỘI LẠI)
                        </text>
                      </g>
                    )}

                    {/* Distance ruler */}
                    <line x1="175" y1="280" x2="620" y2="280" stroke="#64748b" strokeWidth="2" />
                    <polygon points="175,280 185,276 185,284" fill="#64748b" />
                    <polygon points="620,280 610,276 610,284" fill="#64748b" />
                    <rect x="330" y="265" width="140" height="30" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text x="400" y="285" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                      s = {barrierDistance} mét
                    </text>

                    {/* Status Info Card Top */}
                    <g transform="translate(140, 35)">
                      <rect x="0" y="0" width="460" height="75" rx="12" fill="#0f172a" stroke={soundEchoCalculations.canHearEcho ? "#22c55e" : "#eab308"} strokeWidth="1.5" />
                      <text x="20" y="25" fill="#cbd5e1" fontSize="11">
                        Thời gian âm đi và về: <tspan fill="#38bdf8" fontWeight="bold">Δt = 2s / v = 2 x {barrierDistance} / 340 = {soundEchoCalculations.deltaT} s</tspan>
                      </text>
                      <text x="20" y="45" fill="#cbd5e1" fontSize="11">
                        Điều kiện tiếng vang: <tspan fill="#f59e0b" fontWeight="bold">Δt ≥ 1/15s (≈ 0.067s) ➔ s ≥ 11.33m</tspan>
                      </text>
                      <text x="20" y="65" fill={soundEchoCalculations.canHearEcho ? "#22c55e" : "#eab308"} fontSize="11" fontWeight="bold">
                        {soundEchoCalculations.conclusion}
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 14. MÔ PHỎNG: ĐÒN BẨY & CÂN BẰNG MÔ-MEN (KHTN 8 Bài 19)    */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "lever_balance" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <svg viewBox="0 0 740 380" className="w-full h-full max-h-[380px] drop-shadow-2xl">
                    <defs>
                      <linearGradient id="leverBarGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                    </defs>

                    {/* Fulcrum (Điểm tựa O) */}
                    <polygon points="370,200 340,270 400,270" fill="#334155" stroke="#64748b" strokeWidth="2" />
                    <rect x="320" y="270" width="100" height="15" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    <circle cx="370" cy="200" r="5" fill="#f59e0b" />
                    <text x="370" y="235" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">O (Điểm tựa)</text>

                    {/* Rotating Lever Bar */}
                    <g transform={`rotate(${leverCalculations.tiltAngle}, 370, 200)`} className="transition-transform duration-300">
                      {/* Metal Bar */}
                      <rect x="70" y="193" width="600" height="14" rx="4" fill="url(#leverBarGrad)" stroke="#334155" strokeWidth="1.5" />

                      {/* Ruler Marks along the bar from O=370 */}
                      {Array.from({ length: 11 }).map((_, i) => {
                        const markCm = (i - 5) * 10;
                        const markX = 370 + markCm * 5.6;
                        return (
                          <g key={i}>
                            <line x1={markX} y1="193" x2={markX} y2="188" stroke="#ffffff" strokeWidth="1.5" />
                            <text x={markX} y="184" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                              {Math.abs(markCm)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Left Hanger at distance leftArmD1 */}
                      {(() => {
                        const hangerX = 370 - leftArmD1 * 5.6;
                        return (
                          <g transform={`translate(${hangerX}, 207)`}>
                            <line x1="0" y1="0" x2="0" y2="45" stroke="#e2e8f0" strokeWidth="2" />
                            <rect x="-18" y="45" width="36" height="30" rx="4" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                            <text x="0" y="64" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                              {leftMassM1}g
                            </text>
                            <line x1="0" y1="75" x2="0" y2="105" stroke="#ef4444" strokeWidth="2" />
                            <polygon points="0,110 -4,102 4,102" fill="#ef4444" />
                            <text x="0" y="125" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
                              F1 = {leverCalculations.f1} N
                            </text>
                          </g>
                        );
                      })()}

                      {/* Right Hanger at distance rightArmD2 */}
                      {(() => {
                        const hangerX = 370 + rightArmD2 * 5.6;
                        return (
                          <g transform={`translate(${hangerX}, 207)`}>
                            <line x1="0" y1="0" x2="0" y2="45" stroke="#e2e8f0" strokeWidth="2" />
                            <rect x="-18" y="45" width="36" height="30" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                            <text x="0" y="64" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                              {rightMassM2}g
                            </text>
                            <line x1="0" y1="75" x2="0" y2="105" stroke="#3b82f6" strokeWidth="2" />
                            <polygon points="0,110 -4,102 4,102" fill="#3b82f6" />
                            <text x="0" y="125" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
                              F2 = {leverCalculations.f2} N
                            </text>
                          </g>
                        );
                      })()}
                    </g>

                    {/* Moments & Equilibrium Card */}
                    <g transform="translate(150, 40)">
                      <rect x="0" y="0" width="440" height="90" rx="14" fill="#0f172a" stroke={leverCalculations.isBalanced ? "#22c55e" : "#f59e0b"} strokeWidth="1.5" />
                      <text x="25" y="28" fill="#ef4444" fontSize="12" fontWeight="bold">
                        MÔ-MEN TRÁI: M1 = F1 x d1 = {leverCalculations.m1} N.m
                      </text>
                      <text x="25" y="52" fill="#3b82f6" fontSize="12" fontWeight="bold">
                        MÔ-MEN PHẢI: M2 = F2 x d2 = {leverCalculations.m2} N.m
                      </text>
                      <text x="25" y="76" fill={leverCalculations.isBalanced ? "#22c55e" : "#f59e0b"} fontSize="12" fontWeight="bold">
                        {leverCalculations.isBalanced
                          ? "✓ CÂN BẰNG THĂNG BẰNG: F1 x d1 = F2 x d2 (Đòn bẩy nằm ngang)"
                          : `⚠ MÔ-MEN LỆCH ΔM = ${leverCalculations.deltaM} N.m ➔ Nghiêng ${leverCalculations.tiltAngle > 0 ? "sang phải" : "sang trái"}`}
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 15. MÔ PHỎNG: ĐO pH & CHỈ THỊ MÀU ACID - BASE             */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "acid_base_ph_indicator" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    <rect x="30" y="310" width="700" height="90" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="30" y1="310" x2="730" y2="310" stroke="#475569" strokeWidth="3" />

                    {/* pH Color Reference Bar (Thang màu pH chuẩn 1 - 14) */}
                    <g transform="translate(60, 25)">
                      <rect x="0" y="0" width="640" height="50" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <text x="20" y="16" fill="#94a3b8" fontSize="10" fontWeight="bold">THANG ĐO pH CHUẨN (1 - 14):</text>
                      {[
                        { ph: 1, color: "#dc2626" },
                        { ph: 2, color: "#ea580c" },
                        { ph: 3, color: "#f97316" },
                        { ph: 4, color: "#fb923c" },
                        { ph: 5, color: "#facc15" },
                        { ph: 6, color: "#a3e635" },
                        { ph: 7, color: "#22c55e" },
                        { ph: 8, color: "#14b8a6" },
                        { ph: 9, color: "#06b6d4" },
                        { ph: 10, color: "#0284c7" },
                        { ph: 11, color: "#3b82f6" },
                        { ph: 12, color: "#6366f1" },
                        { ph: 13, color: "#8b5cf6" },
                        { ph: 14, color: "#6d28d9" },
                      ].map((item, idx) => (
                        <g key={item.ph} transform={`translate(${20 + idx * 43}, 22)`}>
                          <rect
                            x="0"
                            y="0"
                            width="38"
                            height="20"
                            rx="3"
                            fill={item.color}
                            stroke={Math.round(phCalculations.ph) === item.ph ? "#ffffff" : "none"}
                            strokeWidth="2"
                          />
                          <text x="19" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                            {item.ph}
                          </text>
                        </g>
                      ))}
                    </g>

                    {/* Test Beaker & Indicators on Table */}
                    <g transform="translate(60, 95)">
                      <path d="M 80 80 L 80 210 Q 80 220 90 220 L 210 220 Q 220 220 220 210 L 220 80" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <ellipse cx="150" cy="80" rx="70" ry="12" fill="none" stroke="#94a3b8" strokeWidth="3" />
                      <path
                        d="M 84 130 Q 150 140 216 130 L 216 210 Q 216 216 210 216 L 90 216 Q 84 216 84 210 Z"
                        fill={
                          selectedIndicator === "phenolphthalein" && isIndicatorApplied && phCalculations.ph >= 8.3
                            ? "rgba(236, 72, 153, 0.75)"
                            : selectedPhSample === "lemon"
                            ? "rgba(254, 240, 138, 0.6)"
                            : selectedPhSample === "soap"
                            ? "rgba(186, 230, 253, 0.5)"
                            : selectedPhSample === "naoh"
                            ? "rgba(224, 242, 254, 0.4)"
                            : "rgba(203, 213, 225, 0.35)"
                        }
                      />
                      <ellipse cx="150" cy="130" rx="66" ry="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                      <line x1="84" y1="150" x2="105" y2="150" stroke="#94a3b8" strokeWidth="2" />
                      <text x="110" y="153" fill="#94a3b8" fontSize="9">100ml</text>
                      <line x1="84" y1="175" x2="100" y2="175" stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1="84" y1="195" x2="105" y2="195" stroke="#94a3b8" strokeWidth="2" />
                      <text x="110" y="198" fill="#94a3b8" fontSize="9">50ml</text>

                      <rect x="95" y="160" width="110" height="36" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                      <text x="150" y="174" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">{phCalculations.name}</text>
                      <text x="150" y="188" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">{phCalculations.formula}</text>

                      {selectedIndicator === "litmus" ? (
                        <g transform={`translate(138, ${isIndicatorApplied ? 90 : 20})`} className="transition-all duration-500">
                          <path d="M 8 -30 L 10 5 L 14 5 L 12 -30" fill="#94a3b8" />
                          <rect x="4" y="5" width="16" height="85" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                          {isIndicatorApplied && (
                            <rect x="4" y="45" width="16" height="45" rx="2" fill={phCalculations.paperColor} />
                          )}
                          <text x="12" y="35" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">QUỲ</text>
                        </g>
                      ) : selectedIndicator === "phenolphthalein" ? (
                        <g transform={`translate(142, ${isIndicatorApplied ? 50 : 10})`} className="transition-all duration-500">
                          <rect x="4" y="-30" width="8" height="60" fill="none" stroke="#94a3b8" strokeWidth="2" />
                          <polygon points="4,30 12,30 9,45 7,45" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                          <ellipse cx="8" cy="-35" rx="9" ry="12" fill="#ef4444" />
                          {isIndicatorApplied && (
                            <circle cx="8" cy="65" r="3.5" fill="#ec4899" className="animate-bounce" />
                          )}
                          <text x="24" y="10" fill="#f472b6" fontSize="10" fontWeight="bold">Lọ Phenolphtalein</text>
                        </g>
                      ) : (
                        <g transform={`translate(138, ${isIndicatorApplied ? 90 : 20})`} className="transition-all duration-500">
                          <rect x="4" y="5" width="16" height="85" rx="2" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
                          {isIndicatorApplied && (
                            <rect x="4" y="45" width="16" height="45" rx="2" fill={phCalculations.paperColor} />
                          )}
                          <text x="12" y="35" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">pH</text>
                        </g>
                      )}
                    </g>

                    {/* Results Card */}
                    <g transform="translate(340, 105)">
                      <rect x="0" y="0" width="370" height="195" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="370" height="34" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="17" r="6" fill="#10b981" />
                      <text x="35" y="21" fill="#f8fafc" fontSize="11" fontWeight="bold">KẾT QUẢ ĐO pH & CHỈ THỊ MÀU</text>

                      <g transform="translate(20, 48)">
                        <text x="0" y="14" fill="#94a3b8" fontSize="11">Dung dịch mẫu:</text>
                        <text x="150" y="14" fill="#38bdf8" fontSize="12" fontWeight="bold">{phCalculations.name}</text>

                        <text x="0" y="38" fill="#94a3b8" fontSize="11">Chỉ thị sử dụng:</text>
                        <text x="150" y="38" fill="#e2e8f0" fontSize="11">
                          {selectedIndicator === "litmus" ? "Giấy quỳ tím chuẩn" : selectedIndicator === "phenolphthalein" ? "Phenolphthalein 0.1%" : "Giấy đo pH vạn năng"}
                        </text>

                        <text x="0" y="62" fill="#94a3b8" fontSize="11">Màu sắc biến đổi:</text>
                        <g transform="translate(150, 50)">
                          <rect x="0" y="0" width="16" height="16" rx="3" fill={phCalculations.indicatorColor} stroke="#ffffff" strokeWidth="1" />
                          <text x="24" y="12" fill={phCalculations.indicatorColor} fontSize="11" fontWeight="bold">
                            {isIndicatorApplied ? phCalculations.indicatorLabel : "Chưa nhúng vào dung dịch"}
                          </text>
                        </g>

                        <line x1="0" y1="78" x2="330" y2="78" stroke="#334155" />

                        <text x="0" y="100" fill="#94a3b8" fontSize="11">Giá trị pH đo được:</text>
                        <text x="150" y="102" fill="#facc15" fontSize="16" fontWeight="bold" fontFamily="monospace">
                          pH = {phCalculations.ph}
                        </text>

                        <text x="0" y="126" fill="#94a3b8" fontSize="11">Môi trường dung dịch:</text>
                        <text x="150" y="126" fill={phCalculations.ph < 7 ? "#ef4444" : phCalculations.ph > 7 ? "#3b82f6" : "#22c55e"} fontSize="12" fontWeight="bold">
                          {phCalculations.env.toUpperCase()}
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 16. MÔ PHỎNG: THẨM THẤU & CO NGUYÊN SINH TẾ BÀO            */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "osmosis_cell_turgor" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    <defs>
                      <clipPath id="microscopeFieldClip">
                        <circle cx="230" cy="210" r="170" />
                      </clipPath>
                      <radialGradient id="eyepieceLighting" cx="45%" cy="40%" r="55%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                        <stop offset="70%" stopColor="#0f172a" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                      </radialGradient>
                    </defs>

                    <circle cx="230" cy="210" r="178" fill="#1e293b" stroke="#38bdf8" strokeWidth="4" />
                    <circle cx="230" cy="210" r="172" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />

                    <g clipPath="url(#microscopeFieldClip)">
                      <rect
                        x="50"
                        y="30"
                        width="360"
                        height="360"
                        fill={osmosisMedium === "hypertonic" ? "#1e1b4b" : osmosisMedium === "hypotonic" ? "#064e3b" : "#0f172a"}
                      />

                      {[-80, 20, 120, 220, 320].map((baseY) => (
                        <g key={baseY}>
                          {[-40, 110, 260].map((baseX) => {
                            const isCenterCell = baseX === 110 && baseY === 120;
                            const vacW = 120 * (isCenterCell ? osmosisCalculations.vacuoleScale : 0.7);
                            const vacH = 75 * (isCenterCell ? osmosisCalculations.vacuoleScale : 0.7);
                            return (
                              <g key={baseX} transform={`translate(${baseX}, ${baseY})`}>
                                <rect x="0" y="0" width="140" height="90" rx="8" fill="none" stroke="#65a30d" strokeWidth="4" />
                                <rect x="2" y="2" width="136" height="86" rx="6" fill="rgba(101, 163, 13, 0.08)" stroke="#84cc16" strokeWidth="1.5" />
                                <rect
                                  x={70 - vacW / 2 - 4}
                                  y={45 - vacH / 2 - 4}
                                  width={vacW + 8}
                                  height={vacH + 8}
                                  rx="8"
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="1.5"
                                  strokeDasharray={osmosisCalculations.isPlasmolyzed && isCenterCell ? "3 2" : "none"}
                                />
                                <rect
                                  x={70 - vacW / 2}
                                  y={45 - vacH / 2}
                                  width={vacW}
                                  height={vacH}
                                  rx="6"
                                  fill="#a855f7"
                                  fillOpacity="0.82"
                                  stroke="#9333ea"
                                  strokeWidth="1.5"
                                />
                                <circle cx="115" cy="25" r="7" fill="#f43f5e" stroke="#e11d48" strokeWidth="1.5" />
                                <circle cx="115" cy="25" r="3" fill="#ffffff" opacity="0.6" />
                                <text x="20" y="80" fill="#84cc16" fontSize="8" opacity="0.8">Tế bào chất</text>
                              </g>
                            );
                          })}
                        </g>
                      ))}

                      {osmosisCalculations.waterDirection === "out" ? (
                        <g transform="translate(180, 165)">
                          <line x1="0" y1="0" x2="-40" y2="-40" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="-44,-44 -34,-40 -40,-34" fill="#38bdf8" />
                          <line x1="60" y1="0" x2="100" y2="-40" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="104,-44 100,-34 94,-40" fill="#38bdf8" />
                          <line x1="0" y1="50" x2="-40" y2="90" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="-44,94 -40,84 -34,90" fill="#38bdf8" />
                          <line x1="60" y1="50" x2="100" y2="90" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="104,94 94,90 100,84" fill="#38bdf8" />
                          <text x="30" y="30" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">H₂O THOÁT RA</text>
                        </g>
                      ) : osmosisCalculations.waterDirection === "in" ? (
                        <g transform="translate(180, 165)">
                          <line x1="-40" y1="-40" x2="0" y2="0" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="4,4 -6,0 0,-6" fill="#38bdf8" />
                          <line x1="100" y1="-40" x2="60" y2="0" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="56,4 56,-6 66,0" fill="#38bdf8" />
                          <line x1="-40" y1="90" x2="0" y2="50" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="4,46 0,56 -6,50" fill="#38bdf8" />
                          <line x1="100" y1="90" x2="60" y2="50" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                          <polygon points="56,46 66,50 56,56" fill="#38bdf8" />
                          <text x="30" y="30" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">H₂O ĐI VÀO</text>
                        </g>
                      ) : null}

                      <circle cx="230" cy="210" r="170" fill="url(#eyepieceLighting)" />
                      <line x1="220" y1="210" x2="240" y2="210" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      <line x1="230" y1="200" x2="230" y2="220" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                    </g>

                    <g transform="translate(70, 45)">
                      <rect x="0" y="0" width="100" height="24" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1" />
                      <text x="50" y="16" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">ĐỘ PHÓNG ĐẠI: {microscopeZoom}</text>
                    </g>

                    <g transform="translate(430, 45)">
                      <rect x="0" y="0" width="300" height="320" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="300" height="38" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="19" r="6" fill="#a855f7" />
                      <text x="35" y="23" fill="#f8fafc" fontSize="11" fontWeight="bold">QUAN SÁT TẾ BÀO VẢY HÀNH</text>

                      <g transform="translate(18, 55)">
                        <text x="0" y="14" fill="#94a3b8" fontSize="11">Môi trường dung dịch:</text>
                        <text x="0" y="34" fill="#38bdf8" fontSize="12" fontWeight="bold">{osmosisCalculations.title}</text>

                        <line x1="0" y1="46" x2="264" y2="46" stroke="#334155" />

                        <text x="0" y="66" fill="#94a3b8" fontSize="11">Hiện tượng tế bào:</text>
                        <text x="0" y="86" fill={osmosisCalculations.isPlasmolyzed ? "#f59e0b" : "#22c55e"} fontSize="12" fontWeight="bold">
                          {osmosisCalculations.isPlasmolyzed ? "⚡ HIỆN TƯỢNG CO NGUYÊN SINH" : "✓ TRƯƠNG BÀO / BÌNH THƯỜNG"}
                        </text>

                        <text x="0" y="112" fill="#94a3b8" fontSize="11">Thể tích không bào tím:</text>
                        <text x="170" y="112" fill="#a855f7" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          ~{Math.round(osmosisCalculations.vacuoleScale * 100)}%
                        </text>

                        <text x="0" y="138" fill="#94a3b8" fontSize="11">Màng sinh chất:</text>
                        <text x="140" y="138" fill={osmosisCalculations.isPlasmolyzed ? "#ef4444" : "#22c55e"} fontSize="11" fontWeight="bold">
                          {osmosisCalculations.isPlasmolyzed ? "Tách rời thành" : "Áp sát thành"}
                        </text>

                        <line x1="0" y1="152" x2="264" y2="152" stroke="#334155" />

                        <text x="0" y="172" fill="#cbd5e1" fontSize="10" fontWeight="bold">Cơ chế thẩm thấu KNTT:</text>
                        <foreignObject x="0" y="180" width="264" height="110">
                          <p className="text-[11px] text-neutral-300 leading-relaxed m-0">
                            {osmosisCalculations.desc}
                          </p>
                        </foreignObject>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 17. MÔ PHỎNG: CẢM ỨNG ĐIỆN TỪ & ĐỊNH LUẬT LENZ             */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "electromagnetic_induction" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    <rect x="40" y="320" width="680" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="40" y1="320" x2="720" y2="320" stroke="#475569" strokeWidth="3" />

                    {/* Solenoid Induction Coil */}
                    <g transform="translate(320, 160)">
                      <rect x="0" y="10" width="140" height="70" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                      {Array.from({ length: 14 }).map((_, i) => (
                        <ellipse
                          key={i}
                          cx={10 + i * 9}
                          cy="45"
                          rx="6"
                          ry="33"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3.5"
                        />
                      ))}
                      <text x="70" y="-8" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">
                        CUỘN DÂY ĐỒNG (N = {inductionCalculations.N} VÒNG)
                      </text>
                      <path d="M 10 78 L 10 135 L -140 135 L -140 100" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                      <path d="M 130 78 L 130 145 L -110 145 L -110 100" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    </g>

                    {/* Permanent Magnet */}
                    {(() => {
                      const posX = 390 + magnetX * 2.2;
                      const isNLeft = magnetOrientation === "N_left";
                      return (
                        <g transform={`translate(${posX}, 175)`} className="transition-all duration-75">
                          <rect
                            x={isNLeft ? -90 : 0}
                            y="0"
                            width="90"
                            height="40"
                            rx="4"
                            fill="#ef4444"
                            stroke="#b91c1c"
                            strokeWidth="2"
                          />
                          <text x={isNLeft ? -45 : 45} y="25" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
                            {isNLeft ? "N" : "S"}
                          </text>

                          <rect
                            x={isNLeft ? 0 : -90}
                            y="0"
                            width="90"
                            height="40"
                            rx="4"
                            fill="#3b82f6"
                            stroke="#1d4ed8"
                            strokeWidth="2"
                          />
                          <text x={isNLeft ? 45 : -45} y="25" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
                            {isNLeft ? "S" : "N"}
                          </text>

                          <path
                            d="M -80 0 Q 0 -50 80 0"
                            fill="none"
                            stroke="rgba(239, 68, 68, 0.45)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <path
                            d="M -80 40 Q 0 90 80 40"
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.45)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <text x="0" y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9">
                            Nam châm ({magnetX > 0 ? `+${magnetX}` : magnetX} mm)
                          </text>
                        </g>
                      );
                    })()}

                    {/* Galvanometer */}
                    <g transform="translate(80, 80)">
                      <rect x="0" y="0" width="180" height="170" rx="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                      <rect x="10" y="10" width="160" height="100" rx="10" fill="#020617" stroke="#334155" strokeWidth="1.5" />

                      <path d="M 25 80 Q 90 30 155 80" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                      {[-50, -25, 0, 25, 50].map((val, idx) => {
                        const angle = (idx - 2) * 22.5;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 90 + Math.sin(rad) * 45;
                        const y1 = 80 - Math.cos(rad) * 45;
                        const x2 = 90 + Math.sin(rad) * 55;
                        const y2 = 80 - Math.cos(rad) * 55;
                        return (
                          <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={val === 0 ? "#22c55e" : "#94a3b8"} strokeWidth={val === 0 ? 2 : 1} />
                            <text x={90 + Math.sin(rad) * 65} y={80 - Math.cos(rad) * 65 + 3} textAnchor="middle" fill="#94a3b8" fontSize="8">
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      <circle cx="90" cy="80" r="5" fill="#f59e0b" />
                      <line
                        x1="90"
                        y1="80"
                        x2={90 + Math.sin((inductionCalculations.needleAngle * Math.PI) / 180) * 52}
                        y2={80 - Math.cos((inductionCalculations.needleAngle * Math.PI) / 180) * 52}
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      <text x="90" y="24" textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="bold">
                        GALVANOMETER (G)
                      </text>
                      <text x="90" y="96" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="monospace">
                        {inductionCalculations.inducedCurrentMa > 0 ? `+${inductionCalculations.inducedCurrentMa}` : inductionCalculations.inducedCurrentMa} mA
                      </text>

                      <g transform="translate(30, 120)">
                        <circle cx="25" cy="18" r="10" fill={inductionCalculations.isGreenLedLit ? "#22c55e" : "#14532d"} stroke="#22c55e" strokeWidth="1.5" />
                        <text x="25" y="38" textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold">LED XANH</text>

                        <circle cx="95" cy="18" r="10" fill={inductionCalculations.isRedLedLit ? "#ef4444" : "#7f1d1d"} stroke="#ef4444" strokeWidth="1.5" />
                        <text x="95" y="38" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">LED ĐỎ</text>
                      </g>
                    </g>

                    {/* Physics Law Card */}
                    <g transform="translate(500, 30)">
                      <rect x="0" y="0" width="220" height="120" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <text x="15" y="24" fill="#38bdf8" fontSize="11" fontWeight="bold">ĐỊNH LUẬT CẢM ỨNG FARADAY:</text>
                      <text x="15" y="44" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
                        e_cư = -N · (ΔΦ / Δt)
                      </text>
                      <line x1="15" y1="54" x2="205" y2="54" stroke="#1e293b" />
                      <text x="15" y="72" fill="#94a3b8" fontSize="10">Suất điện động cảm ứng:</text>
                      <text x="15" y="88" fill="#e2e8f0" fontSize="12" fontWeight="bold">e = {inductionCalculations.inducedVoltageMv} mV</text>
                      <text x="15" y="106" fill={inductionCalculations.needleAngle !== 0 ? "#22c55e" : "#94a3b8"} fontSize="10" fontWeight="bold">
                        {inductionCalculations.needleAngle > 0 ? "➔ Dòng cảm ứng chiều dương" : inductionCalculations.needleAngle < 0 ? "➔ Dòng cảm ứng chiều âm" : "Đứng yên: Không có dòng"}
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 18. MÔ PHỎNG: DAO ĐỘNG KÝ ÂM THANH & TẦN SỐ                */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "sound_oscilloscope_frequency" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    <rect x="40" y="20" width="680" height="370" rx="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    <rect x="40" y="20" width="680" height="38" rx="18" fill="#1e293b" />
                    <circle cx="65" cy="39" r="6" fill="#10b981" />
                    <text x="80" y="43" fill="#f8fafc" fontSize="12" fontWeight="bold">
                      DAO ĐỘNG KÝ ĐIỆN TỬ ẢO (DIGITAL OSCILLOSCOPE) - KHTN 7 KNTT
                    </text>

                    <rect x="60" y="70" width="460" height="300" rx="12" fill="#020617" stroke="#0ea5e9" strokeWidth="2" />

                    <defs>
                      <pattern id="oscGrid" width="46" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 46 0 L 0 0 0 30" fill="none" stroke="rgba(14, 165, 233, 0.18)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect x="60" y="70" width="460" height="300" fill="url(#oscGrid)" />

                    <line x1="60" y1="220" x2="520" y2="220" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <line x1="290" y1="70" x2="290" y2="370" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1.5" strokeDasharray="4 2" />

                    {(() => {
                      const centerY = 220;
                      const amp = (oscAmplitude / 100) * 110;
                      const cycles = Math.max(1, (oscFreqHz / 120));
                      const points: string[] = [];
                      for (let x = 0; x <= 460; x += 3) {
                        const phase = (x / 460) * cycles * 2 * Math.PI;
                        let y = centerY;
                        if (oscWaveform === "sine") {
                          y = centerY - Math.sin(phase) * amp;
                        } else if (oscWaveform === "triangle") {
                          y = centerY - ((2 / Math.PI) * Math.asin(Math.sin(phase))) * amp;
                        } else {
                          y = centerY - (Math.sin(phase) >= 0 ? amp : -amp);
                        }
                        points.push(`${60 + x},${y}`);
                      }
                      return (
                        <path
                          d={`M ${points.join(" L ")}`}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="3"
                          strokeLinecap="round"
                          filter="drop-shadow(0 0 6px #22c55e)"
                        />
                      );
                    })()}

                    <g transform="translate(75, 85)">
                      <rect x="0" y="0" width="150" height="50" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" />
                      <text x="10" y="18" fill="#38bdf8" fontSize="10">CH1: Tần số f</text>
                      <text x="10" y="38" fill="#22c55e" fontSize="16" fontWeight="bold" fontFamily="monospace">
                        {oscFreqHz} Hz
                      </text>
                    </g>

                    <g transform="translate(355, 85)">
                      <rect x="0" y="0" width="150" height="50" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" />
                      <text x="10" y="18" fill="#38bdf8" fontSize="10">Biên độ (Độ to)</text>
                      <text x="10" y="38" fill="#facc15" fontSize="16" fontWeight="bold" fontFamily="monospace">
                        ~{oscilloscopeCalculations.decibelEst} dB
                      </text>
                    </g>

                    <g transform="translate(535, 70)">
                      <rect x="0" y="0" width="170" height="300" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      <text x="15" y="24" fill="#94a3b8" fontSize="11" fontWeight="bold">BẢNG ĐO THÔNG SỐ</text>

                      <text x="15" y="52" fill="#94a3b8" fontSize="10">Chu kỳ T = 1/f:</text>
                      <text x="15" y="70" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">{oscilloscopeCalculations.periodMs} ms</text>

                      <text x="15" y="98" fill="#94a3b8" fontSize="10">Bước sóng λ trong kk:</text>
                      <text x="15" y="116" fill="#a78bfa" fontSize="13" fontWeight="bold" fontFamily="monospace">{oscilloscopeCalculations.wavelengthCm} cm</text>

                      <line x1="15" y1="130" x2="155" y2="130" stroke="#334155" />

                      <text x="15" y="152" fill="#94a3b8" fontSize="10">Độ cao (Cao độ):</text>
                      <text x="15" y="170" fill="#22c55e" fontSize="11" fontWeight="bold">{oscilloscopeCalculations.pitchCategory}</text>

                      <text x="15" y="196" fill="#94a3b8" fontSize="10">Độ to (Âm lượng):</text>
                      <text x="15" y="214" fill="#facc15" fontSize="11" fontWeight="bold">{oscilloscopeCalculations.loudnessCategory}</text>

                      <g transform="translate(20, 235)">
                        <rect x="0" y="0" width="130" height="45" rx="8" fill="#0f172a" stroke={isPlayingAudioTone ? "#22c55e" : "#475569"} strokeWidth="1.5" />
                        <text x="40" y="26" fill={isPlayingAudioTone ? "#22c55e" : "#94a3b8"} fontSize="10" fontWeight="bold">
                          {isPlayingAudioTone ? "LOA ĐANG PHÁT" : "LOA TẮT"}
                        </text>
                        <circle cx="20" cy="22" r="10" fill="#334155" />
                        <circle cx="20" cy="22" r="5" fill={isPlayingAudioTone ? "#22c55e" : "#64748b"} />
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 19. MÔ PHỎNG: SỰ NỞ VÌ NHIỆT CHẤT RẮN ('S GRAVESANDE)      */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "thermal_expansion_solids" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    <rect x="40" y="320" width="680" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="40" y1="320" x2="720" y2="320" stroke="#475569" strokeWidth="3" />

                    {/* Ring Apparatus Stand */}
                    <g transform="translate(260, 80)">
                      <rect x="-40" y="240" width="80" height="12" rx="3" fill="#64748b" />
                      <line x1="0" y1="50" x2="0" y2="240" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                      <line x1="0" y1="120" x2="100" y2="120" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                      <g transform="translate(100, 120)">
                        <ellipse cx="0" cy="0" rx="38" ry="14" fill="#475569" stroke="#94a3b8" strokeWidth="5" />
                        <ellipse cx="0" cy="0" rx="24" ry="9" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                        <text x="45" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold">VÒNG (D = 40.00 mm)</text>
                      </g>
                    </g>

                    {/* Metal Ball */}
                    {(() => {
                      const isBlocked = !thermalExpansionCalculations.canPass && isBallTestedPass;
                      const ballY = isBallTestedPass ? (isBlocked ? 175 : 260) : (isHeatingBall ? 250 : 130);
                      const ballColor = solidBallMetal === "aluminum" ? "#cbd5e1" : solidBallMetal === "copper" ? "#f97316" : "#94a3b8";
                      const heatGlow = isHeatingBall || solidBallTemp > 100;
                      return (
                        <g transform={`translate(360, ${ballY})`} className="transition-all duration-500">
                          <line x1="0" y1={-ballY + 60} x2="0" y2="-20" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
                          <circle cx="0" cy="-20" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" />

                          {heatGlow && (
                            <circle
                              cx="0"
                              cy="0"
                              r={24 + (solidBallTemp / 300) * 8}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="4"
                              opacity={(solidBallTemp - 50) / 250}
                              className="animate-pulse"
                            />
                          )}

                          <circle
                            cx="0"
                            cy="0"
                            r={18 + (thermalExpansionCalculations.currentDiameter - 39.8) * 3}
                            fill={heatGlow ? "#ea580c" : ballColor}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <ellipse cx="-5" cy="-6" rx="6" ry="3" fill="#ffffff" opacity="0.6" />

                          <text x="0" y="32" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                            D = {thermalExpansionCalculations.currentDiameter} mm
                          </text>
                        </g>
                      );
                    })()}

                    {/* Alcohol Burner Flame */}
                    {isHeatingBall && (
                      <g transform="translate(360, 280)">
                        <path d="M -25 40 L -25 25 Q -25 15 -10 15 L 10 15 Q 25 15 25 25 L 25 40 Z" fill="#38bdf8" opacity="0.5" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="-3" y="8" width="6" height="10" fill="#e2e8f0" />
                        <path d="M 0 8 Q -10 -15 0 -35 Q 10 -15 0 8 Z" fill="#f59e0b" className="animate-pulse" />
                        <path d="M 0 5 Q -5 -10 0 -22 Q 5 -10 0 5 Z" fill="#ef4444" />
                      </g>
                    )}

                    {/* Cold Water Basin */}
                    <g transform="translate(100, 230)">
                      <ellipse cx="40" cy="50" rx="45" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2" />
                      <path d="M -5 50 L -5 85 Q 40 100 85 85 L 85 50" fill="rgba(56, 189, 248, 0.3)" stroke="#38bdf8" strokeWidth="2" />
                      <text x="40" y="75" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">CHẬU NƯỚC LẠNH (20°C)</text>
                    </g>

                    {/* Results Card */}
                    <g transform="translate(470, 50)">
                      <rect x="0" y="0" width="250" height="250" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="250" height="36" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="18" r="6" fill="#f97316" />
                      <text x="35" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold">THÍ NGHIỆM 'S GRAVESANDE</text>

                      <g transform="translate(18, 52)">
                        <text x="0" y="14" fill="#94a3b8" fontSize="10">Kim loại quả cầu:</text>
                        <text x="0" y="30" fill="#f97316" fontSize="11" fontWeight="bold">{thermalExpansionCalculations.metalLabel}</text>

                        <line x1="0" y1="40" x2="214" y2="40" stroke="#334155" />

                        <text x="0" y="58" fill="#94a3b8" fontSize="10">Nhiệt độ hiện tại T:</text>
                        <text x="140" y="58" fill="#facc15" fontSize="14" fontWeight="bold" fontFamily="monospace">
                          {solidBallTemp}°C
                        </text>

                        <text x="0" y="82" fill="#94a3b8" fontSize="10">Độ nở dài ΔD:</text>
                        <text x="140" y="82" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                          +{(thermalExpansionCalculations.currentDiameter - 39.80).toFixed(2)} mm
                        </text>

                        <text x="0" y="106" fill="#94a3b8" fontSize="10">Đường kính cầu (D):</text>
                        <text x="140" y="106" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {thermalExpansionCalculations.currentDiameter} mm
                        </text>

                        <text x="0" y="128" fill="#94a3b8" fontSize="10">Đường kính lỗ vòng (D₀):</text>
                        <text x="140" y="128" fill="#94a3b8" fontSize="12" fontFamily="monospace">40.00 mm</text>

                        <line x1="0" y1="140" x2="214" y2="140" stroke="#334155" />

                        <text x="0" y="160" fill="#cbd5e1" fontSize="10" fontWeight="bold">Khả năng lọt qua vòng:</text>
                        <text
                          x="0"
                          y="180"
                          fill={thermalExpansionCalculations.canPass ? "#22c55e" : "#ef4444"}
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {thermalExpansionCalculations.canPass ? "✓ LỌT QUA VÒNG DỄ DÀNG" : "⛔ BỊ KẸT LẠI TRÊN MIỆNG VÒNG"}
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 20. MÔ PHỎNG: ĐỘ DÃN CỦA LÒ XO & ĐỊNH LUẬT HÚC (KHTN 6)    */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "spring_hooke_elasticity" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    {/* Workbench base */}
                    <rect x="40" y="340" width="680" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="40" y1="340" x2="720" y2="340" stroke="#475569" strokeWidth="3" />

                    {/* Laboratory Stand */}
                    <g transform="translate(100, 30)">
                      <rect x="0" y="300" width="130" height="14" rx="4" fill="#475569" stroke="#64748b" strokeWidth="2" />
                      <line x1="30" y1="20" x2="30" y2="300" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
                      {/* Clamp and horizontal arm */}
                      <rect x="22" y="35" width="16" height="24" rx="3" fill="#334155" stroke="#64748b" />
                      <line x1="30" y1="47" x2="160" y2="47" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                      <circle cx="150" cy="47" r="4" fill="#38bdf8" />
                      {/* Suspension Hook */}
                      <path d="M 150 47 L 150 62 Q 150 70 144 70 Q 138 70 138 64" fill="none" stroke="#94a3b8" strokeWidth="3" />
                    </g>

                    {/* Millimeter/Centimeter Ruler alongside */}
                    <g transform="translate(195, 92)">
                      <rect x="0" y="0" width="42" height="245" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="21" y="-8" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">THƯỚC (cm)</text>
                      {Array.from({ length: 25 }, (_, i) => {
                        const y = i * 9.6;
                        const isMajor = i % 5 === 0;
                        return (
                          <g key={i}>
                            <line
                              x1="0"
                              y1={y}
                              x2={isMajor ? 18 : i % 1 === 0 ? 10 : 6}
                              y2={y}
                              stroke="#334155"
                              strokeWidth={isMajor ? 1.5 : 0.8}
                            />
                            {isMajor && (
                              <text x="24" y={y + 3.5} fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                {i}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>

                    {/* Dynamic Spring with Hooke physics */}
                    {(() => {
                      const startX = 250;
                      const startY = 92;
                      const naturalH = 68; // corresponds to 12cm
                      const dynamicH = naturalH + springCalculations.elongationCm * 5.6 + springBounceOffset;
                      const coils = 12;
                      const coilH = dynamicH / coils;
                      const endY = startY + dynamicH;

                      let pathD = `M ${startX} ${startY} L ${startX} ${startY + 6}`;
                      for (let i = 0; i < coils; i++) {
                        const cy = startY + 6 + i * coilH;
                        pathD += ` L ${startX + 14} ${cy + coilH * 0.25} L ${startX - 14} ${cy + coilH * 0.75}`;
                      }
                      pathD += ` L ${startX} ${endY} L ${startX} ${endY + 12}`;

                      const hookBottomY = endY + 12;
                      const pointerY = hookBottomY;

                      return (
                        <g>
                          {/* Spring coil path */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-md"
                          />

                          {/* Red Pointer to Ruler */}
                          <g transform={`translate(${startX}, ${pointerY})`}>
                            <line x1="-12" y1="0" x2="-45" y2="0" stroke="#ef4444" strokeWidth="2.5" />
                            <polygon points="-45,0 -39,-3 -39,3" fill="#ef4444" />
                            <circle cx="0" cy="0" r="3" fill="#ef4444" />
                            <text x="-52" y="3.5" textAnchor="end" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              l = {springCalculations.totalLengthCm} cm
                            </text>
                          </g>

                          {/* Hook & Stacked Slotted Weights */}
                          <g transform={`translate(${startX}, ${hookBottomY})`}>
                            {/* Metal bottom hook */}
                            <path d="M 0 0 L 0 10 Q 0 18 -6 18 Q -12 18 -12 12" fill="none" stroke="#94a3b8" strokeWidth="3" />
                            <line x1="-12" y1="12" x2="-12" y2="70" stroke="#cbd5e1" strokeWidth="2.5" />
                            <rect x="-24" y="68" width="24" height="6" rx="2" fill="#64748b" />

                            {/* Stacked brass slotted weights (50g each) */}
                            {Array.from({ length: springCalculations.weightsCount }).map((_, idx) => {
                              const weightY = 56 - idx * 12;
                              return (
                                <g key={idx} transform={`translate(-20, ${weightY})`}>
                                  <rect
                                    x="0"
                                    y="0"
                                    width="40"
                                    height="11"
                                    rx="2.5"
                                    fill="url(#brassGrad)"
                                    stroke="#b45309"
                                    strokeWidth="1"
                                    className="drop-shadow-sm"
                                  />
                                  <line x1="8" y1="0" x2="8" y2="11" stroke="#78350f" strokeWidth="1" />
                                  <text x="24" y="8.5" fill="#451a03" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                    50g
                                  </text>
                                </g>
                              );
                            })}

                            {/* Force Vectors */}
                            {springCalculations.forceN > 0 && (
                              <g transform="translate(0, 75)">
                                {/* Gravity Vector (P = m.g) pointing downwards */}
                                <line x1="0" y1="0" x2="0" y2="40" stroke="#ef4444" strokeWidth="2.5" />
                                <polygon points="0,45 -4,36 4,36" fill="#ef4444" />
                                <text x="10" y="28" fill="#ef4444" fontSize="10" fontWeight="bold">
                                  P = {springCalculations.forceN} N
                                </text>

                                {/* Elastic Force Vector (F_dh) pointing upwards */}
                                <line x1="0" y1="-80" x2="0" y2="-120" stroke="#06b6d4" strokeWidth="2.5" />
                                <polygon points="0,-125 -4,-116 4,-116" fill="#06b6d4" />
                                <text x="10" y="-105" fill="#06b6d4" fontSize="10" fontWeight="bold">
                                  F_đh = {springCalculations.forceN} N
                                </text>
                              </g>
                            )}
                          </g>
                        </g>
                      );
                    })()}

                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>

                    {/* Analysis Card */}
                    <g transform="translate(450, 45)">
                      <rect x="0" y="0" width="280" height="280" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="280" height="36" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="18" r="6" fill="#38bdf8" />
                      <text x="35" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold">ĐỊNH LUẬT HÚC (HOOKE'S LAW)</text>

                      <g transform="translate(18, 52)">
                        <text x="0" y="14" fill="#94a3b8" fontSize="10">Độ cứng lò xo (k):</text>
                        <text x="160" y="14" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                          {springK} N/m
                        </text>

                        <text x="0" y="38" fill="#94a3b8" fontSize="10">Chiều dài tự nhiên (l₀):</text>
                        <text x="160" y="38" fill="#f8fafc" fontSize="12" fontFamily="monospace">12.0 cm</text>

                        <text x="0" y="62" fill="#94a3b8" fontSize="10">Tổng khối lượng treo (m):</text>
                        <text x="160" y="62" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {hangingMassG} g ({springCalculations.weightsCount} quả)
                        </text>

                        <text x="0" y="86" fill="#94a3b8" fontSize="10">Lực đàn hồi (F_đh = P):</text>
                        <text x="160" y="86" fill="#ef4444" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {springCalculations.forceN} N
                        </text>

                        <line x1="0" y1="98" x2="244" y2="98" stroke="#334155" />

                        <text x="0" y="118" fill="#94a3b8" fontSize="10">Chiều dài khi dãn (l):</text>
                        <text x="160" y="118" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {springCalculations.totalLengthCm} cm
                        </text>

                        <text x="0" y="142" fill="#94a3b8" fontSize="10">Độ biến dạng (Δl = l - l₀):</text>
                        <text x="160" y="142" fill="#4ade80" fontSize="14" fontWeight="bold" fontFamily="monospace">
                          +{springCalculations.elongationCm} cm
                        </text>

                        <text x="0" y="166" fill="#94a3b8" fontSize="10">Tỉ số thực nghiệm (F/Δl):</text>
                        <text x="160" y="166" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {springCalculations.kRatio} N/m
                        </text>

                        <line x1="0" y1="178" x2="244" y2="178" stroke="#334155" />

                        <text x="0" y="196" fill="#cbd5e1" fontSize="10" fontWeight="bold">Kết luận thực nghiệm:</text>
                        <text x="0" y="214" fill="#22c55e" fontSize="11" fontWeight="bold">
                          F_đh tỉ lệ thuận với độ dãn Δl (F = k · Δl)
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 21. MÔ PHỎNG: TÍNH HƯỚNG SÁNG Ở NGỌN CÂY MẦM (KHTN 7)      */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "plant_phototropism" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    {/* Dark Box Enclosure interior */}
                    <rect x="40" y="30" width="400" height="350" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="2" />
                    <rect x="40" y="330" width="400" height="50" fill="#1e293b" />
                    <line x1="40" y1="330" x2="440" y2="330" stroke="#475569" strokeWidth="2" />
                    <text x="55" y="55" fill="#64748b" fontSize="10" fontWeight="bold">HỘP THÍ NGHIỆM KÍN (KHTN 7)</text>

                    {/* Light Source / LED Lamp */}
                    {lightDirection !== "dark" && (
                      <g>
                        {lightDirection === "left" && (
                          <g transform="translate(60, 160)">
                            {/* Lamp Body */}
                            <rect x="0" y="-15" width="25" height="30" rx="4" fill="#38bdf8" />
                            <polygon points="25,-25 45,-35 45,35 25,25" fill="#facc15" opacity="0.8" />
                            {/* Glowing light cone pointing right towards plant */}
                            <polygon points="45,-30 200,30 200,120 45,30" fill="url(#lampConeLeft)" opacity="0.45" />
                            <circle cx="12" cy="0" r="5" fill="#ffffff" />
                            <text x="0" y="32" fill="#facc15" fontSize="9" fontWeight="bold">Nguồn sáng Trái</text>
                          </g>
                        )}

                        {lightDirection === "right" && (
                          <g transform="translate(380, 160)">
                            {/* Lamp Body */}
                            <rect x="-25" y="-15" width="25" height="30" rx="4" fill="#38bdf8" />
                            <polygon points="-25,-25 -45,-35 -45,35 -25,25" fill="#facc15" opacity="0.8" />
                            {/* Glowing light cone pointing left towards plant */}
                            <polygon points="-45,-30 -200,30 -200,120 -45,30" fill="url(#lampConeRight)" opacity="0.45" />
                            <circle cx="-12" cy="0" r="5" fill="#ffffff" />
                            <text x="-40" y="32" fill="#facc15" fontSize="9" fontWeight="bold">Nguồn sáng Phải</text>
                          </g>
                        )}

                        {lightDirection === "top" && (
                          <g transform="translate(240, 45)">
                            <rect x="-15" y="0" width="30" height="20" rx="4" fill="#38bdf8" />
                            <polygon points="-25,20 -35,35 35,35 25,20" fill="#facc15" opacity="0.8" />
                            <polygon points="-30,35 -80,240 80,240 30,35" fill="url(#lampConeTop)" opacity="0.45" />
                            <circle cx="0" cy="10" r="5" fill="#ffffff" />
                            <text x="0" y="-5" textAnchor="middle" fill="#facc15" fontSize="9" fontWeight="bold">Nguồn sáng Đỉnh</text>
                          </g>
                        )}
                      </g>
                    )}

                    {lightDirection === "dark" && (
                      <g transform="translate(190, 80)">
                        <rect x="-40" y="0" width="180" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <text x="50" y="20" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                          🌑 NẮP CHE TỐI HOÀN TOÀN
                        </text>
                      </g>
                    )}

                    {/* Pot and Soil */}
                    <g transform="translate(240, 260)">
                      {/* Terracotta Pot */}
                      <polygon points="-40,0 40,0 30,70 -30,70" fill="#c2410c" stroke="#9a3412" strokeWidth="2" />
                      <ellipse cx="0" cy="0" rx="42" ry="10" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
                      <ellipse cx="0" cy="2" rx="38" ry="8" fill="#451a03" />
                      <text x="0" y="45" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="bold">Cây đậu xanh</text>
                    </g>

                    {/* Dynamic Bending Seedling Stem */}
                    {(() => {
                      const baseX = 240;
                      const baseY = 260;
                      const bendAngle = phototropismCalculations.bendAngle; // -36 to +36
                      const bendRad = (bendAngle * Math.PI) / 180;
                      const stemLen = lightDirection === "dark" ? 140 : 110;

                      // Control points for bezier curve
                      const midX = baseX + Math.sin(bendRad * 0.5) * (stemLen * 0.5);
                      const midY = baseY - Math.cos(bendRad * 0.5) * (stemLen * 0.5);
                      const tipX = baseX + Math.sin(bendRad) * stemLen;
                      const tipY = baseY - Math.cos(bendRad) * stemLen;

                      return (
                        <g>
                          {/* Stem curve */}
                          <path
                            d={`M ${baseX} ${baseY} Q ${midX} ${midY} ${tipX} ${tipY}`}
                            fill="none"
                            stroke={phototropismCalculations.stemColor}
                            strokeWidth={lightDirection === "dark" ? "6" : "9"}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />

                          {/* Cotyledon Leaves at tip */}
                          <g transform={`translate(${tipX}, ${tipY}) rotate(${bendAngle})`}>
                            {/* Left Leaf */}
                            <ellipse
                              cx="-12"
                              cy="-8"
                              rx="14"
                              ry="7"
                              transform="rotate(-25 -12 -8)"
                              fill={lightDirection === "dark" ? "#fef08a" : "#22c55e"}
                              stroke="#15803d"
                              strokeWidth="1.5"
                            />
                            {/* Right Leaf */}
                            <ellipse
                              cx="12"
                              cy="-8"
                              rx="14"
                              ry="7"
                              transform="rotate(25 12 -8)"
                              fill={lightDirection === "dark" ? "#fef08a" : "#22c55e"}
                              stroke="#15803d"
                              strokeWidth="1.5"
                            />
                            {/* Apical Bud */}
                            <circle cx="0" cy="-4" r="4" fill="#86efac" />
                          </g>

                          {/* Auxin Hormone Particles Visualization */}
                          {showAuxinHeatmap && lightDirection !== "dark" && lightDirection !== "top" && (
                            <g>
                              {Array.from({ length: 14 }).map((_, i) => {
                                const t = 0.2 + (i / 14) * 0.75;
                                const px = baseX + Math.sin(bendRad * t) * (stemLen * t);
                                const py = baseY - Math.cos(bendRad * t) * (stemLen * t);
                                // Shift particles to shaded side
                                const shiftSide = lightDirection === "left" ? 8 : -8;
                                return (
                                  <circle
                                    key={i}
                                    cx={px + shiftSide + (i % 2 === 0 ? 3 : -3)}
                                    cy={py + (i % 3 - 1) * 2}
                                    r="3"
                                    fill="#f59e0b"
                                    className="animate-pulse"
                                  />
                                );
                              })}
                            </g>
                          )}
                        </g>
                      );
                    })()}

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="lampConeLeft" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lampConeRight" x1="100%" y1="50%" x2="0%" y2="50%">
                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lampConeTop" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Mechanism & Microscope Analysis Card on Right */}
                    <g transform="translate(460, 35)">
                      <rect x="0" y="0" width="270" height="340" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="270" height="36" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="18" r="6" fill="#22c55e" />
                      <text x="35" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold">CƠ CHẾ AUXIN & HƯỚNG SÁNG</text>

                      {/* Microscope Cell Diagram Box */}
                      <g transform="translate(16, 50)">
                        <rect x="0" y="0" width="238" height="95" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <text x="12" y="16" fill="#38bdf8" fontSize="9" fontWeight="bold">KÍNH HIỂN VI: TẾ BÀO BIỂU BÌ THÂN</text>

                        {/* Light side vs Dark side cells */}
                        <g transform="translate(12, 28)">
                          {/* Light side cells (Shorter) */}
                          <text x="0" y="10" fill="#94a3b8" fontSize="8.5">Phía sáng ({phototropismCalculations.lightAuxinPercent}% Auxin):</text>
                          <rect x="0" y="15" width="26" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                          <rect x="29" y="15" width="26" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                          <rect x="58" y="15" width="26" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                          <text x="90" y="24" fill="#94a3b8" fontSize="8">Dãn dài chậm</text>

                          {/* Dark side cells (Elongated) */}
                          <text x="0" y="42" fill="#facc15" fontSize="8.5">Phía tối ({phototropismCalculations.darkAuxinPercent}% Auxin):</text>
                          <rect x="0" y="46" width="46" height="12" rx="2" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
                          <rect x="49" y="46" width="46" height="12" rx="2" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
                          <text x="100" y="55" fill="#facc15" fontSize="8" fontWeight="bold">Dãn dài nhanh!</text>
                        </g>
                      </g>

                      {/* Live Metrics list */}
                      <g transform="translate(18, 160)">
                        <text x="0" y="14" fill="#94a3b8" fontSize="10">Thời gian chiếu sáng:</text>
                        <text x="150" y="14" fill="#facc15" fontSize="12" fontWeight="bold" fontFamily="monospace">
                          {phototropismHours} giờ ({Math.round(phototropismHours / 24)} ngày)
                        </text>

                        <text x="0" y="38" fill="#94a3b8" fontSize="10">Góc uốn cong ngọn (θ):</text>
                        <text x="150" y="38" fill="#4ade80" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {Math.abs(Math.round(phototropismCalculations.bendAngle))}°
                        </text>

                        <line x1="0" y1="50" x2="234" y2="50" stroke="#334155" />

                        <text x="0" y="70" fill="#cbd5e1" fontSize="10" fontWeight="bold">Kết luận (SGK KHTN 7):</text>
                        <text x="0" y="88" fill="#38bdf8" fontSize="10" fontWeight="bold">
                          {phototropismCalculations.title}
                        </text>
                        <text x="0" y="106" fill="#94a3b8" fontSize="9" className="max-w-[230px]">
                          {phototropismCalculations.desc}
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 22. MÔ PHỎNG: PHẢN ỨNG TỎA NHIỆT & THU NHIỆT (KHTN 8)      */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "exothermic_endothermic_reaction" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    {/* Workbench table */}
                    <rect x="40" y="320" width="680" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="40" y1="320" x2="720" y2="320" stroke="#475569" strokeWidth="3" />

                    {/* Wooden Block under beaker (Thí nghiệm đóng băng đáy cốc Ba(OH)2) */}
                    <g transform="translate(170, 305)">
                      <rect x="0" y="0" width="180" height="15" rx="3" fill="#854d0e" stroke="#713f12" strokeWidth="1.5" />
                      <line x1="0" y1="5" x2="180" y2="5" stroke="#a16207" strokeWidth="1" strokeDasharray="15 8" />
                      <text x="90" y="11" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">
                        TẤM GỖ CÓ NHỎ GIỌT NƯỚC ƯỚT
                      </text>

                      {/* Ice frost glue effect if barium frozen */}
                      {thermalReactionType === "endothermic_barium" && thermalReactionTemp <= 0 && (
                        <g transform="translate(60, -8)">
                          <rect x="0" y="0" width="60" height="8" rx="2" fill="#e0f2fe" opacity="0.9" stroke="#38bdf8" />
                          <text x="30" y="6" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="bold">
                            ĐÓNG BĂNG ❄️
                          </text>
                        </g>
                      )}
                    </g>

                    {/* Calorimeter Double-walled Glass Beaker */}
                    <g transform="translate(200, 140)">
                      {/* Outer insulated jacket */}
                      <rect x="-8" y="20" width="136" height="145" rx="10" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />

                      {/* Glass beaker body */}
                      <path
                        d="M 0 20 L 0 160 Q 0 165 5 165 L 115 165 Q 120 165 120 160 L 120 20"
                        fill="rgba(255, 255, 255, 0.04)"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                      />
                      {/* Spout */}
                      <polygon points="0,20 -6,16 0,16" fill="#94a3b8" />

                      {/* Reaction Solution Liquid */}
                      {(() => {
                        let liquidColor = "rgba(56, 189, 248, 0.35)"; // default
                        if (thermalReactionType === "exothermic_cao") liquidColor = "rgba(241, 245, 249, 0.75)"; // milky white
                        else if (thermalReactionType === "exothermic_acid_base") liquidColor = "rgba(236, 72, 153, 0.35)"; // faint pink
                        else if (thermalReactionType === "endothermic_nh4cl") liquidColor = "rgba(147, 197, 253, 0.4)";
                        else if (thermalReactionType === "endothermic_barium") liquidColor = "rgba(224, 242, 254, 0.6)";

                        return (
                          <g>
                            <path
                              d="M 3 80 L 3 160 Q 3 163 6 163 L 114 163 Q 117 163 117 160 L 117 80 Z"
                              fill={liquidColor}
                            />
                            {/* Meniscus */}
                            <ellipse cx="60" cy="80" rx="57" ry="7" fill={liquidColor} stroke="#cbd5e1" strokeWidth="1" />

                            {/* Frost crystals on outside if cold */}
                            {!thermalCalculations.isExo && thermalReactionTemp < 15 && (
                              <g>
                                <path d="M 5 70 L 15 65 L 5 60 M 115 85 L 105 80 L 115 75" stroke="#bae6fd" strokeWidth="2" />
                                <text x="60" y="130" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                                  ❄️ LẠNH BUỐT
                                </text>
                              </g>
                            )}

                            {/* Steam Vapor if hot exothermic */}
                            {thermalCalculations.isExo && isThermalReacting && thermalReactionTemp > 45 && (
                              <g transform="translate(40, -10)">
                                <path
                                  d="M 0 20 Q -10 5 0 -15 Q 10 -35 0 -50"
                                  fill="none"
                                  stroke="#f1f5f9"
                                  strokeWidth="3.5"
                                  opacity="0.6"
                                  className="animate-pulse"
                                />
                                <path
                                  d="M 25 15 Q 15 0 25 -20 Q 35 -40 25 -55"
                                  fill="none"
                                  stroke="#f1f5f9"
                                  strokeWidth="3.5"
                                  opacity="0.6"
                                  className="animate-pulse"
                                />
                                <text x="15" y="-60" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
                                  HƠI NƯỚC SÔI ♨️
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}

                      {/* Solid reagent sediment at bottom */}
                      <ellipse cx="60" cy="158" rx="45" ry="5" fill="#f8fafc" opacity="0.8" />
                    </g>

                    {/* Precision Digital Thermometer with Probe */}
                    <g transform="translate(290, 70)">
                      {/* Metal immersion probe rod */}
                      <rect x="0" y="45" width="6" height="155" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                      <circle cx="3" cy="198" r="4" fill="#38bdf8" />

                      {/* Digital Reader Head */}
                      <rect x="-35" y="0" width="76" height="46" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                      <rect x="-28" y="7" width="62" height="30" rx="4" fill="#020617" />
                      <text
                        x="3"
                        y="28"
                        textAnchor="middle"
                        fill={thermalReactionTemp > 35 ? "#ef4444" : thermalReactionTemp < 15 ? "#38bdf8" : "#22c55e"}
                        fontSize="14"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {thermalReactionTemp}°C
                      </text>
                      <text x="3" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                        NHIỆT KẾ ĐIỆN TỬ
                      </text>
                    </g>

                    {/* Thermodynamics & Enthalpy Diagram Card */}
                    <g transform="translate(450, 45)">
                      <rect x="0" y="0" width="280" height="280" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="280" height="36" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="18" r="6" fill={thermalCalculations.isExo ? "#ef4444" : "#0284c7"} />
                      <text x="35" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold">NHIỆT PHẢN ỨNG (KHTN 8 BÀI 8)</text>

                      <g transform="translate(18, 50)">
                        <text x="0" y="14" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                          {thermalCalculations.name}
                        </text>

                        <rect
                          x="0"
                          y="24"
                          width="244"
                          height="24"
                          rx="6"
                          fill={thermalCalculations.isExo ? "rgba(239, 68, 68, 0.15)" : "rgba(14, 165, 233, 0.15)"}
                          stroke={thermalCalculations.isExo ? "#ef4444" : "#0284c7"}
                          strokeWidth="1"
                        />
                        <text
                          x="122"
                          y="40"
                          textAnchor="middle"
                          fill={thermalCalculations.isExo ? "#ef4444" : "#38bdf8"}
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {thermalCalculations.type} | {thermalCalculations.deltaH}
                        </text>

                        {/* Energy Level Diagram */}
                        <g transform="translate(0, 60)">
                          <rect x="0" y="0" width="244" height="65" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                          <text x="10" y="14" fill="#94a3b8" fontSize="8.5">Năng lượng E</text>
                          {thermalCalculations.isExo ? (
                            <g>
                              {/* Reactants high, Products low */}
                              <line x1="25" y1="26" x2="85" y2="26" stroke="#facc15" strokeWidth="2.5" />
                              <text x="55" y="22" textAnchor="middle" fill="#facc15" fontSize="8">Chất đầu</text>
                              <line x1="150" y1="48" x2="210" y2="48" stroke="#4ade80" strokeWidth="2.5" />
                              <text x="180" y="44" textAnchor="middle" fill="#4ade80" fontSize="8">Sản phẩm</text>
                              {/* Downward arrow ΔH < 0 */}
                              <line x1="118" y1="26" x2="118" y2="46" stroke="#ef4444" strokeWidth="2" />
                              <polygon points="118,50 115,44 121,44" fill="#ef4444" />
                              <text x="125" y="38" fill="#ef4444" fontSize="8" fontWeight="bold">Tỏa nhiệt</text>
                            </g>
                          ) : (
                            <g>
                              {/* Reactants low, Products high */}
                              <line x1="25" y1="48" x2="85" y2="48" stroke="#facc15" strokeWidth="2.5" />
                              <text x="55" y="44" textAnchor="middle" fill="#facc15" fontSize="8">Chất đầu</text>
                              <line x1="150" y1="26" x2="210" y2="26" stroke="#4ade80" strokeWidth="2.5" />
                              <text x="180" y="22" textAnchor="middle" fill="#4ade80" fontSize="8">Sản phẩm</text>
                              {/* Upward arrow ΔH > 0 */}
                              <line x1="118" y1="48" x2="118" y2="28" stroke="#0284c7" strokeWidth="2" />
                              <polygon points="118,24 115,30 121,30" fill="#0284c7" />
                              <text x="125" y="38" fill="#38bdf8" fontSize="8" fontWeight="bold">Thu nhiệt</text>
                            </g>
                          )}
                        </g>

                        {/* Live Measurement Readings */}
                        <g transform="translate(0, 138)">
                          <text x="0" y="14" fill="#94a3b8" fontSize="10">Nhiệt độ dung dịch (T):</text>
                          <text
                            x="160"
                            y="14"
                            fill={thermalReactionTemp > 30 ? "#ef4444" : thermalReactionTemp < 20 ? "#38bdf8" : "#22c55e"}
                            fontSize="14"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {thermalReactionTemp} °C
                          </text>

                          <text x="0" y="36" fill="#94a3b8" fontSize="10">Độ biến thiên nhiệt độ (ΔT):</text>
                          <text
                            x="160"
                            y="36"
                            fill={thermalReactionTemp >= 25 ? "#ef4444" : "#38bdf8"}
                            fontSize="13"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {thermalReactionTemp >= 25 ? `+${thermalReactionTemp - 25}` : `${thermalReactionTemp - 25}`} °C
                          </text>

                          <line x1="0" y1="48" x2="244" y2="48" stroke="#334155" />

                          <text x="0" y="66" fill="#cbd5e1" fontSize="10" fontWeight="bold">Hiện tượng quan sát được:</text>
                          <text x="0" y="82" fill="#facc15" fontSize="9.5" className="max-w-[240px]">
                            {thermalCalculations.phenomenon}
                          </text>
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 23. MÔ PHỎNG: ĐIỆN PHÂN DUNG DỊCH CuCl2 (KHTN 9 BÀI 19)     */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedExpId === "electrolysis_copper_chloride" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 760 420" className="w-full h-full max-h-[400px]">
                    {/* Workbench table */}
                    <rect x="40" y="330" width="680" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <line x1="40" y1="330" x2="720" y2="330" stroke="#475569" strokeWidth="3" />

                    {/* DC Power Supply Unit */}
                    <g transform="translate(60, 60)">
                      <rect x="0" y="0" width="130" height="95" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                      <rect x="8" y="8" width="114" height="24" rx="4" fill="#020617" />
                      <text x="65" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        {isElectrolysisSwitchClosed ? `${electrolysisVoltage}.0 V | ${electrolysisCalculations.currentMa} mA` : "OFF (0.0 V)"}
                      </text>

                      {/* Power Terminals */}
                      {/* Positive (+) Terminal Red */}
                      <circle cx="35" cy="55" r="9" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
                      <text x="35" y="58" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">+</text>
                      <text x="35" y="78" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold">Anot (+)</text>

                      {/* Negative (-) Terminal Blue */}
                      <circle cx="95" cy="55" r="9" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
                      <text x="95" y="58" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">-</text>
                      <text x="95" y="78" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="bold">Catot (-)</text>
                    </g>

                    {/* Connecting Wires */}
                    {/* Red Wire: Positive terminal to Anode on Right */}
                    <path
                      d="M 95 115 C 95 140, 345 130, 345 180"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                    />
                    {/* Blue Wire: Negative terminal to Cathode on Left */}
                    <path
                      d="M 155 115 C 155 150, 245 140, 245 180"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />

                    {/* Glass Electrolytic Cell Tank */}
                    <g transform="translate(190, 160)">
                      {/* Glass Tank */}
                      <rect x="0" y="30" width="210" height="145" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="#94a3b8" strokeWidth="2.5" />

                      {/* Blue-Green CuCl2 Solution */}
                      <rect x="3" y="60" width="204" height="112" rx="6" fill="#0284c7" opacity="0.35" />
                      <ellipse cx="105" cy="60" rx="102" ry="8" fill="#0284c7" opacity="0.5" stroke="#38bdf8" strokeWidth="1" />
                      <text x="105" y="160" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="bold">
                        Dung dịch CuCl₂ ({electrolysisCuCl2Concentration} M)
                      </text>

                      {/* CATHODE (-) ON LEFT: Graphite Rod with Red Copper Deposition */}
                      <g transform="translate(55, 20)">
                        {/* Carbon electrode rod */}
                        <rect x="-8" y="0" width="16" height="130" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <text x="0" y="-8" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold">Catot (-)</text>

                        {/* Deposited Red Copper Metallic Layer */}
                        {electrolysisCalculations.copperMassMg > 0 && (
                          <g>
                            <rect
                              x={-8 - Math.min(6, electrolysisCalculations.cathodeDepositThick)}
                              y="50"
                              width={16 + Math.min(12, electrolysisCalculations.cathodeDepositThick * 2)}
                              height="75"
                              rx="3"
                              fill="#ea580c"
                              stroke="#c2410c"
                              strokeWidth="1"
                            />
                            <text x="-16" y="85" textAnchor="end" fill="#f97316" fontSize="8" fontWeight="bold">
                              Lớp Cu đỏ bám
                            </text>
                          </g>
                        )}
                      </g>

                      {/* ANODE (+) ON RIGHT: Graphite Rod with Chlorine gas bubbles & test tube */}
                      <g transform="translate(155, 20)">
                        {/* Carbon electrode rod */}
                        <rect x="-8" y="0" width="16" height="130" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <text x="0" y="-8" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">Anot (+)</text>

                        {/* Inverted test tube collecting Cl2 gas */}
                        <rect x="-16" y="-30" width="32" height="90" rx="6" fill="rgba(254, 240, 138, 0.25)" stroke="#facc15" strokeWidth="1.5" />
                        <ellipse cx="0" cy="60" rx="16" ry="4" fill="none" stroke="#facc15" />

                        {/* Cl2 Gas Bubbles rising */}
                        {isElectrolysisSwitchClosed && electrolysisCalculations.isActive && (
                          <g>
                            <circle cx="-4" cy="90" r="3" fill="#facc15" className="animate-bounce" />
                            <circle cx="3" cy="70" r="3.5" fill="#facc15" className="animate-bounce" />
                            <circle cx="-2" cy="45" r="4" fill="#facc15" className="animate-bounce" />
                            <circle cx="4" cy="20" r="4.5" fill="#facc15" className="animate-bounce" />
                            <text x="24" y="15" fill="#facc15" fontSize="8" fontWeight="bold">
                              Khí Cl₂ ↑
                            </text>
                          </g>
                        )}

                        {/* Damp blue litmus paper strip held at mouth of test tube */}
                        <g transform="translate(-35, -25)">
                          {/* Paper strip: half bleached white, half blue */}
                          <rect x="0" y="0" width="8" height="24" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" />
                          {isElectrolysisSwitchClosed && electrolysisSeconds > 10 && (
                            <rect x="0" y="8" width="8" height="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                          )}
                          <text x="-4" y="15" textAnchor="end" fill="#f8fafc" fontSize="7.5" fontWeight="bold">
                            Quỳ tím mất màu
                          </text>
                        </g>
                      </g>
                    </g>

                    {/* Faraday & Chemistry Analysis Card on Right */}
                    <g transform="translate(450, 45)">
                      <rect x="0" y="0" width="280" height="280" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <rect x="0" y="0" width="280" height="36" rx="14" fill="#1e293b" />
                      <circle cx="20" cy="18" r="6" fill="#06b6d4" />
                      <text x="35" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold">ĐIỆN PHÂN DUNG DỊCH CuCl₂</text>

                      <g transform="translate(18, 50)">
                        <text x="0" y="14" fill="#cbd5e1" fontSize="10" fontWeight="bold">Phương trình hóa học điện phân:</text>
                        <text x="0" y="32" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          CuCl₂ → Cu (Catot) + Cl₂ (Anot)
                        </text>

                        <line x1="0" y1="44" x2="244" y2="44" stroke="#334155" />

                        <text x="0" y="62" fill="#94a3b8" fontSize="10">Thời gian điện phân (t):</text>
                        <text x="160" y="62" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {electrolysisSeconds} giây
                        </text>

                        <text x="0" y="86" fill="#94a3b8" fontSize="10">Cường độ dòng điện (I):</text>
                        <text x="160" y="86" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {electrolysisCalculations.currentMa} mA
                        </text>

                        <text x="0" y="110" fill="#94a3b8" fontSize="10">Đồng bám Catot (m_Cu):</text>
                        <text x="160" y="110" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {electrolysisCalculations.copperMassMg} mg
                        </text>

                        <text x="0" y="134" fill="#94a3b8" fontSize="10">Khí Clo thoát ra Anot:</text>
                        <text x="160" y="134" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
                          {electrolysisCalculations.gasVolumeMl} ml
                        </text>

                        <line x1="0" y1="146" x2="244" y2="146" stroke="#334155" />

                        <text x="0" y="164" fill="#cbd5e1" fontSize="10" fontWeight="bold">Hiện tượng nhận biết (SGK KHTN 9):</text>
                        <text x="0" y="180" fill="#f97316" fontSize="9.5">
                          • Cực âm (-): Đồng màu đỏ gạch bám chắc vào than
                        </text>
                        <text x="0" y="196" fill="#facc15" fontSize="9.5">
                          • Cực dương (+): Khí mùi hắc (Cl₂) tẩy trắng quỳ tím ẩm
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* Stage Bottom Live Measurement Strip */}
            <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                {selectedExpId === "ohm_circuit" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Hiệu điện thế:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{voltage} V</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Điện trở:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{resistance} Ω</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Dòng điện:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{currentAmp} A</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Công suất:</span>
                      <span className="font-bold text-yellow-400 font-mono text-sm">{powerWatt} W</span>
                    </div>
                  </>
                )}

                {selectedExpId === "archimedes_buoyancy" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Trọng lượng P:</span>
                      <span className="font-bold text-red-400 font-mono text-sm">{inAirWeightN} N</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lực đẩy Fa:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{buoyantForceN} N</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Số chỉ lực kế:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{dynamometerReadingN} N</span>
                    </div>
                  </>
                )}

                {selectedExpId === "chemical_mass_conservation" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khối lượng cân:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">142.50 g</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Hiện tượng:</span>
                      <span className="font-bold text-cyan-400">
                        {reactionStep === "initial" ? "Hai dung dịch trong suốt" : "Tạo kết tủa trắng BaSO4"}
                      </span>
                    </div>
                  </>
                )}

                {selectedExpId === "optics_refraction" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Góc tới i:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{incidenceAngle}°</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Góc khúc xạ r:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{refractionAngle}°</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tỉ số n2/n1:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">1.50</span>
                    </div>
                  </>
                )}

                {selectedExpId === "fluid_pressure_vessels" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Độ sâu h:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{fluidDepth} cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Áp suất p:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{currentPressurePa} Pa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Chênh lệch áp kế:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{manometerDiffCm} cm</span>
                    </div>
                  </>
                )}

                {selectedExpId === "optics_convex_lens" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khoảng cách d:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{objectDistance} cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tiêu cự f:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{lensFocalLength} cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khoảng cách ảnh d&apos;:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {lensCalculations.isInfinite ? "∞" : `${lensCalculations.imageDistance} cm`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Đặc điểm:</span>
                      <span className="font-bold text-purple-400 text-xs">{lensCalculations.typeLabel}</span>
                    </div>
                  </>
                )}

                {selectedExpId === "electromagnet_field" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Dòng điện I:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{magnetCurrent} A</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Số vòng N:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{coilTurns} vòng</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lõi sắt:</span>
                      <span className="font-bold text-blue-400 text-xs">{hasIronCore ? "Sắt non" : "Không lõi"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Số đinh hút:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{electromagnetStrength.attractedNails} đinh</span>
                    </div>
                  </>
                )}

                {selectedExpId === "reaction_rate_factors" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Axit HCl:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{acidConcentration}M</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Nhiệt độ:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{reactionTemp}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Kẽm:</span>
                      <span className="font-bold text-blue-400 text-xs">{zincForm === "powder" ? "Bột mịn" : "Hạt"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Thể tích H₂:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{reactionRateCalculations.gasVolumeMl} ml</span>
                    </div>
                  </>
                )}

                {selectedExpId === "photosynthesis_starch" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Giai đoạn:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{starchStep}/5</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Chiếu sáng:</span>
                      <span className="font-bold text-indigo-400 text-xs">Xanh tím (Có tinh bột)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Che tối:</span>
                      <span className="font-bold text-amber-400 text-xs">Vàng nâu (Không tinh bột)</span>
                    </div>
                  </>
                )}

                {selectedExpId === "mixture_separation" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Phương pháp:</span>
                      <span className="font-bold text-cyan-400 text-xs">
                        {separationMethod === "filter" ? "Lọc qua giấy lọc" : "Cô cạn bằng đèn cồn"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tiến trình:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{separationProgress}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Sản phẩm thu được:</span>
                      <span className="font-bold text-amber-400 text-xs">
                        {separationMethod === "filter" ? "Bã cát + Nước muối trong" : `${separationCalculations.saltGrams}g muối NaCl kết tinh`}
                      </span>
                    </div>
                  </>
                )}

                {selectedExpId === "friction_force" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Mặt tiếp xúc:</span>
                      <span className="font-bold text-cyan-400 text-xs">{frictionCalculations.surfaceLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Áp lực N:</span>
                      <span className="font-bold text-blue-400 font-mono text-sm">{frictionCalculations.normalForceN} N</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Hệ số ma sát μ:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{frictionCalculations.mu}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lực ma sát F_ms:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{frictionCalculations.frictionForceN} N</span>
                    </div>
                  </>
                )}

                {selectedExpId === "optics_plane_mirror" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Góc tới i:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{planeMirrorCalculations.i}°</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Góc phản xạ i&apos;:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{planeMirrorCalculations.iPrime}°</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khoảng cách d:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{planeMirrorCalculations.d} cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khoảng cách ảnh d&apos;:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">{planeMirrorCalculations.dPrime} cm (Ảnh ảo)</span>
                    </div>
                  </>
                )}

                {selectedExpId === "sound_reflection_echo" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khoảng cách s:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{barrierDistance} m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Vận tốc âm v:</span>
                      <span className="font-bold text-blue-400 font-mono text-sm">340 m/s</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Thời gian trễ Δt:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{soundEchoCalculations.deltaT} s</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tiếng vang:</span>
                      <span className={`font-bold text-xs ${soundEchoCalculations.canHearEcho ? "text-emerald-400" : "text-yellow-400"}`}>
                        {soundEchoCalculations.canHearEcho ? "Nghe rõ tiếng vang" : "Không phân biệt được"}
                      </span>
                    </div>
                  </>
                )}

                {selectedExpId === "lever_balance" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Mô-men M1:</span>
                      <span className="font-bold text-red-400 font-mono text-sm">{leverCalculations.m1} N.m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Mô-men M2:</span>
                      <span className="font-bold text-blue-400 font-mono text-sm">{leverCalculations.m2} N.m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Trạng thái:</span>
                      <span className={`font-bold text-xs ${leverCalculations.isBalanced ? "text-emerald-400" : "text-amber-400"}`}>
                        {leverCalculations.isBalanced ? "Cân bằng thăng bằng" : `Lệch ${leverCalculations.deltaM} N.m`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lợi về lực:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">x{leverCalculations.advantage}</span>
                    </div>
                  </>
                )}

                {selectedExpId === "acid_base_ph_indicator" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Mẫu thử:</span>
                      <span className="font-bold text-cyan-400">{phCalculations.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Giá trị pH:</span>
                      <span className="font-bold text-yellow-400 font-mono text-sm">{phCalculations.ph}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Chỉ thị:</span>
                      <span className="font-bold text-fuchsia-400">
                        {selectedIndicator === "litmus" ? "Quỳ tím" : selectedIndicator === "phenolphthalein" ? "Phenolphthalein" : "Thang pH"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Màu sắc:</span>
                      <span className="font-bold text-emerald-400 text-xs">{phCalculations.indicatorLabel}</span>
                    </div>
                  </>
                )}

                {selectedExpId === "osmosis_cell_turgor" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Môi trường:</span>
                      <span className="font-bold text-cyan-400">{osmosisCalculations.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Không bào tím:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">~{Math.round(osmosisCalculations.vacuoleScale * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Hiện tượng:</span>
                      <span className={`font-bold text-xs ${osmosisCalculations.isPlasmolyzed ? "text-amber-400" : "text-emerald-400"}`}>
                        {osmosisCalculations.isPlasmolyzed ? "Co nguyên sinh (mất nước)" : "Trương bào (căng tràn)"}
                      </span>
                    </div>
                  </>
                )}

                {selectedExpId === "electromagnetic_induction" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Vị trí nam châm:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{magnetX} mm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Số vòng N:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{inductionCalculations.N}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Suất điện động e:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{inductionCalculations.inducedVoltageMv} mV</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Dòng cảm ứng Icư:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">{inductionCalculations.inducedCurrentMa} mA</span>
                    </div>
                  </>
                )}

                {selectedExpId === "sound_oscilloscope_frequency" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tần số f:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{oscFreqHz} Hz</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Cao độ:</span>
                      <span className="font-bold text-cyan-400 text-xs">{oscilloscopeCalculations.pitchCategory}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Chu kỳ T:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{oscilloscopeCalculations.periodMs} ms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Biên độ (Độ to):</span>
                      <span className="font-bold text-yellow-400 font-mono text-sm">~{oscilloscopeCalculations.decibelEst} dB</span>
                    </div>
                  </>
                )}

                {selectedExpId === "thermal_expansion_solids" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Kim loại:</span>
                      <span className="font-bold text-cyan-400">{thermalExpansionCalculations.metalLabel.split("-")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Nhiệt độ T:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{solidBallTemp} °C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Đường kính D:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">{thermalExpansionCalculations.currentDiameter} mm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Trạng thái:</span>
                      <span className={`font-bold text-xs ${thermalExpansionCalculations.canPass ? "text-emerald-400" : "text-red-400"}`}>
                        {thermalExpansionCalculations.canPass ? "Lọt qua vòng" : "Bị kẹt lại"}
                      </span>
                    </div>
                  </>
                )}

                {selectedExpId === "spring_hooke_elasticity" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Độ cứng k:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{springK} N/m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khối lượng m:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{hangingMassG} g</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lực đàn hồi F:</span>
                      <span className="font-bold text-red-400 font-mono text-sm">{springCalculations.forceN} N</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Độ dãn Δl:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">+{springCalculations.elongationCm} cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Tổng chiều dài l:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">{springCalculations.totalLengthCm} cm</span>
                    </div>
                  </>
                )}

                {selectedExpId === "plant_phototropism" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Nguồn sáng:</span>
                      <span className="font-bold text-yellow-400 text-xs">{phototropismCalculations.title.split("(")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Thời gian:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{phototropismHours} h</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Góc uốn cong θ:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{Math.abs(Math.round(phototropismCalculations.bendAngle))}°</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Auxin (Tối / Sáng):</span>
                      <span className="font-bold text-amber-400 font-mono text-xs">{phototropismCalculations.darkAuxinPercent}% / {phototropismCalculations.lightAuxinPercent}%</span>
                    </div>
                  </>
                )}

                {selectedExpId === "exothermic_endothermic_reaction" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Loại phản ứng:</span>
                      <span className={`font-bold text-xs ${thermalCalculations.isExo ? "text-red-400" : "text-cyan-400"}`}>
                        {thermalCalculations.type.split("(")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Nhiệt độ T:</span>
                      <span className={`font-bold font-mono text-sm ${thermalReactionTemp > 30 ? "text-red-400" : thermalReactionTemp < 20 ? "text-cyan-400" : "text-emerald-400"}`}>
                        {thermalReactionTemp} °C
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Độ biến thiên ΔT:</span>
                      <span className="font-bold font-mono text-sm text-yellow-400">
                        {thermalReactionTemp >= 25 ? `+${thermalReactionTemp - 25}` : `${thermalReactionTemp - 25}`} °C
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Lượng chất:</span>
                      <span className="font-bold text-purple-400 font-mono text-sm">{reagentAmountG} g</span>
                    </div>
                  </>
                )}

                {selectedExpId === "electrolysis_copper_chloride" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Điện áp U:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{electrolysisVoltage} V</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Dòng điện I:</span>
                      <span className="font-bold text-yellow-400 font-mono text-sm">{electrolysisCalculations.currentMa} mA</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Cu bám Catot (-):</span>
                      <span className="font-bold text-orange-400 font-mono text-sm">{electrolysisCalculations.copperMassMg} mg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">Khí Cl₂ Anot (+):</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{electrolysisCalculations.gasVolumeMl} ml</span>
                    </div>
                  </>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleLogData}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ghi số liệu vào bảng</span>
              </Button>
            </div>
          </div>

          {/* ── BẢNG SỐ LIỆU ĐO LƯỜNG THỰC NGHIỆM (DATA LOGGER) ── */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Bảng Nhật Ký Số Liệu Thực Nghiệm (Data Logger)
                </h3>
                <span className="text-[11px] text-neutral-400">
                  ({recordedData.filter((r) => r.expId === selectedExpId).length} lần đo)
                </span>
              </div>
              {recordedData.filter((r) => r.expId === selectedExpId).length > 0 && (
                <button
                  onClick={handleClearData}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa bảng
                </button>
              )}
            </div>

            {recordedData.filter((r) => r.expId === selectedExpId).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-xl">Thời gian</th>
                      <th className="p-2.5">Tham số 1</th>
                      <th className="p-2.5">Tham số 2</th>
                      <th className="p-2.5">Kết quả đo</th>
                      <th className="p-2.5 rounded-r-xl">Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                    {recordedData
                      .filter((r) => r.expId === selectedExpId)
                      .map((row) => (
                        <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="p-2.5 text-neutral-400 font-sans">{row.time}</td>
                          <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{row.col1}</td>
                          <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{row.col2}</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{row.col3}</td>
                          <td className="p-2.5 text-neutral-600 dark:text-neutral-300 font-sans">{row.col4}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                Chưa có lần đo nào. Hãy điều chỉnh các thanh trượt và nhấn &quot;Ghi số liệu vào bảng&quot; để đối chiếu kết quả!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CONTROLS & THEORY (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Control Panel */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Bảng Điều Khiển Thí Nghiệm
              </h3>
            </div>

            {/* CONTROLS CHO MẠCH ĐIỆN */}
            {selectedExpId === "ohm_circuit" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Khóa K (Công tắc mạch)
                  </span>
                  <Switch
                    checked={isSwitchClosed}
                    onCheckedChange={(val) => {
                      setIsSwitchClosed(val);
                      playSound("click");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Hiệu điện thế nguồn (U):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {voltage} V
                    </span>
                  </div>
                  <Slider
                    value={[voltage]}
                    min={0}
                    max={24}
                    step={1}
                    onValueChange={(val) => setVoltage(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0V (Tắt)</span>
                    <span>12V (Chuẩn)</span>
                    <span>24V (Cực đại)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Điện trở mẫu (R):
                    </span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {resistance} Ω
                    </span>
                  </div>
                  <Slider
                    value={[resistance]}
                    min={2}
                    max={50}
                    step={1}
                    onValueChange={(val) => setResistance(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>2Ω</span>
                    <span>25Ω</span>
                    <span>50Ω</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS CHO ÁC-SI-MÉT */}
            {selectedExpId === "archimedes_buoyancy" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Vật liệu vật nặng:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "aluminum", label: "Nhôm" },
                      { id: "iron", label: "Sắt" },
                      { id: "wood", label: "Gỗ" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setBuoyancyMaterial(item.id as "iron" | "aluminum" | "wood");
                          playSound("click");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          buoyancyMaterial === item.id
                            ? "bg-purple-600 text-white border-purple-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Chất lỏng trong bình:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "water", label: "Nước" },
                      { id: "salt_water", label: "Nước muối" },
                      { id: "oil", label: "Dầu ăn" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLiquidType(item.id as "water" | "salt_water" | "oil");
                          playSound("splash");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          liquidType === item.id
                            ? "bg-cyan-600 text-white border-cyan-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Độ chìm trong chất lỏng:
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {submergedPercent}%
                    </span>
                  </div>
                  <Slider
                    value={[submergedPercent]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(val) => setSubmergedPercent(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0% (Trong khí)</span>
                    <span>50% (Một nửa)</span>
                    <span>100% (Chìm hẳn)</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS CHO HÓA HỌC */}
            {selectedExpId === "chemical_mass_conservation" && (
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    const next = reactionStep === "initial" ? "mixed" : "initial";
                    setReactionStep(next);
                    playSound("bubble");
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-xs font-bold gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>
                    {reactionStep === "initial" ? "Trộn & Bắt đầu phản ứng" : "Rửa sạch cốc (Làm lại)"}
                  </span>
                </Button>

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1.5">
                  <p className="font-semibold text-neutral-900 dark:text-white">Dấu hiệu nhận biết:</p>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {reactionStep === "initial"
                      ? "Hai cốc dung dịch BaCl2 và Na2SO4 đều trong suốt không màu."
                      : "Dung dịch xuất hiện kết tủa trắng đục Bari sunfat (BaSO4) lắng xuống đáy cốc."}
                  </p>
                </div>
              </div>
            )}

            {/* CONTROLS CHO KHÚC XẠ ÁNH SÁNG */}
            {selectedExpId === "optics_refraction" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nguồn phát tia sáng:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "red_laser", label: "Laser Đỏ" },
                      { id: "green_laser", label: "Laser Xanh" },
                      { id: "white_prism", label: "Tán sắc" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLightSourceType(item.id as "red_laser" | "green_laser" | "white_prism");
                          playSound("laser");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          lightSourceType === item.id
                            ? "bg-purple-600 text-white border-purple-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Góc tới (i):
                    </span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {incidenceAngle}°
                    </span>
                  </div>
                  <Slider
                    value={[incidenceAngle]}
                    min={0}
                    max={85}
                    step={1}
                    onValueChange={(val) => setIncidenceAngle(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0° (Vuông góc)</span>
                    <span>45°</span>
                    <span>85°</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS CHO ÁP SUẤT CHẤT LỎNG */}
            {selectedExpId === "fluid_pressure_vessels" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Độ sâu đầu đo (h):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {fluidDepth} cm
                    </span>
                  </div>
                  <Slider
                    value={[fluidDepth]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(val) => setFluidDepth(getSliderNum(val))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Hướng của màng cảm biến:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "down", label: "Hướng xuống" },
                      { id: "up", label: "Hướng lên" },
                      { id: "side", label: "Sang ngang" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setProbeOrientation(item.id as "down" | "up" | "side");
                          playSound("click");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          probeOrientation === item.id
                            ? "bg-cyan-600 text-white border-cyan-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS CHO THẤU KÍNH HỘI TỤ (KHTN 9 Bài 6) */}
            {selectedExpId === "optics_convex_lens" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Tiêu cự thấu kính hội tụ (f):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[10, 15].map((fVal) => (
                      <button
                        key={fVal}
                        type="button"
                        onClick={() => {
                          setLensFocalLength(fVal);
                          playSound("click");
                        }}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          lensFocalLength === fVal
                            ? "bg-purple-600 text-white border-purple-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        f = {fVal} cm
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Khoảng cách từ vật đến thấu kính (d):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {objectDistance} cm
                    </span>
                  </div>
                  <Slider
                    value={[objectDistance]}
                    min={5}
                    max={45}
                    step={1}
                    onValueChange={(val) => setObjectDistance(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>5cm (d &lt; f)</span>
                    <span>{lensFocalLength}cm (d = f)</span>
                    <span>{lensFocalLength * 2}cm (d = 2f)</span>
                    <span>45cm (d &gt; 2f)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Chiều cao ngọn nến sáng (h):
                    </span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {objectHeight} cm
                    </span>
                  </div>
                  <Slider
                    value={[objectHeight]}
                    min={2}
                    max={6}
                    step={1}
                    onValueChange={(val) => setObjectHeight(getSliderNum(val))}
                  />
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-white">Trạng thái ảnh:</span>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold">{lensCalculations.typeLabel}</p>
                </div>
              </div>
            )}

            {/* CONTROLS CHO NAM CHÂM ĐIỆN (KHTN 7 Bài 21) */}
            {selectedExpId === "electromagnet_field" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Khóa K (Công tắc dòng điện)
                  </span>
                  <Switch
                    checked={magnetSwitch}
                    onCheckedChange={(val) => {
                      setMagnetSwitch(val);
                      playSound("click");
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Số vòng dây của ống dây (N):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([50, 100, 200] as const).map((turns) => (
                      <button
                        key={turns}
                        type="button"
                        onClick={() => {
                          setCoilTurns(turns);
                          playSound("click");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          coilTurns === turns
                            ? "bg-amber-600 text-white border-amber-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {turns} vòng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Cường độ dòng điện (I):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {magnetCurrent} A
                    </span>
                  </div>
                  <Slider
                    value={[magnetCurrent * 10]}
                    min={5}
                    max={30}
                    step={1}
                    onValueChange={(val) => setMagnetCurrent(parseFloat((getSliderNum(val) / 10).toFixed(1)))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0.5A (Yếu)</span>
                    <span>1.5A (Chuẩn)</span>
                    <span>3.0A (Mạnh)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Lõi sắt non trong lòng ống dây
                  </span>
                  <Switch
                    checked={hasIronCore}
                    onCheckedChange={(val) => {
                      setHasIronCore(val);
                      playSound("click");
                    }}
                  />
                </div>
              </div>
            )}

            {/* CONTROLS CHO TỐC ĐỘ PHẢN ỨNG HÓA HỌC (KHTN 8 Bài 11) */}
            {selectedExpId === "reaction_rate_factors" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nồng độ dung dịch HCl:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([0.5, 2.0] as const).map((cVal) => (
                      <button
                        key={cVal}
                        type="button"
                        onClick={() => {
                          setAcidConcentration(cVal);
                          playSound("click");
                        }}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          acidConcentration === cVal
                            ? "bg-cyan-600 text-white border-cyan-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {cVal}M ({cVal === 0.5 ? "Loãng" : "Đặc"})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nhiệt độ phản ứng:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([25, 60] as const).map((tVal) => (
                      <button
                        key={tVal}
                        type="button"
                        onClick={() => {
                          setReactionTemp(tVal);
                          playSound("click");
                        }}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          reactionTemp === tVal
                            ? "bg-amber-600 text-white border-amber-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {tVal}°C ({tVal === 25 ? "Thường" : "Đun nóng"})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Dạng kẽm (Diện tích tiếp xúc):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "granule", label: "Zn dạng hạt" },
                      { id: "powder", label: "Zn dạng bột mịn" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setZincForm(item.id as "granule" | "powder");
                          playSound("click");
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          zincForm === item.id
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Chất xúc tác CuSO₄ (Ăn mòn điện hóa)
                  </span>
                  <Switch
                    checked={hasReactionCatalyst}
                    onCheckedChange={(val) => {
                      setHasReactionCatalyst(val);
                      playSound("click");
                    }}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsReacting(!isReacting);
                      playSound("bubble");
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold gap-1.5 ${
                      isReacting ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                    } text-white`}
                  >
                    {isReacting ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isReacting ? "Tạm dừng" : "Bắt đầu phản ứng"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsReacting(false);
                      setReactionProgress(0);
                      playSound("click");
                    }}
                    className="rounded-xl px-3 text-xs border-neutral-200 dark:border-neutral-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO QUANG HỢP TẠO TINH BỘT (KHTN 7 Bài 23) */}
            {selectedExpId === "photosynthesis_starch" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Tiến trình thí nghiệm từng bước:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { step: 1, label: "1. Bịt băng đen & chiếu sáng 6h" },
                      { step: 2, label: "2. Nhúng nước sôi (100°C diệt TB)" },
                      { step: 3, label: "3. Đun cách thủy cồn 90° (tẩy xanh)" },
                      { step: 4, label: "4. Nhỏ thuốc thử Iot 1%" },
                      { step: 5, label: "5. Quan sát đối chứng xanh tím" },
                    ].map((item) => (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => {
                          setStarchStep(item.step as 1 | 2 | 3 | 4 | 5);
                          playSound("click");
                        }}
                        className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          starchStep === item.step
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={starchStep <= 1}
                    onClick={() => {
                      setStarchStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5);
                      playSound("click");
                    }}
                    className="flex-1 rounded-xl text-xs"
                  >
                    Bước trước
                  </Button>
                  <Button
                    type="button"
                    disabled={starchStep >= 5}
                    onClick={() => {
                      setStarchStep((prev) => Math.min(5, prev + 1) as 1 | 2 | 3 | 4 | 5);
                      playSound("splash");
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Bước tiếp theo
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO TÁCH CHẤT HỖN HỢP (KHTN 6 Bài 20) */}
            {selectedExpId === "mixture_separation" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Chọn phương pháp tách chất:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "filter", label: "1. Phương pháp Lọc" },
                      { id: "evaporate", label: "2. Phương pháp Cô cạn" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSeparationMethod(item.id as "filter" | "evaporate");
                          setSeparationProgress(0);
                          setIsSeparating(false);
                          playSound("click");
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          separationMethod === item.id
                            ? "bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {separationMethod === "evaporate" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Ngọn lửa đèn cồn:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "low", label: "Lửa nhỏ" },
                        { id: "medium", label: "Lửa vừa" },
                        { id: "high", label: "Lửa lớn" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFlameLevel(item.id as "low" | "medium" | "high");
                            playSound("click");
                          }}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                            flameLevel === item.id
                              ? "bg-amber-600 text-white border-amber-600 font-bold"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Tiến trình {separationMethod === "filter" ? "lọc" : "cô cạn"}:
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {separationProgress}%
                    </span>
                  </div>
                  <Slider
                    value={[separationProgress]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(val) => setSeparationProgress(getSliderNum(val))}
                  />
                </div>

                <div className="pt-1 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsSeparating(!isSeparating);
                      playSound("bubble");
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold gap-1.5 ${
                      isSeparating ? "bg-amber-600 hover:bg-amber-500" : "bg-cyan-600 hover:bg-cyan-500"
                    } text-white`}
                  >
                    {isSeparating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isSeparating ? "Tạm dừng" : separationMethod === "filter" ? "Bắt đầu lọc" : "Bắt đầu đun"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSeparating(false);
                      setSeparationProgress(0);
                      playSound("click");
                    }}
                    className="rounded-xl px-3 text-xs border-neutral-200 dark:border-neutral-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO LỰC MA SÁT (KHTN 6 Bài 40) */}
            {selectedExpId === "friction_force" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Bề mặt tiếp xúc:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "glass", name: "Mặt kính", mu: "μ = 0.12" },
                      { id: "wood", name: "Mặt gỗ", mu: "μ = 0.32" },
                      { id: "sandpaper", name: "Giấy nhám", mu: "μ = 0.65" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSurfaceType(item.id as "glass" | "wood" | "sandpaper");
                          playSound("click");
                        }}
                        className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          surfaceType === item.id
                            ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        <span className="text-[11px] font-bold leading-tight">{item.name}</span>
                        <span className="text-[9px] font-mono opacity-80 leading-tight mt-0.5">{item.mu}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Khối lượng vật nặng (m):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {blockMassG} gam (P = {frictionCalculations.normalForceN}N)
                    </span>
                  </div>
                  <Slider
                    value={[blockMassG]}
                    min={100}
                    max={500}
                    step={50}
                    onValueChange={(val) => setBlockMassG(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>100g</span>
                    <span>200g</span>
                    <span>300g</span>
                    <span>400g</span>
                    <span>500g</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Áp lực vuông góc N:</span>
                    <span className="font-bold font-mono text-blue-500">{frictionCalculations.normalForceN} N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Lực ma sát trượt F_ms:</span>
                    <span className="font-bold font-mono text-emerald-500">{frictionCalculations.frictionForceN} N</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setIsPullingBlock(!isPullingBlock);
                    playSound("click");
                  }}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold gap-1.5 ${
                    isPullingBlock ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                  } text-white`}
                >
                  {isPullingBlock ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPullingBlock ? "Thả tay (Dừng kéo)" : "Kéo lực kế (Trượt đều)"}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO GƯƠNG PHẲNG (KHTN 7 Bài 12) */}
            {selectedExpId === "optics_plane_mirror" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Chế độ khảo sát:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "rays", title: "Tia sáng phản xạ", sub: "Góc i' = i" },
                      { id: "object_image", title: "Tạo ảnh của vật", sub: "Khoảng cách d' = d" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMirrorMode(item.id as "rays" | "object_image");
                          playSound("click");
                        }}
                        className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          mirrorMode === item.id
                            ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{item.title}</span>
                        <span className="text-[10px] font-mono opacity-80 leading-tight mt-0.5">{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {mirrorMode === "rays" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Góc tới của tia sáng (i):
                      </span>
                      <span className="font-bold font-mono text-amber-500 text-sm">
                        {mirrorIncidenceAngle}°
                      </span>
                    </div>
                    <Slider
                      value={[mirrorIncidenceAngle]}
                      min={0}
                      max={75}
                      step={5}
                      onValueChange={(val) => setMirrorIncidenceAngle(getSliderNum(val))}
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>0° (Vuông góc)</span>
                      <span>30°</span>
                      <span>45°</span>
                      <span>60°</span>
                      <span>75°</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Khoảng cách từ vật đến gương (d):
                        </span>
                        <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                          {mirrorObjectDist} cm
                        </span>
                      </div>
                      <Slider
                        value={[mirrorObjectDist]}
                        min={10}
                        max={40}
                        step={2}
                        onValueChange={(val) => setMirrorObjectDist(getSliderNum(val))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Chiều cao ngọn nến (h):
                        </span>
                        <span className="font-bold font-mono text-amber-500 text-sm">
                          {mirrorObjectHeight} cm
                        </span>
                      </div>
                      <Slider
                        value={[mirrorObjectHeight]}
                        min={2}
                        max={8}
                        step={1}
                        onValueChange={(val) => setMirrorObjectHeight(getSliderNum(val))}
                      />
                    </div>
                  </>
                )}

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-white">Kiểm chứng định luật:</span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {mirrorMode === "rays"
                      ? `Góc phản xạ i' = ${planeMirrorCalculations.iPrime}° (bằng góc tới i = ${planeMirrorCalculations.i}°)`
                      : `Ảnh ảo đối xứng: d' = ${planeMirrorCalculations.dPrime}cm, chiều cao h' = ${planeMirrorCalculations.hPrime}cm`}
                  </p>
                </div>
              </div>
            )}

            {/* CONTROLS CHO PHẢN XẠ ÂM & TIẾNG VANG (KHTN 7 Bài 14) */}
            {selectedExpId === "sound_reflection_echo" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Vật liệu vách cản âm:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "cliff", label: "Vách đá (95%)" },
                      { id: "brick_wall", label: "Tường gạch (80%)" },
                      { id: "curtain", label: "Rèm nhung (Hút âm)" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setBarrierMaterial(item.id as "cliff" | "brick_wall" | "curtain");
                          playSound("click");
                        }}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          barrierMaterial === item.id
                            ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Khoảng cách đến vách cản (s):
                    </span>
                    <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                      {barrierDistance} mét
                    </span>
                  </div>
                  <Slider
                    value={[barrierDistance]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(val) => setBarrierDistance(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>5m</span>
                    <span>11.33m (Ngưỡng tiếng vang)</span>
                    <span>30m</span>
                    <span>50m</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Thời gian dội lại Δt:</span>
                    <span className="font-bold font-mono text-amber-500">{soundEchoCalculations.deltaT} giây</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phân biệt tiếng vang:</span>
                    <span className={`font-bold text-xs ${soundEchoCalculations.canHearEcho ? "text-emerald-500" : "text-yellow-500"}`}>
                      {soundEchoCalculations.canHearEcho ? "Nghe rõ tiếng vang" : "Âm chập kéo dài"}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isEmittingSound}
                  onClick={emitLabSound}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-bold gap-1.5"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>{isEmittingSound ? "Sóng âm đang lan truyền..." : "Phát tín hiệu âm thanh (Nghe tiếng vang)"}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO ĐÒN BẨY (KHTN 8 Bài 19) */}
            {selectedExpId === "lever_balance" && (
              <div className="space-y-4">
                {/* Left Side Controls */}
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <span className="text-xs font-bold text-red-500">Bên trái điểm tựa O (Tải trọng F1):</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Cánh tay đòn d1:</span>
                    <span className="font-bold font-mono text-red-400">{leftArmD1} cm</span>
                  </div>
                  <Slider
                    value={[leftArmD1]}
                    min={10}
                    max={50}
                    step={5}
                    onValueChange={(val) => setLeftArmD1(getSliderNum(val))}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Khối lượng m1:</span>
                    <span className="font-bold font-mono text-red-400">{leftMassM1} g (P1={leverCalculations.f1}N)</span>
                  </div>
                  <Slider
                    value={[leftMassM1]}
                    min={50}
                    max={500}
                    step={50}
                    onValueChange={(val) => setLeftMassM1(getSliderNum(val))}
                  />
                </div>

                {/* Right Side Controls */}
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <span className="text-xs font-bold text-blue-500">Bên phải điểm tựa O (Lực tác dụng F2):</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Cánh tay đòn d2:</span>
                    <span className="font-bold font-mono text-blue-400">{rightArmD2} cm</span>
                  </div>
                  <Slider
                    value={[rightArmD2]}
                    min={10}
                    max={50}
                    step={5}
                    onValueChange={(val) => setRightArmD2(getSliderNum(val))}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Khối lượng m2:</span>
                    <span className="font-bold font-mono text-blue-400">{rightMassM2} g (P2={leverCalculations.f2}N)</span>
                  </div>
                  <Slider
                    value={[rightMassM2]}
                    min={50}
                    max={500}
                    step={50}
                    onValueChange={(val) => setRightMassM2(getSliderNum(val))}
                  />
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mô-men M1 (Trái):</span>
                    <span className="font-bold font-mono text-red-500">{leverCalculations.m1} N.m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mô-men M2 (Phải):</span>
                    <span className="font-bold font-mono text-blue-500">{leverCalculations.m2} N.m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Trạng thái:</span>
                    <span className={`font-bold ${leverCalculations.isBalanced ? "text-emerald-500" : "text-amber-500"}`}>
                      {leverCalculations.isBalanced ? "Cân bằng thăng bằng" : `Lệch ${leverCalculations.deltaM} N.m`}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const ideal = Math.max(10, Math.min(50, Math.round(((leverCalculations.f1 * leftArmD1) / leverCalculations.f2) / 5) * 5));
                    setRightArmD2(ideal);
                    playSound("beep");
                  }}
                  className="w-full rounded-xl py-2.5 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Tìm vị trí cân bằng tự động</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO ĐO pH & CHỈ THỊ MÀU (KHTN 8 Bài 9) */}
            {selectedExpId === "acid_base_ph_indicator" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    1. Chọn dung dịch mẫu thử:
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: "lemon", name: "Nước chanh tươi", ph: "pH ~ 2.4", type: "Acid mạnh" },
                      { id: "vinegar", name: "Giấm ăn 5%", ph: "pH ~ 3.0", type: "Acid yếu" },
                      { id: "pure_water", name: "Nước cất tinh khiết", ph: "pH = 7.0", type: "Trung tính" },
                      { id: "soap", name: "Nước xà phòng", ph: "pH ~ 9.5", type: "Base nhẹ" },
                      { id: "naoh", name: "Dung dịch NaOH 0.1M", ph: "pH = 13.0", type: "Base mạnh" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhSample(s.id as any);
                          setIsIndicatorApplied(false);
                          playSound("click");
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          selectedPhSample === s.id
                            ? "bg-purple-600 text-white font-bold shadow-xs"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <span className="font-semibold truncate">{s.name}</span>
                        <span className="text-[10px] font-mono shrink-0 ml-2 opacity-80 whitespace-nowrap">
                          {s.ph} • {s.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    2. Chọn loại chất chỉ thị màu:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "litmus", label: "Giấy quỳ tím" },
                      { id: "phenolphthalein", label: "Phenolphtalein" },
                      { id: "universal", label: "pH vạn năng" },
                    ].map((ind) => (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => {
                          setSelectedIndicator(ind.id as any);
                          setIsIndicatorApplied(false);
                          playSound("click");
                        }}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          selectedIndicator === ind.id
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setIsIndicatorApplied(!isIndicatorApplied);
                    playSound("splash");
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold gap-1.5 ${
                    isIndicatorApplied ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isIndicatorApplied ? "Lấy mẫu thử mới (Reset)" : "Nhỏ chỉ thị / Nhúng giấy đo pH"}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO THẨM THẤU & CO NGUYÊN SINH (KHTN 6 Bài 17 / KHTN 7 Bài 28) */}
            {selectedExpId === "osmosis_cell_turgor" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Môi trường dung dịch nhỏ vào tiêu bản:
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: "hypertonic", name: "Ưu trương (NaCl 10%)", badge: "Co nguyên sinh" },
                      { id: "isotonic", name: "Đẳng trương (NaCl 0.9%)", badge: "Bình thường" },
                      { id: "hypotonic", name: "Nhược trương (Nước cất)", badge: "Trương bào" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setOsmosisMedium(m.id as any);
                          setOsmosisProgress(30);
                          playSound("bubble");
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          osmosisMedium === m.id
                            ? "bg-purple-600 text-white font-bold shadow-xs"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <span className="font-semibold truncate">{m.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-2 whitespace-nowrap ${
                          osmosisMedium === m.id
                            ? "bg-white/20 text-white"
                            : "bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}>
                          {m.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Tiến trình thẩm thấu nước:</span>
                    <span className="font-bold font-mono text-purple-500">{osmosisProgress}%</span>
                  </div>
                  <Slider
                    value={[osmosisProgress]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(val) => setOsmosisProgress(getSliderNum(val))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Độ phóng đại kính hiển vi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["100x", "400x"].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => {
                          setMicroscopeZoom(z as any);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          microscopeZoom === z
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        Vật kính {z}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOsmosisMedium(osmosisMedium === "hypertonic" ? "hypotonic" : "hypertonic");
                    setOsmosisProgress(90);
                    playSound("bubble");
                  }}
                  className="w-full rounded-xl py-2.5 text-xs font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{osmosisMedium === "hypertonic" ? "Đổi sang nước cất (Phản co nguyên sinh)" : "Đổi sang nước muối (Co nguyên sinh)"}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO CẢM ỨNG ĐIỆN TỪ (KHTN 9 Bài 14) */}
            {selectedExpId === "electromagnetic_induction" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Vị trí thanh nam châm:</span>
                    <span className="font-bold font-mono text-cyan-500">{magnetX} mm</span>
                  </div>
                  <Slider
                    value={[magnetX]}
                    min={-75}
                    max={75}
                    step={2}
                    onValueChange={(val) => {
                      const newX = getSliderNum(val);
                      setMagnetVelocity(newX - magnetX);
                      setMagnetX(newX);
                      playSound("click");
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>-75mm (Ngoài trái)</span>
                    <span>0mm (Tâm cuộn dây)</span>
                    <span>+75mm (Ngoài phải)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Số vòng dây cuộn cảm (N):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[200, 500, 1000].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setInductionCoilTurns(t as any);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          inductionCoilTurns === t
                            ? "bg-amber-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {t} vòng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Cực hướng vào: {magnetOrientation === "N_left" ? "Cực Bắc (N đỏ)" : "Cực Nam (S xanh)"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMagnetOrientation(magnetOrientation === "N_left" ? "S_left" : "N_left");
                      playSound("click");
                    }}
                    className="rounded-xl text-xs h-7"
                  >
                    Đảo cực nam châm
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setIsAutoOscillating(!isAutoOscillating);
                    playSound("click");
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold gap-1.5 ${
                    isAutoOscillating ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isAutoOscillating ? "Dừng dao động tự động" : "Bật dao động liên tục (Dòng xoay chiều)"}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO DAO ĐỘNG KÝ ÂM THANH (KHTN 7 Bài 13) */}
            {selectedExpId === "sound_oscilloscope_frequency" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Tần số dao động f (Hz):</span>
                    <span className="font-bold font-mono text-emerald-500 text-sm">{oscFreqHz} Hz</span>
                  </div>
                  <Slider
                    value={[oscFreqHz]}
                    min={100}
                    max={2000}
                    step={10}
                    onValueChange={(val) => setOscFreqHz(getSliderNum(val))}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>100Hz (Trầm)</span>
                    <span>440Hz (Nốt La chuẩn)</span>
                    <span>1000Hz</span>
                    <span>2000Hz (Bổng)</span>
                  </div>
                </div>

                {/* Preset Frequencies */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500">Mốc tần số chuẩn âm nhạc & vật lý:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { f: 150, hz: "150 Hz", note: "Trầm" },
                      { f: 261, hz: "261 Hz", note: "Đô C4" },
                      { f: 440, hz: "440 Hz", note: "La A4" },
                      { f: 523, hz: "523 Hz", note: "Đố C5" },
                      { f: 880, hz: "880 Hz", note: "La A5" },
                      { f: 1500, hz: "1500 Hz", note: "Bổng" },
                    ].map((item) => (
                      <button
                        key={item.f}
                        type="button"
                        onClick={() => {
                          setOscFreqHz(item.f);
                          playSound("click");
                        }}
                        className={`py-1.5 px-1 flex flex-col items-center justify-center rounded-xl text-center transition-all cursor-pointer ${
                          oscFreqHz === item.f
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                        }`}
                      >
                        <span className="font-mono font-bold text-[11px] leading-tight">{item.hz}</span>
                        <span className="text-[9px] opacity-75 font-medium leading-tight mt-0.5">{item.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Biên độ dao động (Độ to):</span>
                    <span className="font-bold font-mono text-amber-500">{oscAmplitude}% (~{oscilloscopeCalculations.decibelEst} dB)</span>
                  </div>
                  <Slider
                    value={[oscAmplitude]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(val) => setOscAmplitude(getSliderNum(val))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Dạng sóng dao động:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "sine", label: "Sóng Sin" },
                      { id: "triangle", label: "Sóng Tam giác" },
                      { id: "square", label: "Sóng Vuông" },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setOscWaveform(w.id as any);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          oscWaveform === w.id
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={toggleOscAudioTone}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold gap-1.5 ${
                    isPlayingAudioTone
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>{isPlayingAudioTone ? `Tắt âm thanh (${oscFreqHz} Hz)` : `Phát âm thanh tần số thực (${oscFreqHz} Hz)`}</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO SỰ NỞ VÌ NHIỆT CHẤT RẮN (KHTN 6 Bài 8 / KHTN 8 Bài 26) */}
            {selectedExpId === "thermal_expansion_solids" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Chọn kim loại quả cầu:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "aluminum", label: "Nhôm (Al)" },
                      { id: "copper", label: "Đồng (Cu)" },
                      { id: "iron", label: "Sắt (Fe)" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSolidBallMetal(m.id as any);
                          setIsBallTestedPass(false);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          solidBallMetal === m.id
                            ? "bg-amber-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Nhiệt độ quả cầu T:</span>
                    <span className="font-bold font-mono text-amber-500 text-sm">{solidBallTemp} °C</span>
                  </div>
                  <Slider
                    value={[solidBallTemp]}
                    min={20}
                    max={300}
                    step={5}
                    onValueChange={(val) => {
                      setSolidBallTemp(getSliderNum(val));
                      setIsBallTestedPass(false);
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>20°C (Phòng)</span>
                    <span>100°C</span>
                    <span>200°C</span>
                    <span>300°C (Rực lửa)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsHeatingBall(!isHeatingBall);
                      setIsBallTestedPass(false);
                      playSound("click");
                    }}
                    className={`rounded-xl py-2 text-xs font-bold gap-1.5 ${
                      isHeatingBall ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>{isHeatingBall ? "Tắt đèn cồn" : "Hơ lửa đèn cồn"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsHeatingBall(false);
                      setSolidBallTemp(20);
                      setIsBallTestedPass(false);
                      playSound("splash");
                    }}
                    className="rounded-xl py-2 text-xs font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
                  >
                    <Waves className="h-3.5 w-3.5" />
                    <span>Nhúng nước lạnh (20°C)</span>
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setIsBallTestedPass(true);
                    playSound(thermalExpansionCalculations.canPass ? "beep" : "click");
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold gap-1.5 ${
                    thermalExpansionCalculations.canPass
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Thử thả quả cầu qua vòng</span>
                </Button>
              </div>
            )}

            {/* CONTROLS CHO ĐỘ DÃN LÒ XO & ĐỊNH LUẬT HÚC (KHTN 6 Bài 36) */}
            {selectedExpId === "spring_hooke_elasticity" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Độ cứng lò xo (k):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 20, label: "20 N/m (Mềm)" },
                      { val: 50, label: "50 N/m (Vừa)" },
                      { val: 100, label: "100 N/m (Cứng)" },
                    ].map((kItem) => (
                      <button
                        key={kItem.val}
                        type="button"
                        onClick={() => {
                          setSpringK(kItem.val);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          springK === kItem.val
                            ? "bg-cyan-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {kItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Khối lượng quả nặng m:</span>
                    <span className="font-bold font-mono text-cyan-500 text-sm">{hangingMassG} g ({springCalculations.weightsCount} quả 50g)</span>
                  </div>
                  <Slider
                    value={[hangingMassG]}
                    min={0}
                    max={300}
                    step={50}
                    onValueChange={(val) => {
                      setHangingMassG(getSliderNum(val));
                      playSound("click");
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0g</span>
                    <span>100g</span>
                    <span>200g</span>
                    <span>300g (Max)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsSpringBouncing(true);
                      playSound("click");
                    }}
                    className="rounded-xl py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Kéo thả dao động</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setHangingMassG(0);
                      setIsSpringBouncing(false);
                      playSound("click");
                    }}
                    className="rounded-xl py-2 text-xs font-bold border-neutral-300 dark:border-neutral-700 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Tháo hết quả (0g)</span>
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO TÍNH HƯỚNG SÁNG & CƠ CHẾ AUXIN (KHTN 7 Bài 35) */}
            {selectedExpId === "plant_phototropism" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Hướng nguồn sáng chiếu vào hộp kín:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "left", label: "⬅️ Chiếu Trái" },
                      { id: "top", label: "⬆️ Chiếu Đỉnh" },
                      { id: "right", label: "➡️ Chiếu Phải" },
                      { id: "dark", label: "🌑 Che Tối Hoàn Toàn" },
                    ].map((dir) => (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => {
                          setLightDirection(dir.id as any);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          lightDirection === dir.id
                            ? "bg-amber-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Thời gian chiếu sáng:</span>
                    <span className="font-bold font-mono text-amber-500 text-sm">{phototropismHours} giờ ({Math.round(phototropismHours / 24)} ngày)</span>
                  </div>
                  <Slider
                    value={[phototropismHours]}
                    min={0}
                    max={72}
                    step={6}
                    onValueChange={(val) => {
                      setPhototropismHours(getSliderNum(val));
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0h (Mới gieo)</span>
                    <span>24h (1 ngày)</span>
                    <span>48h (2 ngày)</span>
                    <span>72h (3 ngày)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Hiển thị hạt Auxin</div>
                    <div className="text-[10px] text-neutral-500">Mô phỏng sự dồn nén hormone sang vùng tối</div>
                  </div>
                  <Switch
                    checked={showAuxinHeatmap}
                    onCheckedChange={(checked) => {
                      setShowAuxinHeatmap(checked);
                      playSound("click");
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setPhototropismHours((prev) => Math.min(72, prev + 24));
                      playSound("click");
                    }}
                    className="rounded-xl py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>Tua nhanh 24h</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPhototropismHours(0);
                      playSound("click");
                    }}
                    className="rounded-xl py-2 text-xs font-bold border-neutral-300 dark:border-neutral-700 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Đặt lại (0h)</span>
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO PHẢN ỨNG TỎA NHIỆT & THU NHIỆT (KHTN 8 Bài 8) */}
            {selectedExpId === "exothermic_endothermic_reaction" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Chọn phản ứng hóa học khảo sát nhiệt:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: "exothermic_cao", label: "Tôi vôi: CaO + H₂O (Tỏa nhiệt mạnh)" },
                      { id: "exothermic_acid_base", label: "Trung hòa: HCl + NaOH (Tỏa nhiệt)" },
                      { id: "endothermic_nh4cl", label: "Hòa tan: NH₄Cl + H₂O (Thu nhiệt lạnh)" },
                      { id: "endothermic_barium", label: "Ba(OH)₂ + 2NH₄SCN (Đóng băng -5°C)" },
                    ].map((rx) => (
                      <button
                        key={rx.id}
                        type="button"
                        onClick={() => {
                          setThermalReactionType(rx.id as any);
                          setIsThermalReacting(false);
                          setThermalReactionTemp(25);
                          playSound("click");
                        }}
                        className={`w-full py-2 px-3 text-left rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          thermalReactionType === rx.id
                            ? rx.id.startsWith("exo")
                              ? "bg-red-600 text-white font-bold"
                              : "bg-cyan-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {rx.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Khối lượng chất phản ứng:</span>
                    <span className="font-bold font-mono text-purple-500 text-sm">{reagentAmountG} g</span>
                  </div>
                  <Slider
                    value={[reagentAmountG]}
                    min={5}
                    max={25}
                    step={5}
                    onValueChange={(val) => {
                      setReagentAmountG(getSliderNum(val));
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>5g (Ít)</span>
                    <span>15g (Vừa)</span>
                    <span>25g (Nhiều)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsThermalReacting(!isThermalReacting);
                      playSound("bubble");
                    }}
                    className={`rounded-xl py-2 text-xs font-bold gap-1.5 ${
                      isThermalReacting
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>{isThermalReacting ? "Dừng phản ứng" : "Đổ hóa chất phản ứng"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsThermalReacting(false);
                      setThermalReactionTemp(25);
                      playSound("splash");
                    }}
                    className="rounded-xl py-2 text-xs font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Đặt lại (25°C)</span>
                  </Button>
                </div>
              </div>
            )}

            {/* CONTROLS CHO ĐIỆN PHÂN DUNG DỊCH CuCl2 (KHTN 9 Bài 19) */}
            {selectedExpId === "electrolysis_copper_chloride" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Khóa K (Công tắc nguồn DC)</div>
                    <div className="text-[10px] text-neutral-500">{isElectrolysisSwitchClosed ? "Mạch đóng - Đang điện phân" : "Mạch hở - Tắt nguồn"}</div>
                  </div>
                  <Switch
                    checked={isElectrolysisSwitchClosed}
                    onCheckedChange={(checked) => {
                      setIsElectrolysisSwitchClosed(checked);
                      playSound("click");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Hiệu điện thế nguồn DC:</span>
                    <span className="font-bold font-mono text-cyan-500 text-sm">{electrolysisVoltage}.0 V</span>
                  </div>
                  <Slider
                    value={[electrolysisVoltage]}
                    min={3}
                    max={12}
                    step={1}
                    onValueChange={(val) => {
                      setElectrolysisVoltage(getSliderNum(val));
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>3V</span>
                    <span>6V (Chuẩn)</span>
                    <span>9V</span>
                    <span>12V (Nhanh)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Nồng độ dung dịch CuCl₂:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0.2, label: "0.2 M (Loãng)" },
                      { val: 0.5, label: "0.5 M (Chuẩn)" },
                      { val: 1.0, label: "1.0 M (Đặc)" },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => {
                          setElectrolysisCuCl2Concentration(c.val);
                          playSound("click");
                        }}
                        className={`py-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          electrolysisCuCl2Concentration === c.val
                            ? "bg-cyan-600 text-white font-bold"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setElectrolysisSeconds(0);
                    playSound("click");
                  }}
                  className="w-full rounded-xl py-2 text-xs font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Thay điện cực mới / Đặt lại (0s)</span>
                </Button>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
              <Box className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                {labDisplayMode === "en" ? "Equipment" : "Dụng cụ thí nghiệm"}
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              {currentExp.apparatus.map((item, idx) => (
                <li key={`${currentExp.id}-apparatus-${idx}`} className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <LabTranslatableText
                    text={item}
                    displayMode={labDisplayMode}
                    translation={labTranslations[`apparatus-${idx}`]}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Bilingual Vocabulary Card */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-balance">
                {labDisplayMode === "en"
                  ? "Lab vocabulary"
                  : "Thuật ngữ song ngữ thí nghiệm"}
              </h4>
            </div>

            <div className="space-y-2">
              {currentExp.bilingualVocabulary.map((term, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800/60 text-xs space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white leading-tight">
                      {labDisplayMode === "en" ? term.en : term.vi}
                    </span>
                    {labDisplayMode === "both" ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0 whitespace-nowrap"
                      >
                        {term.en}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="block text-[10px] text-neutral-400 font-mono">
                      IPA: {term.ipa}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakVocabulary(term.en)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                      aria-label={`Phát âm ${term.en}`}
                    >
                      <Volume2 className="h-3 w-3" />
                      {labDisplayMode === "en" ? "Listen" : "Nghe"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {speechMessage ? (
              <p role="status" className="text-[11px] text-amber-700 dark:text-amber-300">
                {speechMessage}
              </p>
            ) : null}
          </div>

          {/* 5. Mini Quiz Check */}
          <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-balance">
                {labDisplayMode === "en"
                  ? "Knowledge check"
                  : "Câu hỏi củng cố"}
              </h4>
            </div>

            <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-relaxed text-balance">
              <LabTranslatableText
                key={`${currentExp.id}-quiz-question`}
                text={currentExp.quiz.question}
                displayMode={labDisplayMode}
                translation={labTranslations["quiz-question"]}
              />
            </p>

            <div className="space-y-1.5">
              {currentExp.quiz.options.map((opt, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect = idx === currentExp.quiz.correct;
                let btnStyle = "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300";
                if (showQuizExplanation) {
                  if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold";
                  else if (isSelected) btnStyle = "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400";
                } else if (isSelected) {
                  btnStyle = "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold";
                }

                return (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuizAnswer(idx);
                        setShowQuizExplanation(true);
                        playSound(idx === currentExp.quiz.correct ? "beep" : "click");
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer leading-snug text-balance flex items-start gap-2 ${btnStyle}`}
                    >
                      <span className="font-bold opacity-60 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                      <span>
                        {labDisplayMode === "en"
                          ? labTranslations[`quiz-option-${idx}`] || opt
                          : opt}
                      </span>
                    </button>
                    {labDisplayMode === "both" &&
                    labTranslations[`quiz-option-${idx}`] ? (
                      <span className="ml-7 mt-1 block text-sky-700 dark:text-sky-300">
                        {labTranslations[`quiz-option-${idx}`]}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {showQuizExplanation && (
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs space-y-1">
                <p className="font-bold text-blue-700 dark:text-blue-300">
                  {labDisplayMode === "en" ? "Explanation:" : "Giải thích:"}
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  <LabTranslatableText
                    key={`${currentExp.id}-quiz-explanation`}
                    text={currentExp.quiz.explanation}
                    displayMode={labDisplayMode}
                    translation={labTranslations["quiz-explanation"]}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* End of Active Simulation Studio (labStageRef) */}

          {/* RELATED EXPERIMENTS & RETURN TO CATALOG FOOTER */}
          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Thí Nghiệm Liên Quan Cùng Khối {currentExp.grade} &amp; Môn Học
                </h3>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                  Tiếp tục thực hành các bài liên quan trong chương trình SGK Kết Nối Tri Thức
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToCatalog}
                className="rounded-xl text-xs font-semibold gap-1.5 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer self-start sm:self-auto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Xem toàn bộ 23 bài thí nghiệm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedExperiments.map((relExp) => {
                const relMeta = getExperimentMeta(relExp.id);
                const RelIcon = relMeta.icon;
                return (
                  <div
                    key={relExp.id}
                    onClick={() => handleOpenExperiment(relExp.id)}
                    className="group cursor-pointer p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-purple-400 dark:hover:border-purple-500/60 bg-white dark:bg-neutral-900 hover:shadow-lg transition-all duration-200 flex items-center gap-3.5"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${relMeta.gradient} flex items-center justify-center shrink-0 text-white shadow-xs group-hover:scale-105 transition-transform`}>
                      <RelIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {relExp.badge} • Lớp {relExp.grade}
                      </span>
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {relExp.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate mt-0.5">
                        {relExp.titleEn}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
