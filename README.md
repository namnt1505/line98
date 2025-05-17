```
graph TD
    A[Khởi tạo Game] --> B[Tạo grid trống]
    B --> C[Sinh ngẫu nhiên 3 bóng đầu tiên]
    C --> D[Sinh vị trí và màu cho 3 bóng tiếp theo]
    D --> E[Chờ người chơi tương tác]
    
    E --> F[Click bóng]
    E --> G[Click ô trống]
    
    F --> H[Chọn bóng để di chuyển]
    G --> I[Di chuyển bóng đến ô trống]
    
    I --> J[Kiểm tra đường thẳng]
    J --> K{Có đủ 5 bóng?}
    
    K -->|Có| L[Xóa bóng & Tính điểm]
    K -->|Không| M[Thêm 3 bóng mới]
    
    L --> D
    M --> D
```