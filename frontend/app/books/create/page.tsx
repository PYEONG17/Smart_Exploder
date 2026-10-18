"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  RotateCw,
  HelpCircle,
  Layers,
  GraduationCap,
  Save,
  Volume2,
  Bot,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import {
  saveUserBook,
  type FlipbookBook,
  type FlipbookPage,
} from "@/lib/flipbooks-data.config";
import FlipbookReader from "@/components/flipbook/FlipbookReader";

export default function CreateBookPage() {
  const router = useRouter();
  const { locale } = useLang();

  // Mode: "ai" | "upload" | "manual"
  const [activeTab, setActiveTab] = useState<"ai" | "upload" | "manual">("ai");

  // Basic book info
  const [titleVi, setTitleVi] = useState("Hệ Mặt Trời & Các Hành Tinh Khí Quyển");
  const [titleEn, setTitleEn] = useState("Solar System & Planetary Atmospheres");
  const [subject, setSubject] = useState<"science" | "math" | "physics" | "chemistry" | "biology">("science");
  const [grade, setGrade] = useState<"6" | "7" | "8" | "9">("6");
  const [textbook, setTextbook] = useState<"Kết Nối Tri Thức" | "Cánh Diều" | "Chân Trời Sáng Tạo">("Kết Nối Tri Thức");
  const [author, setAuthor] = useState("Giáo viên Smart Explorer");
  const [coverGradient, setCoverGradient] = useState("from-blue-600 via-indigo-600 to-cyan-500");

  // AI Generator state
  const [rawLessonText, setRawLessonText] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Upload PDF state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  // Pages builder state
  const [pages, setPages] = useState<FlipbookPage[]>([
    {
      pageNumber: 1,
      chapterTitleVi: "Chương I: Thiên văn học & Vũ trụ",
      chapterTitleEn: "Chapter I: Astronomy & Space",
      headingVi: "Bài 1: Mặt Trời và Quỹ đạo các Hành tinh",
      headingEn: "Lesson 1: The Sun and Planetary Orbits",
      subHeadingVi: "Cấu trúc tổng quan của Hệ Mặt Trời",
      subHeadingEn: "General architecture of the Solar System",
      paragraphsVi: [
        "Hệ Mặt Trời là một hệ hành tinh có Mặt Trời ở trung tâm và các thiên thể khác nằm trong phạm vi lực hấp dẫn của nó.",
        "Mặt Trời cung cấp năng lượng ánh sáng và nhiệt cần thiết cho sự sống tồn tại trên Trái Đất. Các hành tinh chuyển động quanh Mặt Trời theo các quỹ đạo elip gần tròn."
      ],
      paragraphsEn: [
        "The Solar System is a gravitationally bound planetary system comprising the Sun and the objects orbiting it.",
        "The Sun radiates the vital light and heat energy necessary for life on Earth."
      ],
      embedded3DModel: {
        modelType: "solar_system",
        titleVi: "Mô hình 3D Hệ Mặt Trời",
        titleEn: "3D Solar System",
        captionVi: "Mặt Trời ở trung tâm, Trái Đất và Sao Hỏa quay quanh."
      },
      bilingualTerms: [
        {
          termVi: "Hệ Mặt Trời",
          termEn: "Solar System",
          phonetics: "/ˈsəʊlə ˈsɪstəm/",
          definitionVi: "Hệ hành tinh gồm Mặt Trời và các thiên thể quay quanh.",
          definitionEn: "The collection of eight planets and their moons in orbit around the sun."
        }
      ]
    },
    {
      pageNumber: 2,
      chapterTitleVi: "Chương I: Thiên văn học & Vũ trụ",
      chapterTitleEn: "Chapter I: Astronomy & Space",
      headingVi: "Bài tập Kiểm tra Nhanh trên Trang Sách",
      headingEn: "On-Page Checkpoint Quiz",
      paragraphsVi: [
        "Hãy chọn đáp án đúng nhất để kiểm tra khả năng ghi nhớ kiến thức thiên văn học vừa học."
      ],
      paragraphsEn: [
        "Select the best answer to verify your astronomy knowledge."
      ],
      quiz: {
        id: "quiz-custom-1",
        questionVi: "Thiên thể nào nằm ở trung tâm của Hệ Mặt Trời?",
        questionEn: "Which celestial body is at the center of the Solar System?",
        optionsVi: ["Trái Đất", "Mặt Trời", "Mặt Trăng", "Sao Mộc"],
        optionsEn: ["Earth", "The Sun", "The Moon", "Jupiter"],
        correctIndex: 1,
        explanationVi: "Mặt Trời là ngôi sao ở trung tâm, chiếm 99.86% khối lượng của toàn bộ Hệ Mặt Trời.",
        explanationEn: "The Sun is at the core, holding 99.86% of the total system mass."
      }
    }
  ]);

  // Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sample lesson plans for quick 1-click generation (including KNTT curriculum)
  const handleLoadSample = (
    sampleType:
      | "water"
      | "cell"
      | "prism"
      | "magnet"
      | "dna"
      | "eclipse"
      | "nacl"
      | "archimedes"
      | "circuit"
      | "chromosome"
      | "ethene"
  ) => {
    if (sampleType === "eclipse") {
      setTitleVi("KHTN 6 (KNTT - Bài 53): Mặt Trời & Hiện Tượng Nhật Thực, Nguyệt Thực");
      setTitleEn("Natural Science 6 (KNTT): Solar & Lunar Eclipse Celestial Simulation");
      setSubject("science");
      setGrade("6");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 53 SGK Kết Nối Tri Thức: Mặt Trời và hệ Mặt Trời. Hiện tượng Nhật thực xảy ra khi Mặt Trời, Mặt Trăng và Trái Đất cùng nằm trên một đường thẳng theo thứ tự Mặt Trăng ở giữa. Vùng bóng tối Umbra trên Trái Đất quan sát được nhật thực toàn phần, vùng bóng nửa tối Penumbra quan sát được nhật thực một phần."
      );
    } else if (sampleType === "nacl") {
      setTitleVi("KHTN 7 (KNTT - Bài 10): Liên Kết Ion & Mạng Tinh Thể Muối Ăn NaCl");
      setTitleEn("Natural Science 7 (KNTT): Ionic Bonding & NaCl Crystal Lattice");
      setSubject("chemistry");
      setGrade("7");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 10 SGK Kết Nối Tri Thức: Đơn chất và hợp chất. Tinh thể muối ăn NaCl có cấu trúc mạng tinh thể lập phương vững chắc gồm các cation Na+ và anion Cl- sắp xếp xen kẽ tuần hoàn. Lực hút tĩnh điện đa hướng giữa các ion trái dấu làm cho muối ăn có nhiệt độ nóng chảy rất cao lên đến 801°C."
      );
    } else if (sampleType === "archimedes") {
      setTitleVi("KHTN 8 (KNTT - Bài 17): Lực Đẩy Archimedes & Điều Kiện Nổi Của Vật");
      setTitleEn("Natural Science 8 (KNTT): Archimedes Principle & Buoyancy Force");
      setSubject("physics");
      setGrade("8");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 17 SGK Kết Nối Tri Thức: Lực đẩy Archimedes. Một vật nhúng chìm trong chất lỏng chịu tác dụng của lực đẩy hướng thẳng đứng từ dưới lên có độ lớn FA = d . V, bằng trọng lượng chất lỏng bị chiếm chỗ. Khi lực đẩy FA cân bằng với trọng lực P, vật sẽ nổi lơ lửng hoặc nổi trên mặt thoáng."
      );
    } else if (sampleType === "circuit") {
      setTitleVi("KHTN 8 (KNTT - Bài 22): Mạch Điện Đơn Giản & Tác Dụng Phát Sáng");
      setTitleEn("Natural Science 8 (KNTT): Basic Circuit & Bulb Illumination");
      setSubject("physics");
      setGrade("8");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 22 SGK Kết Nối Tri Thức: Mạch điện đơn giản. Mạch điện kín gồm nguồn điện (pin), dây dẫn nối qua công tắc và bóng đèn dây tóc. Chiều dòng điện theo quy ước đi từ cực dương qua dây dẫn tới cực âm, ngược với chiều chuyển động của các electron tự do trong kim loại."
      );
    } else if (sampleType === "chromosome") {
      setTitleVi("Sinh Học 9 (KNTT - Bài 8): Cấu Trúc Nhiễm Sắc Thể Kép & Di Truyền");
      setTitleEn("Biology 9 (KNTT): Duplicated Chromosome & Genetics");
      setSubject("biology");
      setGrade("9");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 8 SGK Sinh học 9 Kết Nối Tri Thức: Nhiễm sắc thể. Ở kỳ giữa nguyên phân, nhiễm sắc thể kép đóng xoắn cực đại có hình chữ X đặc trưng gồm 2 chromatid dính nhau ở tâm động (centromere). Nhiễm sắc thể là bào quan lưu giữ và phân chia vật chất di truyền ADN đều về các tế bào con."
      );
    } else if (sampleType === "ethene") {
      setTitleVi("Hóa Học 9 (KNTT - Bài 37): Phân Tử Etilen C2H4 & Liên Kết Đôi");
      setTitleEn("Chemistry 9 (KNTT): Ethylene C2H4 Planar Geometry & Double Bond");
      setSubject("chemistry");
      setGrade("9");
      setTextbook("Kết Nối Tri Thức");
      setRawLessonText(
        "Bài 37 SGK Hóa học 9 Kết Nối Tri Thức: Etilen C2H4. Giữa hai nguyên tử cacbon có liên kết đôi C=C gồm 1 liên kết sigma bền và 1 liên kết pi kém bền. Toàn bộ 6 nguyên tử cùng nằm trên một mặt phẳng. Liên kết pi dễ bị bẻ gãy nên etilen tham gia phản ứng cộng làm mất màu dung dịch brom."
      );
    } else if (sampleType === "water") {
      setTitleVi("Khoa Học Tự Nhiên 7: Liên Kết Hóa Học & Phân Tử Nước H2O");
      setTitleEn("Natural Science 7: Chemical Bonding & Water Molecule (H2O)");
      setSubject("chemistry");
      setGrade("7");
      setRawLessonText(
        "Bài học về phân tử nước H2O. Nước được cấu tạo từ 2 nguyên tử Hydro liên kết với 1 nguyên tử Oxy. Góc liên kết giữa 2 nguyên tử H xấp xỉ 104.5 độ do hai cặp electron không liên kết của Oxy đẩy nhau. Nước là phân tử phân cực, có vai trò sống còn đối với mọi sinh vật trên Trái Đất."
      );
    } else if (sampleType === "cell") {
      setTitleVi("Sinh Học 6: Cấu Trúc Tế Bào Thực Vật & Quang Hợp");
      setTitleEn("Biology 6: Plant Cell Structure & Photosynthesis");
      setSubject("biology");
      setGrade("6");
      setRawLessonText(
        "Tế bào thực vật có thành tế bào bằng xenlulôzơ giúp bảo vệ và tạo hình dạng cứng cáp. Bên trong chứa không bào lớn điều hòa áp suất thẩm thấu, lục lạp chứa chất diệp lục giúp thực vật hấp thu năng lượng ánh sáng quang hợp tạo tinh bột, và nhân tế bào chứa vật chất di truyền."
      );
    } else if (sampleType === "prism") {
      setTitleVi("Vật Lý 7: Hiện Tượng Tán Sắc Ánh Sáng Qua Lăng Kính");
      setTitleEn("Physics 7: Light Dispersion Through Triangular Prism");
      setSubject("physics");
      setGrade("7");
      setRawLessonText(
        "Khi chiếu một chùm ánh sáng trắng hẹp qua lăng kính thủy tinh tam giác, chùm sáng bị khúc xạ và tán sắc thành một dải 7 màu biến thiên liên tục từ Đỏ, Cam, Vàng, Lục, Lam, Chàm đến Tím. Ánh sáng đỏ bị lệch ít nhất, ánh sáng tím bị lệch nhiều nhất do chiết suất khác nhau."
      );
    } else if (sampleType === "magnet") {
      setTitleVi("Vật Lý 8: Từ Trường Của Nam Châm Thẳng & Đường Sức Từ");
      setTitleEn("Physics 8: Bar Magnet Magnetic Field & Field Lines");
      setSubject("physics");
      setGrade("8");
      setRawLessonText(
        "Xung quanh nam châm có từ trường. Quy ước chiều của đường sức từ ở bên ngoài nam châm là đi ra từ cực Bắc (N) và đi vào cực Nam (S). Nơi nào từ trường mạnh hơn thì các đường sức từ mau (dày) hơn, nơi nào từ trường yếu hơn thì các đường sức từ thưa hơn."
      );
    } else {
      setTitleVi("Sinh Học 9: Cấu Trúc Chuỗi Xoắn Kép Phân Tử ADN");
      setTitleEn("Biology 9: DNA Double Helix Watson-Crick Structure");
      setSubject("biology");
      setGrade("9");
      setRawLessonText(
        "Phân tử ADN có cấu trúc chuỗi xoắn kép gồm hai mạch polynucleotide song song ngược chiều. Các bazơ nitơ ở hai mạch liên kết với nhau theo nguyên tắc bổ sung bằng liên kết hydro: Adenin (A) liên kết với Timin (T) bằng 2 liên kết hydro, Guanin (G) liên kết với Xitozin (X) bằng 3 liên kết hydro."
      );
    }
  };

  // AI Auto-generator simulation
  const handleGenerateWithAI = () => {
    if (!rawLessonText.trim()) return;

    setIsAiGenerating(true);

    setTimeout(() => {
      const lower = rawLessonText.toLowerCase();

      let detectedModel: NonNullable<FlipbookPage["embedded3DModel"]>["modelType"] = "atom";

      if (lower.includes("nhật thực") || lower.includes("nguyệt thực") || lower.includes("umbra") || lower.includes("bóng tối")) {
        detectedModel = "solar_eclipse";
      } else if (lower.includes("nacl") || lower.includes("muối ăn") || lower.includes("natri clorua") || lower.includes("tinh thể ion")) {
        detectedModel = "crystal_nacl";
      } else if (lower.includes("archimedes") || lower.includes("ác-si-mét") || lower.includes("lực đẩy") || lower.includes("sự nổi")) {
        detectedModel = "archimedes_buoyancy";
      } else if (lower.includes("mạch điện") || lower.includes("bóng đèn") || lower.includes("nguồn pin") || lower.includes("dây tóc")) {
        detectedModel = "electric_circuit";
      } else if (lower.includes("nhiễm sắc thể") || lower.includes("nst") || lower.includes("cromatit") || lower.includes("chromatid") || lower.includes("tâm động")) {
        detectedModel = "chromosome";
      } else if (lower.includes("etilen") || lower.includes("ethene") || lower.includes("c2h4") || lower.includes("liên kết đôi")) {
        detectedModel = "molecule_ethene";
      } else if (lower.includes("nước") || lower.includes("h2o")) {
        detectedModel = "molecule_h2o";
      } else if (lower.includes("tế bào") || lower.includes("quang hợp") || lower.includes("lục lạp")) {
        detectedModel = "plant_cell";
      } else if (lower.includes("lăng kính") || lower.includes("tán sắc") || lower.includes("quang phổ") || lower.includes("cầu vồng")) {
        detectedModel = "light_prism";
      } else if (lower.includes("nam châm") || lower.includes("đường sức từ") || lower.includes("cực bắc")) {
        detectedModel = "magnetic_field";
      } else if (lower.includes("metan") || lower.includes("mêtan") || lower.includes("ch4") || lower.includes("tứ diện")) {
        detectedModel = "molecule_methane";
      } else if (lower.includes("trái đất") || lower.includes("manti") || lower.includes("vỏ trái đất") || lower.includes("địa chất")) {
        detectedModel = "earth_layers";
      } else if (lower.includes("trạng thái") || lower.includes("rắn") || lower.includes("lỏng") || lower.includes("khí")) {
        detectedModel = "states_of_matter";
      } else if (lower.includes("từ trường") || lower.includes("cuộn dây") || lower.includes("torus")) {
        detectedModel = "torus";
      } else if (lower.includes("dna") || lower.includes("di truyền") || lower.includes("adn")) {
        detectedModel = "dna";
      } else if (lower.includes("mặt trời") || lower.includes("hành tinh") || lower.includes("vũ trụ")) {
        detectedModel = "solar_system";
      }


      const generatedPages: FlipbookPage[] = [
        {
          pageNumber: 1,
          chapterTitleVi: `Chương I: ${titleVi}`,
          chapterTitleEn: `Chapter I: ${titleEn}`,
          headingVi: "Phần 1: Khái Niệm Cốt Lõi & Kiến Thức Trọng Tâm",
          headingEn: "Part 1: Core Concepts & Principles",
          subHeadingVi: "Bóc tách nội dung giáo án tự động bởi Nora AI",
          subHeadingEn: "Automated lesson breakdown by Nora AI",
          paragraphsVi: [
            rawLessonText,
            "Kiến thức trên được chuẩn hóa theo chương trình Giáo dục Phổ thông 2018, giúp học sinh tiếp cận bài học qua phương pháp trực quan sinh động."
          ],
          paragraphsEn: [
            "This content is structured to align with the K-9 STEM competency-based curriculum, fostering intuitive comprehension through interactive 3D elements."
          ],
          calloutVi: "💡 Lời khuyên giáo viên: Hãy hướng dẫn học sinh quan sát mô hình 3D ở trang kế tiếp để khắc sâu biểu tượng không gian trước khi làm bài tập.",
          calloutEn: "💡 Teaching Tip: Instruct learners to rotate the 3D model on the next page to solidify mental spatial representations.",
          bilingualTerms: [
            {
              termVi: "Thuật ngữ trọng tâm",
              termEn: "Key Scientific Concept",
              phonetics: "/kiː ˌsaɪənˈtɪfɪk ˈkɒnsept/",
              definitionVi: "Khái niệm khoa học then chốt được giảng dạy trong tiết học này.",
              definitionEn: "The essential scientific principle introduced in this section."
            }
          ]
        },
        {
          pageNumber: 2,
          chapterTitleVi: `Chương I: ${titleVi}`,
          chapterTitleEn: `Chapter I: ${titleEn}`,
          headingVi: "Phần 2: Quan Sát Mô Hình 3D Thời Gian Thực",
          headingEn: "Part 2: Interactive 3D Model Exploration",
          subHeadingVi: "Tương tác ba chiều trực tiếp ngay trên trang sách",
          subHeadingEn: "Real-time 3D spatial viewport embedded on book page",
          paragraphsVi: [
            "Dưới đây là mô hình 3D do Nora AI tự động liên kết phù hợp với chủ đề bài học. Học sinh có thể dùng chuột hoặc cảm ứng để xoay 360 độ, phóng to các chi tiết cấu trúc.",
            "Việc kết hợp đọc sách và tương tác ba chiều giúp tăng khả năng ghi nhớ kiến thức lên tới 75% so với đọc tài liệu tĩnh truyền thống."
          ],
          paragraphsEn: [
            "Below is the real-time 3D model automatically paired with this lesson topic. Rotate, zoom, and inspect internal components directly on the page.",
            "Interactive multi-sensory textbooks significantly enhance spatial memory retention."
          ],
          embedded3DModel: {
            modelType: detectedModel,
            titleVi: `Mô hình 3D: ${titleVi}`,
            titleEn: `3D Model: ${titleEn}`,
            captionVi: "Mô hình 3D tương tác bám sát nội dung bài giảng vừa nhập."
          }
        },
        {
          pageNumber: 3,
          chapterTitleVi: `Chương I: ${titleVi}`,
          chapterTitleEn: `Chapter I: ${titleEn}`,
          headingVi: "Phần 3: Bài Tập Trắc Nghiệm Đánh Giá Năng Lực",
          headingEn: "Part 3: Competency Checkpoint Quiz",
          paragraphsVi: [
            "Học sinh hoàn thành câu hỏi kiểm tra nhanh để củng cố kiến thức ngay trên trang sách số."
          ],
          paragraphsEn: [
            "Complete this quick checkpoint quiz to verify your understanding."
          ],
          quiz: {
            id: `quiz-ai-${Date.now()}`,
            questionVi: `Đặc điểm cốt lõi nào sau đây thể hiện đúng kiến thức của bài học "${titleVi}"?`,
            questionEn: `Which of the following statements accurately characterizes this topic?`,
            optionsVi: [
              "Đặc điểm được mô tả chính xác trong phần mô hình 3D",
              "Hiện tượng hoàn toàn không tồn tại trong tự nhiên",
              "Khái niệm chỉ áp dụng ở nhiệt độ phòng",
              "Tất cả các phát biểu trên đều sai"
            ],
            optionsEn: [
              "The characteristics showcased in the 3D model",
              "Phenomenon non-existent in nature",
              "Only applicable at room temperature",
              "All of the above are false"
            ],
            correctIndex: 0,
            explanationVi: "Đáp án A chính xác! Học sinh đã quan sát đúng bản chất hiện tượng qua mô hình 3D tương tác.",
            explanationEn: "Option A is correct based on the active 3D spatial observation."
          }
        }
      ];

      setPages(generatedPages);
      setIsAiGenerating(false);
    }, 1200);
  };

  // PDF Uploader handler
  const handlePdfUpload = (file: File) => {
    setUploadedFile(file);
    setIsProcessingPdf(true);

    setTimeout(() => {
      // Create pages from uploaded file
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      setTitleVi(cleanFileName);
      setTitleEn(cleanFileName);

      const pdfPages: FlipbookPage[] = [
        {
          pageNumber: 1,
          chapterTitleVi: "Tài liệu PDF: " + cleanFileName,
          chapterTitleEn: "PDF Document: " + cleanFileName,
          headingVi: "Trang 1: Nội Dung Tổng Quan Bài Giảng",
          headingEn: "Page 1: Document Overview",
          paragraphsVi: [
            `Tài liệu "${file.name}" đã được tải lên thành công vào hệ thống Smart Explorer.`,
            `Dung lượng file: ${(file.size / 1024 / 1024).toFixed(2)} MB. Hệ thống đã tối ưu hóa văn bản và chuyển đổi thành giao diện sách lật trang 3D.`
          ],
          paragraphsEn: [
            `Document "${file.name}" has been successfully imported into Smart Explorer.`,
            `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB.`
          ],
          calloutVi: "💡 Bạn có thể gắn thêm mô hình 3D hoặc câu hỏi trắc nghiệm vào cuốn sách này ở các trang kế tiếp.",
          calloutEn: "💡 You can customize embedded 3D models and checkpoint questions for any page."
        },
        {
          pageNumber: 2,
          chapterTitleVi: "Tài liệu PDF: " + cleanFileName,
          chapterTitleEn: "PDF Document: " + cleanFileName,
          headingVi: "Trang 2: Không Gian Trực Quan 3D Kèm Theo",
          headingEn: "Page 2: Accompanying 3D Visualizer",
          paragraphsVi: [
            "Hệ thống đã tự động liên kết mô hình 3D tương tác hỗ trợ học sinh thực hành trực quan song song với việc đọc tài liệu giáo trình."
          ],
          paragraphsEn: [
            "Interactive 3D model paired to enhance visual engagement during textbook reading."
          ],
          embedded3DModel: {
            modelType: "atom",
            titleVi: "Mô hình 3D trực quan hóa",
            titleEn: "3D Visualizer",
            captionVi: "Mô hình tương tác xoay 360 độ trên trang sách."
          }
        }
      ];

      setPages(pdfPages);
      setIsProcessingPdf(false);
    }, 1000);
  };

  // Add a blank page manually
  const handleAddPage = () => {
    const nextNum = pages.length + 1;
    const newPage: FlipbookPage = {
      pageNumber: nextNum,
      chapterTitleVi: "Chương I: Bài học mới",
      chapterTitleEn: "Chapter I: New Lesson",
      headingVi: `Trang ${nextNum}: Tiêu đề bài học`,
      headingEn: `Page ${nextNum}: Lesson Heading`,
      paragraphsVi: [
        "Nhập nội dung kiến thức bài học tiếng Việt tại đây..."
      ],
      paragraphsEn: [
        "Enter English lesson content here..."
      ]
    };
    setPages((prev) => [...prev, newPage]);
  };

  // Remove a page
  const handleRemovePage = (pageNum: number) => {
    if (pages.length <= 1) return;
    setPages((prev) =>
      prev
        .filter((p) => p.pageNumber !== pageNum)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
    );
  };

  // Save book to local storage and open it
  const handleSaveAndPublish = () => {
    const newBook: FlipbookBook = {
      id: `fb-user-${Date.now()}`,
      slug: titleVi.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      titleVi,
      titleEn,
      subject,
      subjectLabelVi:
        subject === "chemistry"
          ? "Hóa học"
          : subject === "physics"
            ? "Vật lý"
            : subject === "biology"
              ? "Sinh học"
              : subject === "math"
                ? "Toán học"
                : "Khoa học tự nhiên",
      subjectLabelEn: subject,
      grade,
      textbook,
      author,
      publisher: "Smart Explorer Digital Press",
      coverGradient,
      accentColor: "blue",
      descriptionVi: `Sách tương tác 3D "${titleVi}" gồm ${pages.length} trang, tích hợp mô hình không gian và câu hỏi trắc nghiệm tự chấm điểm.`,
      descriptionEn: `Interactive 3D digital book with ${pages.length} pages, embedded 3D models and quizzes.`,
      rating: 5.0,
      readCount: 1,
      pages,
    };

    saveUserBook(newBook);
    router.push(`/books/${newBook.id}`);
  };

  // Dummy book object for live preview
  const previewBook: FlipbookBook = {
    id: "preview-temp",
    slug: "preview-temp",
    titleVi,
    titleEn,
    subject,
    subjectLabelVi: "Môn học",
    subjectLabelEn: "Subject",
    grade,
    textbook,
    author,
    publisher: "Smart Explorer Preview",
    coverGradient,
    accentColor: "blue",
    descriptionVi: "Bản xem trước sách tương tác lật trang 3D",
    descriptionEn: "Preview copy of interactive 3D flipbook",
    rating: 5.0,
    readCount: 0,
    pages,
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-[#070b16] text-neutral-900 dark:text-neutral-100 pt-24 pb-20 transition-colors">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Kệ sách</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsPreviewOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              <span>Đọc thử 3D ({pages.length} trang)</span>
            </Button>

            <Button
              onClick={handleSaveAndPublish}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Lưu & Đọc Sách Ngay</span>
            </Button>
          </div>
        </div>

        {/* Hero title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 dark:border-blue-800/60 dark:bg-blue-950/50 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trình Tạo Sách Tương Tác Số & Tải Tài Liệu (Flipbook Studio)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Tạo & Tải Sách Giáo Trình Lật Trang 3D
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Dễ dàng chuyển đổi file PDF bài giảng, hoặc dán nội dung giáo án để Trợ lý Nora AI tự động bóc tách thành sách lật 3D kèm mô hình không gian và trắc nghiệm.
          </p>
        </div>

        {/* 3 Creation Mode Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-neutral-200/70 dark:bg-neutral-900 mb-8">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "ai"
                ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Bot className="h-4 w-4 text-cyan-500" />
            <span>🤖 Nora AI Tự Động Tạo Từ Giáo Án</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "upload"
                ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            <span>📄 Tải File PDF / Tài Liệu Lên</span>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "manual"
                ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4 text-purple-500" />
            <span>✍️ Soạn Thảo Trang Thủ Công</span>
          </button>
        </div>

        {/* Tab 1: AI Auto-generator */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Nora AI Tự Động Phân Tích & Sinh Sách Tương Tác 3D</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Dán nội dung bài học hoặc giáo án vào khung bên dưới. Trợ lý AI sẽ tự động phân trang, phát hiện mô hình 3D phù hợp và tạo câu hỏi trắc nghiệm!
                  </p>
                </div>

                {/* 1-click sample buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400 mr-1 hidden sm:inline">Mẫu KNTT:</span>
                  <button
                    onClick={() => handleLoadSample("eclipse")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Nhật thực (KNTT 6)
                  </button>
                  <button
                    onClick={() => handleLoadSample("nacl")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Muối ăn NaCl (KNTT 7)
                  </button>
                  <button
                    onClick={() => handleLoadSample("archimedes")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Archimedes (KNTT 8)
                  </button>
                  <button
                    onClick={() => handleLoadSample("circuit")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Mạch điện (KNTT 8)
                  </button>
                  <button
                    onClick={() => handleLoadSample("chromosome")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Nhiễm sắc thể (KNTT 9)
                  </button>
                  <button
                    onClick={() => handleLoadSample("ethene")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold hover:scale-105 transition-all"
                  >
                    Etilen C2H4 (KNTT 9)
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                rows={6}
                value={rawLessonText}
                onChange={(e) => setRawLessonText(e.target.value)}
                placeholder="Dán nội dung giáo án hoặc tóm tắt bài giảng tại đây... (Ví dụ: Bài học về cấu trúc phân tử nước, các liên kết cộng hóa trị và tính phân cực...)"
                className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-500">
                  {rawLessonText.length} ký tự
                </span>

                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isAiGenerating || !rawLessonText.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold gap-2 px-6 h-10 shadow-md shadow-blue-500/20"
                >
                  {isAiGenerating ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Nora AI đang bóc tách giáo án...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-cyan-300" />
                      <span>Tự Động Sinh Sách 3D Ngay</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Upload PDF */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Upload className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Kéo thả file PDF tài liệu giáo trình vào đây
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Hỗ trợ file tài liệu PDF, bài giảng giáo án (tối đa 50MB). Hệ thống sẽ tự động tách trang và biến thành sách lật 3D tương tác.
                </p>
              </div>

              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all">
                  <FileText className="h-4 w-4" />
                  <span>Chọn file PDF từ máy tính</span>
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfUpload(file);
                  }}
                  className="hidden"
                />
              </label>

              {isProcessingPdf && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl">
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý và chuyển đổi các trang PDF sang Flipbook 3D...</span>
                </div>
              )}

              {uploadedFile && !isProcessingPdf && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã chuyển đổi thành công: {uploadedFile.name} ({pages.length} trang)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3 & Shared: Basic Book Metadata & Page List Editor */}
        <div className="mt-8 space-y-6">
          <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-500" />
              <span>Thông Tin Chung Cuốn Sách</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tên sách (Tiếng Việt):
                </label>
                <input
                  type="text"
                  value={titleVi}
                  onChange={(e) => setTitleVi(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tên sách (Tiếng Anh song ngữ):
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Môn học:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium"
                  >
                    <option value="science">Khoa học tự nhiên</option>
                    <option value="chemistry">Hóa học</option>
                    <option value="physics">Vật lý</option>
                    <option value="biology">Sinh học</option>
                    <option value="math">Toán học</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Khối lớp:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium"
                  >
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Bộ sách giáo khoa:
                  </label>
                  <select
                    value={textbook}
                    onChange={(e) => setTextbook(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium"
                  >
                    <option value="Kết Nối Tri Thức">Kết Nối Tri Thức</option>
                    <option value="Cánh Diều">Cánh Diều</option>
                    <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pages Overview & Customizer */}
          <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  <span>Danh Sách Trang Sách Đã Tạo ({pages.length} trang)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mỗi trang đều có thể nhúng mô hình 3D xoay 360 độ hoặc bài tập trắc nghiệm tự chấm điểm.
                </p>
              </div>

              <Button
                onClick={handleAddPage}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Trang Mới</span>
              </Button>
            </div>

            {/* List of pages */}
            <div className="space-y-3">
              {pages.map((p, idx) => (
                <div
                  key={p.pageNumber}
                  className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                        {p.pageNumber}
                      </span>
                      <input
                        type="text"
                        value={p.headingVi}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPages((prev) =>
                            prev.map((item) =>
                              item.pageNumber === p.pageNumber
                                ? { ...item, headingVi: val }
                                : item
                            )
                          );
                        }}
                        className="font-bold text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {p.embedded3DModel && (
                        <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
                          3D: {p.embedded3DModel.modelType}
                        </Badge>
                      )}
                      {p.quiz && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                          Trắc nghiệm
                        </Badge>
                      )}
                      <button
                        onClick={() => handleRemovePage(p.pageNumber)}
                        disabled={pages.length <= 1}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 disabled:opacity-20"
                        title="Xóa trang này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Paragraph text */}
                  <textarea
                    rows={2}
                    value={p.paragraphsVi.join("\n")}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      setPages((prev) =>
                        prev.map((item) =>
                          item.pageNumber === p.pageNumber
                            ? { ...item, paragraphsVi: lines }
                            : item
                        )
                      );
                    }}
                    placeholder="Nội dung trang sách..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
                  />

                  {/* 3D Model Attachment Selector */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-neutral-500 text-[11px]">Nhúng Mô Hình 3D:</span>
                    <select
                      value={p.embedded3DModel?.modelType || "none"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((item) => {
                            if (item.pageNumber !== p.pageNumber) return item;
                            if (val === "none") {
                              const { embedded3DModel, ...rest } = item;
                              return rest;
                            }
                            return {
                              ...item,
                              embedded3DModel: {
                                modelType: val as any,
                                titleVi: `Mô hình 3D ${val}`,
                                titleEn: `3D Model ${val}`,
                                captionVi: "Mô hình xoay 360 độ tương tác",
                              },
                            };
                          })
                        );
                      }}
                      className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                    >
                      <option value="none">Không nhúng 3D</option>
                      <optgroup label="Bộ Sách Kết Nối Tri Thức (KNTT)">
                        <option value="solar_eclipse">KHTN 6 (Bài 53): Nhật thực & Nguyệt thực (Bóng tối Umbra/Penumbra)</option>
                        <option value="crystal_nacl">KHTN 7 (Bài 10): Mạng tinh thể ion Muối ăn NaCl</option>
                        <option value="archimedes_buoyancy">KHTN 8 (Bài 17): Lực đẩy Archimedes & Sự nổi</option>
                        <option value="electric_circuit">KHTN 8 (Bài 22): Mạch điện kín & Dòng điện thắp sáng đèn</option>
                        <option value="chromosome">Sinh học 9 (Bài 8): Nhiễm sắc thể kép chữ X & Tâm động</option>
                        <option value="molecule_ethene">Hóa học 9 (Bài 37): Phân tử Etilen C2H4 & Liên kết đôi</option>
                      </optgroup>
                      <optgroup label="Khoa Học Tự Nhiên & Toán Học K12">
                        <option value="plant_cell">Tế bào Thực vật Quang hợp (Sinh 6)</option>
                        <option value="earth_layers">Cấu tạo Trái Đất & Lõi Magma (Địa 6)</option>
                        <option value="states_of_matter">3 Trạng thái Rắn - Lỏng - Khí (KHTN 6)</option>
                        <option value="solar_system">Hệ Mặt Trời & Quỹ đạo Hành tinh (KHTN 6)</option>
                        <option value="atom">Nguyên tử Rutherford-Bohr (Hóa 7)</option>
                        <option value="molecule_h2o">Phân tử Nước H2O (Hóa 7)</option>
                        <option value="light_prism">Tán sắc Ánh sáng qua Lăng kính (Lý 7)</option>
                        <option value="magnetic_field">Từ trường Nam châm thẳng & Đường sức từ (Lý 8)</option>
                        <option value="molecule_methane">Phân tử Mêtan CH4 Tứ diện đều (Hóa 8)</option>
                        <option value="icosahedron">Khối 20 mặt đều Platonic (Toán 8)</option>
                        <option value="dna">Chuỗi xoắn kép ADN Watson-Crick (Sinh 9)</option>
                        <option value="torus">Cuộn dây Từ trường Torus (Lý 9)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 text-white">
                <span className="text-sm font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span>Đang xem thử bản lật trang 3D thời gian thực</span>
                </span>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold"
                >
                  Đóng xem thử
                </button>
              </div>

              <div className="flex-1 overflow-hidden rounded-3xl border border-neutral-800">
                <FlipbookReader book={previewBook} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
