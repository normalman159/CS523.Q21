# External Sorting Visualization

Ứng dụng web minh họa thuật toán **External Sorting** - giải pháp sắp xếp dữ liệu lớn không fit vào RAM.

## 🎯 Tính năng

- ✅ Upload file .txt chứa dữ liệu số
- ✅ Cấu hình memory limit và chunk size
- ✅ Visualize step-by-step quá trình sorting
- ✅ Download kết quả đã sắp xếp

## 🚀 Quick Start

### Sử dụng trực tiếp
1. Mở file `index.html` trong trình duyệt
2. Upload file .txt hoặc dùng sample data
3. Cấu hình và chạy visualization

### Deploy lên GitHub Pages
```bash
# Push code lên GitHub
git add .
git commit -m "Add external sorting visualization"
git push origin main

# Enable GitHub Pages trong Settings
# Choose: Deploy from branch 'main'
```

## 📁 Cấu trúc thư mục

```
CS523.Q21/
├── index.html              # UI chính
├── css/
│   └── style.css          # Styling
├── js/
│   ├── external-sort.js   # Core algorithm
│   └── visualizer.js      # Visualization logic
├── assets/
│   └── sample-data.txt    # Sample input file
└── README.md              # Documentation
```

## 🧮 External Sorting Algorithm

### Phase 1: Divide & Sort
1. Chia input thành chunks (theo memory limit)
2. Sắp xếp từng chunk trong memory
3. Lưu chunks (simulate disk write)

### Phase 2: K-way Merge
1. Merge tất cả chunks đã sắp xếp
2. Sử dụng Min Heap cho hiệu quả
3. Track I/O operations

### Complexity
- **Time**: O(n log k) - n là số phần tử, k là số chunks
- **Space**: O(k) - chỉ cần k phần tử trong memory

## 🔧 Cấu hình

- **Memory Limit**: Số phần tử tối đa trong một chunk
- **Animation Speed**: Tốc độ visualization (ms/step)
- **Input Format**: Numbers separated by newline hoặc comma

## 📝 Format File Input

```txt
95
12
47
83
...
```

hoặc

```txt
95, 12, 47, 83, 21, 56, ...
```

## 🎨 Tech Stack

- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Logic (no frameworks)
- **File API** - File handling
- **Canvas/DOM** - Visualization

## 📖 References

- [External Sorting - Wikipedia](https://en.wikipedia.org/wiki/External_sorting)
- [K-way Merge Algorithm](https://en.wikipedia.org/wiki/K-way_merge_algorithm)

## 👨‍💻 Author

CS523.Q21 Project - 2026

## 📄 License

MIT License
