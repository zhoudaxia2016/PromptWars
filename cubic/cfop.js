/**
 * CFOP 公式库 - OLL / PLL
 * 2-Look OLL (10) + 2-Look PLL (6) + 常用公式
 */
export const CFOP = {
  OLL: [
    { id: 'O1', name: '十字', formula: "F R U R' U' F'" },
    { id: 'O2', name: '一字', formula: "F U R U' R' F'" },
    { id: 'O3', name: '点', formula: "F R U R' U' F' F R U R' U' F'" },
    { id: 'O4', name: '小L', formula: "F R U R' U' F'" },
    { id: 'O5', name: '大L', formula: "F R U R' U' F'" },
    { id: 'O6', name: 'Sune', formula: "R U R' U R U2 R'" },
    { id: 'O7', name: 'Anti-Sune', formula: "R' U' R U' R' U2 R" },
    { id: 'O8', name: 'Pi', formula: "R U2 R2 U' R2 U' R2 U2 R" },
    { id: 'O9', name: 'U', formula: "R U R' U R U2 R' L' U' L U' L' U2 L" },
    { id: 'O10', name: 'T', formula: "R U R' U' R' F R F'" },
    { id: 'O11', name: 'L', formula: "F R' F' R U R U' R'" },
    { id: 'O12', name: '鱼', formula: "R U R' U R U2 R'" },
    { id: 'O13', name: '闪电', formula: "R U R' U R U2 R'" },
    { id: 'O14', name: '双鱼', formula: "R U R' U R U2 R' L' U' L U' L' U2 L" }
  ],
  PLL: [
    { id: 'P1', name: 'Ua', formula: "R U' R U R U R U' R' U' R2" },
    { id: 'P2', name: 'Ub', formula: "R2 U R U R' U' R' U' R' U R'" },
    { id: 'P3', name: 'Z', formula: "U R' U' R U' R U R U' R' U R U R2 U' R' U" },
    { id: 'P4', name: 'H', formula: "R L U2 R' L' U R L U2 R' L' U" },
    { id: 'P5', name: 'Aa', formula: "R' U R' D2 R U' R' D2 R2" },
    { id: 'P6', name: 'Ab', formula: "R2 D2 R U R' D2 R U' R" },
    { id: 'P7', name: 'E', formula: "R U' R' D R U R' D' R U R' D R U' R' D'" },
    { id: 'P8', name: 'T', formula: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    { id: 'P9', name: 'Ja', formula: "R2 F R F' R U2 R' L' U' L U2" },
    { id: 'P10', name: 'Jb', formula: "R U R' F' R U R' U' R' F R2 U' R'" },
    { id: 'P11', name: 'Ra', formula: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
    { id: 'P12', name: 'Rb', formula: "R' U2 R U2 R' F R U R' U' R' F' R2 U'" },
    { id: 'P13', name: 'Y', formula: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { id: 'P14', name: 'V', formula: "R' U R' U' B' R' B2 U' B' U B' R B R" },
    { id: 'P15', name: 'F', formula: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { id: 'P16', name: 'Ga', formula: "R2 U R' U R' U' R U' R2 D U' R' U R D'" },
    { id: 'P17', name: 'Gb', formula: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
    { id: 'P18', name: 'Gc', formula: "R2 U' R U' R U R' U R2 D' U R U' R' D" },
    { id: 'P19', name: 'Gd', formula: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
    { id: 'P20', name: 'Na', formula: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
    { id: 'P21', name: 'Nb', formula: "R' U R U' R' F' U' F R U R' F R' F' R U' R" }
  ],
  F2L: [
    { id: 'F1', name: '基础1', formula: "R U R'" },
    { id: 'F2', name: '基础2', formula: "U R U' R'" },
    { id: 'F3', name: '基础3', formula: "R U2 R' U R U R'" },
    { id: 'F4', name: '基础4', formula: "R' U' R U' R' U R" },
    { id: 'F5', name: '分离', formula: "R U R' U R U' R'" },
    { id: 'F6', name: '隐藏', formula: "U R U2 R' U R U' R'" },
    { id: 'F7', name: '顶对', formula: "R U' R' U2 R U' R'" },
    { id: 'F8', name: '顶错', formula: "R U R' U R U2 R'" }
  ]
};
