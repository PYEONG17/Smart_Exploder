/**
 * ==============================================================================
 * SMART EXPLORER - THƯ VIỆN SÁCH TƯƠNG TÁC (FLIPBOOK DATA CONFIG)
 * ==============================================================================
 * 
 * CẤU TRÚC DỮ LIỆU SÁCH LẬT TRANG SỐ (FLIPBOOK):
 * - Bám sát chương trình GDPT 2018 (Kết Nối Tri Thức, Cánh Diều, Chân Trời Sáng Tạo).
 * - Tích hợp song ngữ Anh - Việt, âm thanh phát âm bản xứ, mô hình 3D nhúng và câu hỏi trắc nghiệm ngay trên trang sách.
 * - Bạn có thể dễ dàng thêm sách mới hoặc thêm trang bằng cách thêm object vào mảng FLIPBOOKS_DATA.
 */

export interface FlipbookTerm {
  termVi: string;
  termEn: string;
  phonetics?: string;
  definitionVi: string;
  definitionEn: string;
}

export interface FlipbookQuiz {
  id: string;
  questionVi: string;
  questionEn: string;
  optionsVi: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationVi: string;
  explanationEn: string;
}

export interface FlipbookPage {
  pageNumber: number;
  chapterTitleVi: string;
  chapterTitleEn: string;
  headingVi: string;
  headingEn: string;
  subHeadingVi?: string;
  subHeadingEn?: string;
  paragraphsVi: string[];
  paragraphsEn: string[];
  calloutVi?: string;
  calloutEn?: string;
  bilingualTerms?: FlipbookTerm[];
  embedded3DModel?: {
    modelType:
      | "atom"
      | "solar_system"
      | "dna"
      | "icosahedron"
      | "molecule_h2o"
      | "plant_cell"
      | "torus"
      | "sphere"
      | "earth_layers"
      | "light_prism"
      | "magnetic_field"
      | "molecule_methane"
      | "states_of_matter"
      | "crystal_nacl"
      | "solar_eclipse"
      | "archimedes_buoyancy"
      | "electric_circuit"
      | "chromosome"
      | "molecule_ethene";
    titleVi: string;
    titleEn: string;
    captionVi: string;
  };


  quiz?: FlipbookQuiz;
  audioNarrationText?: string;
}

export interface FlipbookBook {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string;
  subject: "math" | "science" | "physics" | "chemistry" | "biology";
  subjectLabelVi: string;
  subjectLabelEn: string;
  grade: "6" | "7" | "8" | "9";
  textbook: "Kết Nối Tri Thức" | "Cánh Diều" | "Chân Trời Sáng Tạo";
  author: string;
  publisher: string;
  coverGradient: string;
  accentColor: string;
  descriptionVi: string;
  descriptionEn: string;
  rating: number;
  readCount: number;
  pages: FlipbookPage[];
}

export const FLIPBOOKS_DATA: FlipbookBook[] = [
  {
    id: "fb-chem-7",
    slug: "nguyen-tu-va-bang-tuan-hoan-hoa-hoc-7",
    titleVi: "Khoa Học Tự Nhiên 7: Nguyên Tử & Bảng Tuần Hoàn",
    titleEn: "Natural Sciences 7: Atoms & The Periodic Table",
    subject: "chemistry",
    subjectLabelVi: "Hóa học",
    subjectLabelEn: "Chemistry",
    grade: "7",
    textbook: "Kết Nối Tri Thức",
    author: "GS.TS. Vũ Văn Hùng (Tổng Chủ biên) & Nora Team",
    publisher: "NXB Giáo Dục Việt Nam & Smart Explorer",
    coverGradient: "from-blue-600 via-indigo-600 to-cyan-500",
    accentColor: "blue",
    descriptionVi: "Sách tương tác 3D tìm hiểu cấu tạo nguyên tử, mô hình Rutherford - Bohr, hạt nhân, vỏ electron và nguyên tắc sắp xếp các nguyên tố hóa học.",
    descriptionEn: "Interactive 3D digital textbook on atomic structure, Bohr model, electron orbits, and the organization of chemical elements.",
    rating: 4.95,
    readCount: 2450,
    pages: [
      {
        pageNumber: 1,
        chapterTitleVi: "Chương I: Nguyên tử - Nguyên tố Hóa học",
        chapterTitleEn: "Chapter I: Atoms & Chemical Elements",
        headingVi: "Bài 1: Sơ lược về Cấu trúc Nguyên tử",
        headingEn: "Lesson 1: Introduction to Atomic Structure",
        subHeadingVi: "Khái niệm mở đầu và mô hình Rutherford - Bohr",
        subHeadingEn: "Introductory concepts and the Rutherford - Bohr model",
        paragraphsVi: [
          "Tất cả các chất xung quanh chúng ta như nước, không khí, bàn ghế, cơ thể sinh vật đều được tạo nên từ những hạt vô cùng nhỏ bé gọi là nguyên tử.",
          "Nguyên tử có kích thước vô cùng nhỏ, khoảng một phần mười tỉ mét (10⁻¹⁰ m). Nếu phóng to một nguyên tử lên bằng kích thước quả bóng đá thì kích thước của nó gấp hàng triệu lần ban đầu.",
          "Năm 1913, nhà vật lý Niels Bohr đã hoàn thiện mô hình nguyên tử của Ernest Rutherford: Nguyên tử có cấu tạo rỗng, gồm hạt nhân ở tâm mang điện tích dương và các electron mang điện tích âm quay xung quanh theo các quỹ đạo tròn hoặc elip xác định."
        ],
        paragraphsEn: [
          "All matter surrounding us—water, air, living organisms—is composed of extremely minuscule particles called atoms.",
          "Atoms are unimaginably small, on the order of 10⁻¹⁰ meters in diameter.",
          "In 1913, Niels Bohr refined Rutherford's atomic model: An atom consists largely of empty space, with a central positively charged nucleus and negative electrons orbiting in discrete energy levels."
        ],
        calloutVi: "💡 Điểm cốt lõi: Nguyên tử trung hòa về điện vì số proton mang điện dương trong hạt nhân bằng đúng số electron mang điện âm ở lớp vỏ.",
        calloutEn: "💡 Core Concept: An atom is electrically neutral because the number of positive protons matches the number of negative electrons.",
        bilingualTerms: [
          {
            termVi: "Nguyên tử",
            termEn: "Atom",
            phonetics: "/ˈætəm/",
            definitionVi: "Hạt vô cùng nhỏ, trung hòa về điện, cấu tạo nên các chất.",
            definitionEn: "The basic unit of a chemical element, consisting of a nucleus and electrons."
          },
          {
            termVi: "Hạt nhân",
            termEn: "Nucleus",
            phonetics: "/ˈnjuːkliəs/",
            definitionVi: "Phần trung tâm của nguyên tử mang điện tích dương.",
            definitionEn: "The positively charged central core of an atom."
          }
        ],
        audioNarrationText: "Tất cả các chất xung quanh chúng ta đều được tạo nên từ các hạt vô cùng nhỏ bé gọi là nguyên tử. Nguyên tử gồm hạt nhân ở tâm và các electron quay xung quanh."
      },
      {
        pageNumber: 2,
        chapterTitleVi: "Chương I: Nguyên tử - Nguyên tố Hóa học",
        chapterTitleEn: "Chapter I: Atoms & Chemical Elements",
        headingVi: "Quan sát Mô hình Không gian 3D của Nguyên tử",
        headingEn: "3D Spatial Visualization of Atomic Model",
        subHeadingVi: "Tương tác ba chiều với mô hình Rutherford - Bohr",
        subHeadingEn: "Interactive 3D Rutherford - Bohr orbit demonstration",
        paragraphsVi: [
          "Bên dưới là mô hình 3D động của nguyên tử. Bạn có thể dùng chuột hoặc ngón tay để xoay 360°, quan sát hạt nhân ở giữa và các electron màu xanh lam lấp lánh đang chuyển động trên các quỹ đạo năng lượng.",
          "Mỗi lớp vỏ electron chỉ có thể chứa tối đa một số lượng electron nhất định: Lớp thứ nhất (gần hạt nhân nhất) chứa tối đa 2 electron, lớp thứ hai chứa tối đa 8 electron."
        ],
        paragraphsEn: [
          "Below is an active 3D model of an atom. You can manipulate the viewport to rotate 360°, inspecting the core nucleus and revolving electron shells.",
          "Each electron shell can accommodate a maximum capacity of electrons: 2 in the first shell and up to 8 in the second shell."
        ],
        embedded3DModel: {
          modelType: "atom",
          titleVi: "Mô hình 3D Nguyên tử Rutherford - Bohr",
          titleEn: "3D Rutherford - Bohr Atom Model",
          captionVi: "Hạt nhân màu đỏ ở giữa, các electron quay quanh theo 3 quỹ đạo elip."
        },
        bilingualTerms: [
          {
            termVi: "Lớp electron",
            termEn: "Electron shell",
            phonetics: "/ɪˈlektrɒn ʃel/",
            definitionVi: "Tập hợp các electron có mức năng lượng gần bằng nhau.",
            definitionEn: "An orbit followed by electrons around an atom's nucleus."
          }
        ],
        audioNarrationText: "Mời các bạn quan sát mô hình ba chiều của nguyên tử. Hạt nhân nằm tại tâm, các electron chuyển động rất nhanh trên các lớp vỏ."
      },
      {
        pageNumber: 3,
        chapterTitleVi: "Chương I: Nguyên tử - Nguyên tố Hóa học",
        chapterTitleEn: "Chapter I: Atoms & Chemical Elements",
        headingVi: "Các loại Hạt Hạ nguyên tử: Proton, Neutron & Electron",
        headingEn: "Subatomic Particles: Protons, Neutrons & Electrons",
        subHeadingVi: "Khối lượng và điện tích của các hạt cấu tạo",
        subHeadingEn: "Mass and electric charges of constituent particles",
        paragraphsVi: [
          "Hạt nhân được cấu tạo từ hai loại hạt: Proton (kí hiệu là p) mang điện tích +1, và Neutron (kí hiệu là n) không mang điện tích.",
          "Vỏ nguyên tử gồm các hạt Electron (kí hiệu là e) mang điện tích -1. Khối lượng của electron rất nhỏ, chỉ bằng khoảng 1/1836 khối lượng của một proton.",
          "Do khối lượng electron không đáng kể, khối lượng của toàn bộ nguyên tử hầu như tập trung hoàn toàn tại hạt nhân: m(nguyên tử) ≈ m(hạt nhân) = m(p) + m(n)."
        ],
        paragraphsEn: [
          "The nucleus consists of Protons (symbol p) carrying a +1 charge and Neutrons (symbol n) with no charge.",
          "The outer cloud comprises Electrons (symbol e) carrying a -1 charge, weighing approximately 1/1836 of a proton.",
          "Because electron mass is negligible, the total mass of an atom is almost entirely concentrated in the nucleus."
        ],
        calloutVi: "Công thức cần nhớ: Điện tích hạt nhân = +Z (với Z là số proton). Số electron = Số proton = Z.",
        calloutEn: "Key Formula: Nuclear charge = +Z (where Z is the number of protons). Number of electrons = Number of protons = Z.",
        bilingualTerms: [
          {
            termVi: "Proton",
            termEn: "Proton",
            phonetics: "/ˈprəʊtɒn/",
            definitionVi: "Hạt mang điện tích dương nằm trong hạt nhân nguyên tử.",
            definitionEn: "A stable subatomic particle occurring in all atomic nuclei, with a positive electric charge."
          },
          {
            termVi: "Neutron",
            termEn: "Neutron",
            phonetics: "/ˈnjuːtrɒn/",
            definitionVi: "Hạt không mang điện nằm trong hạt nhân nguyên tử.",
            definitionEn: "A subatomic particle of about the same mass as a proton but without an electric charge."
          }
        ],
        audioNarrationText: "Hạt nhân gồm proton mang điện tích dương và neutron không mang điện. Khối lượng của electron rất nhỏ so với khối lượng hạt nhân."
      },
      {
        pageNumber: 4,
        chapterTitleVi: "Chương I: Nguyên tử - Nguyên tố Hóa học",
        chapterTitleEn: "Chapter I: Atoms & Chemical Elements",
        headingVi: "Bài tập Tự kiểm tra Nhanh trên Trang Sách",
        headingEn: "Self-Assessment Checkpoint on Page",
        subHeadingVi: "Củng cố kiến thức về nguyên tử và hạt nhân",
        subHeadingEn: "Reinforce understanding of atomic structure",
        paragraphsVi: [
          "Hãy hoàn thành câu hỏi trắc nghiệm dưới đây để kiểm tra mức độ hiểu bài của bạn ngay trên trang sách tương tác.",
          "Sau khi chọn đáp án, hệ thống sẽ tự động chấm điểm và hiển thị lời giải thích chi tiết giúp bạn ghi nhớ sâu kiến thức."
        ],
        paragraphsEn: [
          "Complete the multiple-choice question below to self-evaluate your comprehension directly on this flipbook page.",
          "Instant feedback and comprehensive explanations will be displayed right after your selection."
        ],
        quiz: {
          id: "q-fb-chem-1",
          questionVi: "Trong nguyên tử, hạt nào mang điện tích âm và chuyển động quanh hạt nhân?",
          questionEn: "In an atom, which particle carries a negative electric charge and orbits the nucleus?",
          optionsVi: [
            "Proton",
            "Neutron",
            "Electron",
            "Hạt nhân"
          ],
          optionsEn: [
            "Proton",
            "Neutron",
            "Electron",
            "Nucleus"
          ],
          correctIndex: 2,
          explanationVi: "Chính xác! Electron mang điện tích âm (-1) và chuyển động xung quanh hạt nhân. Proton mang điện tích dương (+1) và neutron không mang điện.",
          explanationEn: "Correct! Electrons carry a -1 negative charge and orbit the nucleus. Protons are positive and neutrons are neutral."
        },
        audioNarrationText: "Hãy chọn đáp án đúng cho câu hỏi: Trong nguyên tử, hạt nào mang điện tích âm và chuyển động quanh hạt nhân?"
      }
    ]
  },
  {
    id: "fb-math-8",
    slug: "hinh-hoc-khong-gian-va-da-dien-deu-toan-8",
    titleVi: "Toán Học 8: Hình Học Không Gian & Khối Đa Diện Đều",
    titleEn: "Mathematics 8: Spatial Geometry & Regular Polyhedra",
    subject: "math",
    subjectLabelVi: "Toán học",
    subjectLabelEn: "Mathematics",
    grade: "8",
    textbook: "Cánh Diều",
    author: "GS.TSKH. Đỗ Đức Thái & Nhóm tác giả",
    publisher: "NXB Đại Học Sư Phạm & Smart Explorer",
    coverGradient: "from-purple-600 via-indigo-600 to-pink-500",
    accentColor: "purple",
    descriptionVi: "Sách tương tác trực quan hóa các khối đa diện đều Platonic trong không gian ba chiều: tứ diện, lập phương, bát diện, 12 mặt đều và 20 mặt đều kèm công thức Euler.",
    descriptionEn: "Interactive visual spatial geometry textbook exploring Platonic solids, 3D symmetry, and Euler's formula.",
    rating: 4.9,
    readCount: 1980,
    pages: [
      {
        pageNumber: 1,
        chapterTitleVi: "Chương II: Một số Khối Đa diện trong Thực tiễn",
        chapterTitleEn: "Chapter II: Polyhedral Solids in Real Life",
        headingVi: "Bài 1: Khái niệm về Khối Đa diện Đều",
        headingEn: "Lesson 1: Concept of Regular Polyhedra",
        subHeadingVi: "Định nghĩa và lịch sử 5 khối đa diện đều Platonic",
        subHeadingEn: "Definition and history of the 5 Platonic Solids",
        paragraphsVi: [
          "Trong hình học không gian, một khối đa diện được gọi là khối đa diện đều nếu tất cả các mặt của nó là những đa giác đều bằng nhau, và mỗi đỉnh là đỉnh chung của cùng một số mặt.",
          "Từ thời Hy Lạp cổ đại, nhà triết học Plato đã chứng minh rằng trong không gian 3 chiều chỉ tồn tại đúng 5 khối đa diện đều: Tứ diện đều, Khối lập phương, Bát diện đều, Khối 12 mặt đều và Khối 20 mặt đều.",
          "Những khối hình này đại diện cho sự đối xứng hoàn hảo của tự nhiên và được ứng dụng sâu rộng trong kiến trúc, tinh thể học, virus học và thiết kế đồ họa 3D."
        ],
        paragraphsEn: [
          "In spatial geometry, a polyhedron is regular if all its faces are congruent regular polygons and the same number of faces meet at each vertex.",
          "Plato demonstrated that only 5 regular polyhedra exist in three dimensions: tetrahedron, cube, octahedron, dodecahedron, and icosahedron.",
          "These geometric solids exhibit supreme spatial symmetry and are vital across crystallography, virology, and modern computer graphics."
        ],
        calloutVi: "Định lý Euler nổi tiếng: Đối với mọi khối đa diện lồi, số đỉnh (V), số cạnh (E) và số mặt (F) luôn thỏa mãn: V - E + F = 2.",
        calloutEn: "Euler's Formula: For any convex polyhedron: Vertices (V) - Edges (E) + Faces (F) = 2.",
        bilingualTerms: [
          {
            termVi: "Khối đa diện đều",
            termEn: "Regular Polyhedron",
            phonetics: "/ˈreɡjʊlə ˌpɒlɪˈhiːdrən/",
            definitionVi: "Khối đa diện có các mặt là đa giác đều bằng nhau.",
            definitionEn: "A 3D solid whose faces are identical regular polygons."
          },
          {
            termVi: "Công thức Euler",
            termEn: "Euler's Formula",
            phonetics: "/ˈɔɪlər ˈfɔːmjʊlə/",
            definitionVi: "Hệ thức V - E + F = 2 giữa đỉnh, cạnh và mặt của khối đa diện lồi.",
            definitionEn: "V - E + F = 2 relating vertices, edges, and faces."
          }
        ],
        audioNarrationText: "Khối đa diện đều là khối đa diện lồi có tất cả các mặt là các đa giác đều bằng nhau. Có đúng năm khối đa diện đều trong không gian ba chiều."
      },
      {
        pageNumber: 2,
        chapterTitleVi: "Chương II: Một số Khối Đa diện trong Thực tiễn",
        chapterTitleEn: "Chapter II: Polyhedral Solids in Real Life",
        headingVi: "Khám phá Mô hình 3D Khối Hai mươi Mặt đều (Icosahedron)",
        headingEn: "3D Interactive Regular Icosahedron",
        subHeadingVi: "Tương tác xoay và quan sát góc đối xứng",
        subHeadingEn: "Manipulate rotation and inspect symmetrical facets",
        paragraphsVi: [
          "Mô hình dưới đây là Khối hai mươi mặt đều (Icosahedron). Khối hình này có 20 mặt là các tam giác đều, có 12 đỉnh và 30 cạnh.",
          "Hãy dùng chuột xoay khối hình và quan sát: tại mỗi đỉnh có đúng 5 tam giác đều cùng gặp nhau. Bạn có thể kiểm chứng lại công thức Euler: 12 (đỉnh) - 30 (cạnh) + 20 (mặt) = 2."
        ],
        paragraphsEn: [
          "Below is an interactive 3D model of a regular Icosahedron. It features 20 equilateral triangular faces, 12 vertices, and 30 edges.",
          "Inspect how exactly 5 equilateral triangles meet at every vertex, verifying Euler's invariant: 12 - 30 + 20 = 2."
        ],
        embedded3DModel: {
          modelType: "icosahedron",
          titleVi: "Khối 20 mặt đều Platonic 3D",
          titleEn: "Platonic 3D Icosahedron",
          captionVi: "20 mặt tam giác đều đối xứng hoàn hảo trong không gian 3 chiều."
        },
        bilingualTerms: [
          {
            termVi: "Đỉnh",
            termEn: "Vertex (số nhiều: Vertices)",
            phonetics: "/ˈvɜːteks/",
            definitionVi: "Điểm giao nhau của các cạnh trong khối đa diện.",
            definitionEn: "A point where two or more lines or edges meet."
          }
        ],
        audioNarrationText: "Mời bạn xoay mô hình khối hai mươi mặt đều. Mỗi mặt là một tam giác đều tuyệt đẹp với mười hai đỉnh và ba mươi cạnh."
      },
      {
        pageNumber: 3,
        chapterTitleVi: "Chương II: Một số Khối Đa diện trong Thực tiễn",
        chapterTitleEn: "Chapter II: Polyhedral Solids in Real Life",
        headingVi: "Bài tập Trắc nghiệm Hình học Không gian",
        headingEn: "Spatial Geometry Checkpoint Question",
        subHeadingVi: "Vận dụng công thức Euler và đếm yếu tố hình học",
        subHeadingEn: "Apply Euler's formula and geometric counting",
        paragraphsVi: [
          "Hãy vận dụng công thức Euler V - E + F = 2 để giải quyết bài toán kiểm tra độ hiểu bài ngay sau đây."
        ],
        paragraphsEn: [
          "Apply Euler's formula V - E + F = 2 to solve this quick spatial assessment."
        ],
        quiz: {
          id: "q-fb-math-1",
          questionVi: "Một khối đa diện lồi có 8 đỉnh và 12 cạnh. Hỏi khối đa diện đó có bao nhiêu mặt?",
          questionEn: "A convex polyhedron has 8 vertices and 12 edges. How many faces does it have?",
          optionsVi: [
            "6 mặt (Khối hộp chữ nhật/Lập phương)",
            "8 mặt",
            "10 mặt",
            "14 mặt"
          ],
          optionsEn: [
            "6 faces (Cube / Cuboid)",
            "8 faces",
            "10 faces",
            "14 faces"
          ],
          correctIndex: 0,
          explanationVi: "Theo định lý Euler: V - E + F = 2 => 8 - 12 + F = 2 => F = 2 - 8 + 12 = 6 mặt. Đó chính là số mặt của khối lập phương hoặc hình hộp chữ nhật!",
          explanationEn: "According to Euler's formula: V - E + F = 2 => 8 - 12 + F = 2 => F = 6 faces, which characterizes a cube or cuboid!"
        },
        audioNarrationText: "Một khối đa diện lồi có tám đỉnh và mười hai cạnh. Hỏi khối đa diện đó có bao nhiêu mặt?"
      }
    ]
  },
  {
    id: "fb-bio-9",
    slug: "di-truyen-hoc-va-chuoi-dna-sinh-hoc-9",
    titleVi: "Sinh Học 9: Di Truyền Học & Cấu Trúc Phân Tử DNA",
    titleEn: "Biology 9: Genetics & DNA Molecular Architecture",
    subject: "biology",
    subjectLabelVi: "Sinh học",
    subjectLabelEn: "Biology",
    grade: "9",
    textbook: "Chân Trời Sáng Tạo",
    author: "PGS.TS. Trần Thị Thanh Huyền & Nora Bio Team",
    publisher: "NXB Giáo Dục Việt Nam & Smart Explorer",
    coverGradient: "from-emerald-600 via-teal-600 to-cyan-600",
    accentColor: "emerald",
    descriptionVi: "Sách tương tác sinh học phân tử khám phá chuỗi xoắn kép DNA, nguyên tắc bổ sung A-T, G-X, cơ chế nhân đôi và lưu giữ thông tin di truyền.",
    descriptionEn: "Interactive digital biology flipbook on DNA double helix, Watson-Crick model, nucleotide base pairing, and genetic inheritance.",
    rating: 4.96,
    readCount: 3100,
    pages: [
      {
        pageNumber: 1,
        chapterTitleVi: "Chương III: ADN và Gen",
        chapterTitleEn: "Chapter III: DNA & Genes",
        headingVi: "Bài 1: Cấu tạo Hóa học và Không gian của DNA",
        headingEn: "Lesson 1: Chemical & Spatial Structure of DNA",
        subHeadingVi: "Mô hình xoắn kép Watson - Crick năm 1953",
        subHeadingEn: "The 1953 Watson - Crick double helix milestone",
        paragraphsVi: [
          "Axit Đêôxiribônuclêic (viết tắt là ADN hay DNA) là đại phân tử sinh học có vai trò quyết định trong việc lưu trữ, bảo quản và truyền đạt thông tin di truyền qua các thế hệ tế bào và cơ thể.",
          "Năm 1953, James Watson và Francis Crick đã công bố mô hình cấu trúc không gian của phân tử DNA, mở ra kỷ nguyên mới cho ngành sinh học phân tử hiện đại.",
          "Phân tử DNA được cấu tạo theo nguyên tắc đa phân, đơn phân là các nucleotide. Mỗi nucleotide gồm 3 thành phần: một gốc đường đêôxiribôzơ (C₅H₁₀O₄), một nhóm axit photphoric (H₃PO₄) và một trong bốn loại bazơ nitơ: A (Adenine), T (Thymine), G (Guanine) hoặc X (Cytosine)."
        ],
        paragraphsEn: [
          "Deoxyribonucleic acid (DNA) is a biological macromolecule essential for storing and transmitting genetic information across cellular generations.",
          "In 1953, Watson and Crick unveiled the 3D double helix model, ushering in the era of modern molecular biology.",
          "DNA is a polymer constructed of nucleotide monomers, each comprising deoxyribose sugar, a phosphate group, and one of four nitrogenous bases: A, T, G, or C."
        ],
        calloutVi: "Nguyên tắc bổ sung cốt lõi: Adenine luôn liên kết với Thymine bằng 2 liên kết hydro (A = T); Guanine luôn liên kết với Cytosine bằng 3 liên kết hydro (G ≡ X).",
        calloutEn: "Complementary Base Pairing: A binds to T via 2 hydrogen bonds; G binds to C via 3 hydrogen bonds.",
        bilingualTerms: [
          {
            termVi: "Chuỗi xoắn kép",
            termEn: "Double Helix",
            phonetics: "/ˌdʌbl ˈhiːlɪks/",
            definitionVi: "Cấu trúc không gian của DNA gồm hai mạch song song ngược chiều xoắn đều đặn.",
            definitionEn: "The physical structure of DNA: two antiparallel spiraling strands."
          },
          {
            termVi: "Liên kết hydro",
            termEn: "Hydrogen Bond",
            phonetics: "/ˈhaɪdrədʒən bɒnd/",
            definitionVi: "Liên kết yếu giữ hai mạch polynucleotide của DNA gắn liền với nhau.",
            definitionEn: "Weak electrostatic bonds connecting complementary base pairs."
          }
        ],
        audioNarrationText: "Phân tử DNA có cấu tạo chuỗi xoắn kép gồm hai mạch song song xoắn đều quanh một trục. Các bazơ nitơ bắt cặp theo nguyên tắc bổ sung."
      },
      {
        pageNumber: 2,
        chapterTitleVi: "Chương III: ADN và Gen",
        chapterTitleEn: "Chapter III: DNA & Genes",
        headingVi: "Quan sát Chuỗi xoắn kép DNA 3D Thời Gian Thực",
        headingEn: "Real-time 3D DNA Double Helix Manipulation",
        subHeadingVi: "Tương tác xoay và quan sát các liên kết bậc thang",
        subHeadingEn: "Manipulate rotation to observe the spiraling rungs",
        paragraphsVi: [
          "Mô hình không gian 3D dưới đây mô tả chính xác 2 mạch polynucleotide xoắn quanh trục trung tâm với chu kỳ xoắn 3.4 nm (gồm 10 cặp nucleotide).",
          "Hãy xoay mô hình để thấy khung đường - photphat tạo nên thành bậc thang ở phía ngoài, và các cặp bazơ nitơ A-T, G-X tạo nên các bậc thang ở phía trong."
        ],
        paragraphsEn: [
          "The real-time 3D model below showcases two polynucleotide strands winding around an axis with a 3.4 nm pitch containing 10 base pairs per helical turn.",
          "Manipulate the 3D scene to observe the outer sugar-phosphate rails and inner base-pair rungs."
        ],
        embedded3DModel: {
          modelType: "dna",
          titleVi: "Chuỗi xoắn kép DNA 3D",
          titleEn: "Interactive 3D DNA Helix",
          captionVi: "Mạch xoắn kép phát sáng thể hiện các cặp bazơ nitơ bổ sung."
        },
        bilingualTerms: [
          {
            termVi: "Nucleotide",
            termEn: "Nucleotide",
            phonetics: "/ˈnjuːklɪətaɪd/",
            definitionVi: "Đơn phân cấu tạo nên phân tử ADN và ARN.",
            definitionEn: "The basic building block of nucleic acids."
          }
        ],
        audioNarrationText: "Mời các bạn xoay chuỗi xoắn kép DNA. Hai mạch xoắn đều đặn với các cặp bazơ bắt cặp bổ sung ở phía trong."
      },
      {
        pageNumber: 3,
        chapterTitleVi: "Chương III: ADN và Gen",
        chapterTitleEn: "Chapter III: DNA & Genes",
        headingVi: "Bài tập Trắc nghiệm Di truyền Sinh học 9",
        headingEn: "Genetics Checkpoint Question",
        subHeadingVi: "Vận dụng nguyên tắc bổ sung của phân tử DNA",
        subHeadingEn: "Apply DNA complementary pairing logic",
        paragraphsVi: [
          "Nếu một mạch đơn của phân tử DNA có trình tự các nucleotide là: - A - T - G - X - A - T -, hãy suy luận trình tự nucleotide tương ứng trên mạch bổ sung."
        ],
        paragraphsEn: [
          "If one DNA strand reads: - A - T - G - C - A - T -, deduce the complementary sequence on the opposite strand."
        ],
        quiz: {
          id: "q-fb-bio-1",
          questionVi: "Trên phân tử DNA, một đoạn mạch có trình tự: - A - T - G - X -. Đoạn mạch bổ sung tương ứng sẽ có trình tự là:",
          questionEn: "On a DNA molecule, a segment has sequence: - A - T - G - C -. What is the corresponding complementary sequence?",
          optionsVi: [
            "- T - A - X - G -",
            "- A - T - G - X -",
            "- U - A - X - G -",
            "- X - G - T - A -"
          ],
          optionsEn: [
            "- T - A - C - G -",
            "- A - T - G - C -",
            "- U - A - C - G -",
            "- C - G - T - A -"
          ],
          correctIndex: 0,
          explanationVi: "Theo nguyên tắc bổ sung: A liên kết với T, T liên kết với A, G liên kết với X, và X liên kết với G. Do đó đoạn mạch bổ sung là: - T - A - X - G -.",
          explanationEn: "According to Watson-Crick base pairing: A pairs with T, and G pairs with C. Therefore, the complementary sequence is - T - A - C - G -."
        },
        audioNarrationText: "Một đoạn mạch DNA có trình tự A T G X. Hãy tìm trình tự mạch bổ sung tương ứng."
      }
    ]
  },
  {
    id: "fb-kntt-physics-8",
    slug: "luc-day-archimedes-va-dien-hoc-kntt-8",
    titleVi: "Khoa Học Tự Nhiên 8: Lực Đẩy Archimedes & Mạch Điện (Kết Nối Tri Thức)",
    titleEn: "Natural Sciences 8: Archimedes Buoyancy & Electric Circuits (KNTT)",
    subject: "physics",
    subjectLabelVi: "Vật lý",
    subjectLabelEn: "Physics",
    grade: "8",
    textbook: "Kết Nối Tri Thức",
    author: "GS.TS. Vũ Văn Hùng & Nhóm tác giả KNTT",
    publisher: "NXB Giáo Dục Việt Nam & Smart Explorer",
    coverGradient: "from-cyan-600 via-blue-600 to-indigo-600",
    accentColor: "cyan",
    descriptionVi: "Sách giáo khoa điện tử 3D tương tác bám sát Bài 17 & Bài 22 SGK KHTN 8 Kết Nối Tri Thức: Thí nghiệm ảo lực đẩy Archimedes, điều kiện nổi chìm và mô hình dòng điện thắp sáng bóng đèn.",
    descriptionEn: "Interactive 3D digital textbook aligned with Lessons 17 & 22 of KNTT KHTN 8: Virtual lab on Archimedes buoyant force, flotation equilibrium, and closed circuit illumination.",
    rating: 4.98,
    readCount: 3820,
    pages: [
      {
        pageNumber: 1,
        chapterTitleVi: "Chương III: Tác Dụng Của Lực Lên Vật",
        chapterTitleEn: "Chapter III: Effects of Force on Bodies",
        headingVi: "Bài 17: Lực Đẩy Archimedes & Định Luật Ac-si-mét",
        headingEn: "Lesson 17: Archimedes' Buoyant Force Principle",
        subHeadingVi: "Khái niệm lực đẩy của chất lỏng và công thức tính",
        subHeadingEn: "Fluid buoyant force concept and mathematical formula",
        paragraphsVi: [
          "Khi một vật được nhúng chìm trong chất lỏng, chất lỏng sẽ tác dụng lên vật một lực đẩy hướng thẳng đứng từ dưới lên. Lực này được gọi là lực đẩy Archimedes (hay lực đẩy Ác-si-mét).",
          "Độ lớn của lực đẩy Archimedes được xác định bằng công thức: FA = d . V, trong đó d là trọng lượng riêng của chất lỏng (N/m³) và V là thể tích phần chất lỏng bị vật chiếm chỗ (m³).",
          "Hiện tượng này giải thích vì sao những con tàu bằng thép nặng hàng vạn tấn vẫn nổi nhẹ nhàng trên đại dương nhờ thể tích phần chìm rất lớn, tạo nên lực đẩy FA đủ sức nâng toàn bộ trọng lượng con tàu."
        ],
        paragraphsEn: [
          "When a body is immersed in fluid, it experiences an upward force exerted by the fluid called Archimedes' buoyant force.",
          "The magnitude of this force is calculated as: FA = d . V, where d is the fluid's specific weight and V is the displaced volume.",
          "This principle explains how massive steel ships weighing thousands of tons effortlessly float on oceans."
        ],
        calloutVi: "💡 Điều kiện nổi của vật: Khi thả một vật vào trong lòng chất lỏng, vật sẽ chìm xuống nếu P > FA; vật lơ lửng nếu P = FA; và vật nổi lên mặt nước nếu P < FA.",
        calloutEn: "💡 Flotation Rule: An object sinks if P > FA; remains suspended if P = FA; and floats upwards if P < FA.",
        bilingualTerms: [
          {
            termVi: "Lực đẩy Archimedes",
            termEn: "Buoyant Force",
            phonetics: "/ˈbɔɪ.ənt fɔːs/",
            definitionVi: "Lực đẩy hướng từ dưới lên tác dụng lên vật nhúng trong chất lỏng, bằng trọng lượng chất lỏng bị chiếm chỗ.",
            definitionEn: "The upward force exerted by a fluid on an immersed object, equal to the weight of displaced fluid."
          },
          {
            termVi: "Trọng lượng riêng",
            termEn: "Specific Weight",
            phonetics: "/spəˈsɪf.ɪk weɪt/",
            definitionVi: "Trọng lượng của một mét khối chất (đơn vị N/m³).",
            definitionEn: "Weight per unit volume of a material."
          }
        ],
        audioNarrationText: "Khi nhúng một vật vào chất lỏng, vật chịu tác dụng của lực đẩy Ác-si-mét hướng thẳng đứng từ dưới lên bằng trọng lượng phần chất lỏng bị vật chiếm chỗ."
      },
      {
        pageNumber: 2,
        chapterTitleVi: "Chương III: Tác Dụng Của Lực Lên Vật",
        chapterTitleEn: "Chapter III: Effects of Force on Bodies",
        headingVi: "Thí Nghiệm Ảo 3D: Cân Bằng Lực Đẩy & Sự Nổi",
        headingEn: "3D Virtual Lab: Buoyant Force Vectors & Equilibrium",
        subHeadingVi: "Tương tác xoay 360 độ khảo sát cặp vector trọng lực P và lực đẩy FA",
        subHeadingEn: "Manipulate 360° to inspect downward gravity P and upward buoyant force FA",
        paragraphsVi: [
          "Mô hình 3D dưới đây mô phỏng một khối vật thể nhúng trong cốc đong chất lỏng. Hãy quan sát 2 vector lực đối nghịch tác dụng lên vật:",
          "Vector màu đỏ là Trọng lực P (hướng thẳng đứng xuống dưới do lực hút của Trái Đất). Vector màu xanh lục là Lực đẩy Ác-si-mét FA (hướng thẳng đứng lên trên do áp suất thủy tĩnh của chất lỏng tạo ra). Khi hai lực này cân bằng, vật nổi yên trên mặt nước."
        ],
        paragraphsEn: [
          "The interactive 3D model below illustrates an immersed block inside a graduated cylinder with opposing force vectors.",
          "The red vector indicates downward Gravity P; the green vector represents upward Buoyancy FA."
        ],
        embedded3DModel: {
          modelType: "archimedes_buoyancy",
          titleVi: "Thí nghiệm Lực đẩy Archimedes 3D",
          titleEn: "3D Archimedes Buoyancy Simulation",
          captionVi: "Khối vật nổi cân bằng trong chất lỏng cùng 2 vector lực đối nghịch."
        },
        bilingualTerms: [
          {
            termVi: "Sự nổi cân bằng",
            termEn: "Flotation Equilibrium",
            phonetics: "/ˌiː.kwəˈlɪb.ri.əm/",
            definitionVi: "Trạng thái khi tổng các lực tác dụng lên vật nổi triệt tiêu nhau (P = FA).",
            definitionEn: "The state where downward gravitational weight is fully neutralized by upward buoyant force."
          }
        ],
        audioNarrationText: "Hãy xoay mô hình 3D để quan sát vector trọng lực P màu đỏ hướng xuống và vector lực đẩy Ác-si-mét màu xanh hướng lên."
      },
      {
        pageNumber: 3,
        chapterTitleVi: "Chương V: Điện Học KHTN 8",
        chapterTitleEn: "Chapter V: Electricity Sciences",
        headingVi: "Bài 22: Mạch Điện Đơn Giản & Tác Dụng Phát Sáng",
        headingEn: "Lesson 22: Simple Electric Circuits & Illumination",
        subHeadingVi: "Cấu tạo mạch điện kín và quy ước chiều dòng điện",
        subHeadingEn: "Structure of closed circuits and conventional current rules",
        paragraphsVi: [
          "Một mạch điện cơ bản bao gồm nguồn điện (như pin, acquy), các thiết bị tiêu thụ điện (bóng đèn, chuông, quạt), dây dẫn và công tắc (khóa K) để đóng ngắt mạch điện.",
          "Khi khóa K đóng, mạch điện trở thành một đường dẫn liền mạch khép kín, dòng điện chạy qua nung nóng sợi đốt vonfram của bóng đèn đến nhiệt độ phát ra ánh sáng rực rỡ.",
          "Quy ước quốc tế xác định: Chiều dòng điện là chiều đi từ cực dương (+) qua dây dẫn và thiết bị điện tới cực âm (-) của nguồn điện. Trong khi đó, các electron tự do trong kim loại lại dịch chuyển ngược chiều quy ước (từ cực âm về cực dương)."
        ],
        paragraphsEn: [
          "A fundamental electrical circuit includes a power source (battery), conductors, a switch, and an electrical load (such as a light bulb).",
          "Closing the switch forms an unbroken closed loop, allowing current to heat the tungsten filament until it glows incandescently.",
          "By convention, electric current flows from the positive terminal to the negative terminal, which is opposite to free electron drift."
        ],
        calloutVi: "💡 Tác dụng nhiệt và phát sáng: Dòng điện chạy qua mọi vật dẫn thông thường đều tỏa nhiệt. Khi sợi đốt bóng đèn bị nung nóng tới khoảng 2500°C, nó phát ra ánh sáng trắng vàng.",
        calloutEn: "💡 Heating & Luminous Effects: Electric current inherently dissipates heat; when tungsten filaments exceed ~2500°C, visible light is radiated.",
        bilingualTerms: [
          {
            termVi: "Mạch điện kín",
            termEn: "Closed Circuit",
            phonetics: "/kləʊzd ˈsɜː.kɪt/",
            definitionVi: "Đường dẫn liên tục không bị đứt đoạn cho dòng điện lưu thông.",
            definitionEn: "An uninterrupted complete electrical path allowing sustained current flow."
          },
          {
            termVi: "Sợi đốt",
            termEn: "Filament",
            phonetics: "/ˈfɪl.ə.mənt/",
            definitionVi: "Dây kim loại mỏng bằng vonfram trong bóng đèn, phát sáng khi có dòng điện chạy qua.",
            definitionEn: "A conducting wire with a high melting point forming part of an electric bulb."
          }
        ],
        audioNarrationText: "Mạch điện kín gồm nguồn pin, dây dẫn, công tắc và bóng đèn. Khi đóng khóa K, dòng điện chạy qua làm bóng đèn phát sáng."
      },
      {
        pageNumber: 4,
        chapterTitleVi: "Chương V: Điện Học KHTN 8",
        chapterTitleEn: "Chapter V: Electricity Sciences",
        headingVi: "Khám Phá Mạch Điện 3D Hoạt Động Thời Gian Thực",
        headingEn: "Real-time 3D Functional Electric Circuit",
        subHeadingVi: "Tương tác xoay 3D quan sát nguồn pin, khóa K và bóng đèn tỏa sáng",
        subHeadingEn: "Inspect the 3D battery, switch, copper wires, and glowing filament",
        paragraphsVi: [
          "Mô hình 3D dưới đây tái hiện trọn vẹn một mạch điện khép kín theo đúng sơ đồ thí nghiệm SGK KHTN 8 Kết Nối Tri Thức.",
          "Các electron chuyển động thành dòng có hướng qua dây dẫn đồng, khóa K màu đỏ đóng kín và bóng đèn dây tóc ở trung tâm phát ra ánh hào quang vàng rực rỡ."
        ],
        paragraphsEn: [
          "The interactive 3D model accurately renders a closed circuit matching KNTT textbook laboratory setups.",
          "Electrons flow directionally across copper leads, passing through the closed switch to illuminate the tungsten filament."
        ],
        embedded3DModel: {
          modelType: "electric_circuit",
          titleVi: "Mạch điện 3D Phát sáng",
          titleEn: "3D Glowing Electric Circuit",
          captionVi: "Mô hình mạch điện kín với nguồn pin, dây dẫn, công tắc và bóng đèn phát sáng."
        },
        bilingualTerms: [
          {
            termVi: "Cực dương / Cực âm",
            termEn: "Positive / Negative Terminal",
            phonetics: "/ˈtɜː.mɪ.nəl/",
            definitionVi: "Hai đầu điện cực của nguồn điện tạo ra hiệu điện thế trong mạch.",
            definitionEn: "The two electrode terminals of a DC power supply maintaining voltage."
          }
        ],
        audioNarrationText: "Mời bạn xoay mô hình mạch điện 3D. Hãy quan sát bộ nguồn pin, khóa K đóng và bóng đèn dây tóc phát sáng vàng ấm áp."
      },
      {
        pageNumber: 5,
        chapterTitleVi: "Ôn Tập & Đánh Giá Năng Lực KHTN 8",
        chapterTitleEn: "Review & Competency Check KHTN 8",
        headingVi: "Trắc Nghiệm Đánh Giá Kiến Thức Bài 17 & Bài 22",
        headingEn: "Lessons 17 & 22 Checkpoint Quiz",
        subHeadingVi: "Kiểm tra mức độ nắm vững kiến thức lực đẩy Archimedes và chiều dòng điện",
        subHeadingEn: "Assess conceptual grasp of Archimedes buoyancy and electric current",
        paragraphsVi: [
          "Hãy chọn đáp án đúng nhất cho câu hỏi trắc nghiệm dưới đây để hoàn thành tiết học số này."
        ],
        paragraphsEn: [
          "Select the most accurate response to complete this interactive lesson."
        ],
        quiz: {
          id: "q-fb-kntt-8-1",
          questionVi: "Một vật có thể tích 0.002 m³ được nhúng chìm hoàn toàn trong nước có trọng lượng riêng d = 10,000 N/m³. Độ lớn lực đẩy Archimedes tác dụng lên vật là:",
          questionEn: "An object of volume 0.002 m³ is fully submerged in water with specific weight d = 10,000 N/m³. What is the buoyant force?",
          optionsVi: [
            "20 N",
            "2 N",
            "200 N",
            "5,000 N"
          ],
          optionsEn: [
            "20 N",
            "2 N",
            "200 N",
            "5,000 N"
          ],
          correctIndex: 0,
          explanationVi: "Áp dụng công thức FA = d . V = 10,000 N/m³ x 0.002 m³ = 20 N. Do đó lực đẩy Archimedes tác dụng lên vật là 20 Newton.",
          explanationEn: "Applying FA = d . V = 10,000 N/m³ x 0.002 m³ = 20 N.",
        },
        audioNarrationText: "Một vật có thể tích 0.002 mét khối nhúng trong nước có trọng lượng riêng 10,000 N/m³. Hãy tính độ lớn lực đẩy Ác-si-mét tác dụng lên vật."
      }
    ]
  }
];


export const USER_FLIPBOOKS_STORAGE_KEY = "smart_explorer_user_flipbooks";

/**
 * Lấy danh sách sách do người dùng tự tạo / tải lên từ localStorage
 */
export function getUserStoredBooks(): FlipbookBook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_FLIPBOOKS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FlipbookBook[];
  } catch (e) {
    console.error("Error reading user flipbooks from storage:", e);
    return [];
  }
}

/**
 * Lưu một cuốn sách mới vào localStorage
 */
export function saveUserBook(book: FlipbookBook): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getUserStoredBooks();
    const updated = [book, ...existing.filter((b) => b.id !== book.id)];
    localStorage.setItem(USER_FLIPBOOKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving user flipbook to storage:", e);
  }
}

/**
 * Xóa một cuốn sách do người dùng tạo
 */
export function deleteUserBook(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getUserStoredBooks();
    const updated = existing.filter((b) => b.id !== id);
    localStorage.setItem(USER_FLIPBOOKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error deleting user flipbook:", e);
  }
}

/**
 * Lấy toàn bộ sách (cả sách hệ thống + sách người dùng tải lên/tạo mới)
 */
export function getAllFlipbooks(): FlipbookBook[] {
  const userBooks = getUserStoredBooks();
  return [...userBooks, ...FLIPBOOKS_DATA];
}

