# 03 · Thiết kế lại giao diện toàn bộ frontend theo *tasteskill v2* (`design-taste-frontend`)

> Skill cài bằng `npx skills add Leonxlnx/taste-skill` → `.agents/skills/design-taste-frontend`. Tài liệu này ghi lại **(1) chẩn đoán "before"**, **(2) direction đã deal**, **(3) quy tắc nhà (house rules) áp cho dự án**, **(4) thay đổi từng màn hình**, **(5) nút nào giữ/bỏ**, **(6) quy trình kiểm tra**.
> Nguyên tắc riêng cho giáo dục: màn hình phải trả lời "**tôi nên làm gì tiếp?**" trước khi khoe số; mọi nút là một hành động học tập có nghĩa; không có nút kỹ thuật.

## 1. Chẩn đoán hiện trạng (before)

Chạy FE local (`next dev`) và chụp 1440×900; đọc `globals.css`, `tailwind.config.ts`, các page. Những "tell" của giao diện sinh tự động mà skill cấm, đang xuất hiện khắp nơi:

| Tell (tasteskill `references/tells.md`) | Nơi gặp | Hệ quả |
| --- | --- | --- |
| **Gradient** nền/hero/banner | `/rankings` hero xanh gradient, `/resources` banner tím gradient, banner "AI Study Coach" trên `/dashboard`, `/analysis`, `/tests` hero | Nhìn như template; màu không nằm trên dữ liệu |
| **Icon trong ô tô màu** (icon-topped cards) | Skill cards `/dashboard`, heading kỹ năng `/resources`, StatCard teacher/admin | Bị cấm tuyệt đối trong app-screen rules |
| **Pill badge / eyebrow** chữ hoa tracking rộng | "PERSONALISED GUIDANCE", "IELTS Practice Hub", "AI STUDY COACH", nhãn `text-[10px] uppercase tracking-widest` | Chữ 10px không đọc được; eyebrow bị cấm |
| **Hàng thẻ giống hệt nhau** (card grid) | Resources, Select Test Module, Platform Stats, Recommended for You | Không có thứ bậc, không trả lời câu hỏi nào |
| **Shadow + border + radius** trên mọi card lúc nghỉ | `Card` mặc định shadcn, thẻ test, bảng | App rule: phẳng, tách bằng 1 bậc tông |
| **Palette tím/indigo "assistant"** | violet-600 cho AI Coach, `oklch(0.49 0.237 261)` primary, tips 4 màu (blue/emerald/amber/violet) | Bị cấm ("no violet or indigo"); 4 màu kỹ năng = rainbow |
| **Emoji** | "💡 Tip" trên màn kết quả | Cấm |
| **Vanity numbers** | "Avg Band Improvement", "Practice Hours", "Exam Readiness %" | App rule: không số vô căn cứ |
| **Nút kỹ thuật** | Sync Data, Sync Analytics, Sync | Người dùng không hiểu |
| **Link chết** | 3 link `href="#"` trên navbar | — |
| **3 font** (Lexend display, Noto body, Roboto passage) + Material Symbols + lucide | `layout.tsx`, `tailwind.config.ts` | Quá 2 typeface; 2 bộ icon |
| Skeleton nhiều khối xám tròn | `/rankings` loading | Chấp nhận được nhưng phải giữ khung thật (header bảng) |
| Trang client-only trắng trơn khi chưa có JS/API | `/login`, `/`, `/tests` render rỗng trước khi hydrate | Cần SSR/skeleton có khung và tiêu đề |

Ảnh "before" chụp bằng Chrome headless lưu tại `.taste-skill/before/*.png` (login, rankings, resources, home, tests, register) — thư mục làm việc của skill, không commit; ảnh được đính kèm trong session. Các màn cần đăng nhập sẽ được chụp khi chạy stack local lúc implement (`inspect.mjs --app <url> --out .taste-skill/before`).

## 2. Direction đã deal (app screens)

Sản phẩm là **app screen** (người học *làm việc* trong đó), không phải landing page ⇒ theo `references/app-screens.md`, không theo page run.

```
node <skill>/scripts/draw.mjs --app --kind workspace --theme light --screens overview,analytics,detail,list \
  --brief "Personalised online IELTS Academic preparation …" --style editorial-greeting
# → .taste-skill/app/direction.json · seed 1806408546 · sheet: .taste-skill/app-sheet.md
```

Hai style được deal: `achromatic-ledger` (ledger/analytics, không màu trong chrome) và **`editorial-greeting`** (trang chủ cá nhân mở bằng lời chào là `h1`, mọi con số set regular weight trên panel tông nhẹ). **Chọn `editorial-greeting`** vì sản phẩm là *personal home* của một người học, dùng phiên dài mỗi ngày; câu hỏi đầu tiên của màn hình là "hôm nay tôi học gì" chứ không phải bảng số.

**Tokens** (từ sheet, áp vào `globals.css` `:root`):
```
--ground:#ffffff  --surface:#f9f9f9  --ink:#111  --ink-2:#555  --line: (không dùng viền, dùng bậc tông)
--accent:#1b6e66 (teal đậm; <2% diện tích; chỉ trên hành động chính + dữ liệu chính)
--pill-positive-bg:#dcfae5/#04250e  --pill-negative-bg:#fdecea/#7a1d14  --pill-warning:#fffbeb/#92400e  --pill-neutral:#f3f3f3/#3d3d3a
Type: Instrument Sans 400/500/600 (title 48 · section 14 · kpi 32 · body 14 · small 12); Instrument Serif chỉ cho lời chào.
Shell: Open plane — sidebar 240px cùng nền trang, không top bar; active = pill xám trung tính; nav pitch 34px.
Grid: cột 1100px căn giữa cho trang cá nhân (12 cột 77px, gutter 16); fluid cho bảng/editor.
```
**"Its face"** (bắt buộc chọn 1): *nền lấy từ thế giới sản phẩm* — một **xám-xanh giấy thi** rất nhạt (`#f4f6f5`) cho surface thay vì #f9f9f9, giữ trang trắng; **signature element**: **"dải band"** (band strip) — một thanh ngang 1.0→9.0 với vạch *hiện tại*, *mục tiêu* và *ngày thi*, lặp lại ở dashboard, analysis, hồ sơ học viên (giáo viên), kết quả bài.

Vì có brand sẵn (xanh #135bec): dùng `--keep palette` **không** được chọn — màu xanh hiện tại là màu "primary mặc định"; đề xuất đổi sang teal của sheet. Nếu bạn muốn giữ xanh, thay `--accent` = `#135bec` và giữ mọi quy tắc khác.

## 3. Quy tắc nhà áp dụng cho dự án (checklist khi implement)

1. **Một câu hỏi mỗi màn hình**, trả lời bằng khối lớn nhất, nằm trên fold ở 1440×900; thao tác chính 1 click trong title row.
2. **Màu chỉ trên dữ liệu, trạng thái và 1 hành động chính.** Không màu trên chrome (sidebar, header, card).
3. **KPI là chữ, không phải ô**: số 32px regular, nhãn 14px, không icon, không sparkline.
4. **Phẳng**: không shadow lúc nghỉ, không viền 1px quanh card; tách bằng `--surface` trên `--ground`. Shadow chỉ cho menu/dialog.
5. **Không eyebrow, không uppercase tracking, không chữ < 12px.** Nhãn sentence case.
6. **Không icon trong ô tô màu; không emoji; không gradient; không glass.**
7. **Tối đa 2 typeface** (Instrument Sans + Instrument Serif cho lời chào). Bỏ Lexend/Noto/Roboto; passage dùng cùng sans 18px/1.6 hoặc serif hệ thống nếu muốn giống đề thi giấy. **Một bộ icon** (lucide), bỏ Material Symbols.
8. **Bảng**: không zebra, không header band; số căn phải, tabular-nums; dash cho giá trị thiếu, 0 in là 0.
9. **Biểu đồ**: 1 series không legend; 3–7 gridline mờ hoặc không; 1 hue trên series chính (band của tôi), xám cho so sánh (trung bình lớp).
10. **Trạng thái dữ liệu thật thà**: rỗng giữ khung + 1 câu + 1 hành động ("Chưa có bài nào — Làm bài xếp lớp 15 phút").
11. **Từ của nghề** trong nhãn: "Band", "Loại câu hỏi", "Đến hạn ôn", "Bài giao", không "Items/Records/Status".
12. **Nút**: phẳng, một màu fill, bo góc quyết định một lần (đề xuất 6px cho app). Nhãn nút = động từ + đối tượng ("Luyện 8 câu Matching Headings", "Nộp bài", "Xem lại 7 lỗi"). Không "Sync", không "OK".
13. **Motion**: không entrance animation (bỏ `framer-motion` fade-in trên từng trang); chỉ feedback khi bấm/mở.
14. **Mobile 390**: sidebar gập, khối "Hôm nay" vẫn là thứ đầu tiên.

## 4. Thay đổi theo từng màn hình

### 4.1 Shell (tất cả vai trò)
- Sidebar 240px cùng nền trang, wordmark **IELTS-MN** + monogram teal vẽ riêng (không ô đen chữ cái), nhóm nav sentence case, user row dưới cùng. Học viên: *Hôm nay · Luyện tập · Kết quả · Sổ lỗi · Lớp học · Hồ sơ* (gộp AI Coach vào từng ngữ cảnh + 1 mục "Hỏi AI Coach" ở cuối). Giáo viên: *Tổng quan · Lớp · Ngân hàng đề · Hàng chờ chấm*. Admin: *Tổng quan · Đề thi · Người dùng · Giáo viên · Chất lượng câu hỏi · Cài đặt*.
- Bỏ top bar; tiêu đề trang nằm trên canvas cách mép trên 32px.
- Navbar public: wordmark, 3 link thật (Đề thi · Bảng xếp hạng · Tài nguyên), 1 nút "Đăng nhập". Bỏ link `#`.

### 4.2 `/dashboard` → "Hôm nay" (editorial-greeting)
- `h1` serif 48px: *"Chào Minh, còn 6 tuần tới ngày thi."* Dòng xám dưới: band hiện tại 6.0 → mục tiêu 7.0.
- **Dải band** (signature) full width ngay dưới lời chào.
- Khối lớn nhất: **Hôm nay** — 2–4 nhiệm vụ, mỗi dòng: tên + lý do dữ liệu + phút; 1 nút "Bắt đầu" teal (hành động chính duy nhất trên màn).
- Hàng 9/3: *Tiến độ tuần* (band theo kỹ năng, 1 hue cho kỹ năng đang tập trung) | *Đến hạn ôn* (số lỗi/từ, nút "Ôn 10 phút").
- Hàng 6/6: *Bài gần đây* (4 dòng, "Xem tất cả") | *Lớp học* (bài giao sắp hạn) — không hiện nếu chưa vào lớp.
- **Bỏ**: Exam Readiness %, 4 tip tĩnh, banner gradient AI Coach, 4 thẻ "Select Test Module" có icon ô màu (chuyển thành 1 dòng link "Luyện Listening · Reading · Writing · Speaking" trong khối Luyện tập).

### 4.3 `/tests` → "Luyện tập"
- Title row: `h1` "Luyện tập" + bộ lọc kỹ năng dạng segmented text (không pill màu) + ô tìm.
- Hai lớp nội dung theo thứ tự: **Drill theo loại câu hỏi** (danh sách KC với mastery dạng số & thanh xám/teal, nút "Luyện") → **Đề đầy đủ** (bảng: tên, kỹ năng, số câu, thời lượng, độ khó, *lần làm gần nhất & band*, nút Bắt đầu). Bảng thay lưới thẻ.
- Bỏ hero gradient "IELTS Practice Hub".

### 4.4 `/practice/:id` (giữ bố cục split, tinh chỉnh)
- Giữ: split layout, highlight, minimap, timer, autosave. Thanh đầu: tiêu đề, thời gian, đã trả lời, nút "Nộp bài" — 1 màu. Bỏ `text-xs uppercase tracking-wider` cho nhãn Time left/Answered → 14px sentence case.
- Màn Instructions: thêm chọn **Chế độ thi / Chế độ luyện** (xem `02 §3.4`) với 1 câu mô tả khác biệt.
- Chế độ luyện: sau mỗi câu, panel phản hồi gọn dưới câu hỏi (đúng/sai → thử lại → giải thích + bằng chứng), không modal.
- Passage: cùng typeface, 18px/1.6, measure 65–75 ký tự; bỏ Roboto riêng.

### 4.5 `/practice/:id/result` → "Kết quả" (thiết kế lại mạnh nhất)
- Trên fold: **Band lớn (32–48px) + dải band** có vạch mục tiêu; câu nhận xét 1 dòng bằng dữ liệu (*"+0.5 so với lần trước; 4/5 câu sai là completion vượt giới hạn từ"*).
- Khối 2: **Câu sai & vì sao** — danh sách mỗi câu: câu hỏi · đáp án của bạn · đáp án đúng · *bằng chứng* (trích/phát 8s) · *nguyên nhân* · nút "Luyện 8 câu cùng loại". Mặc định mở, không cần "Show Details".
- Khối 3: bảng theo loại câu hỏi (giữ, bỏ màu header, số căn phải).
- Khối 4: AI Coaching Feedback (giữ nội dung, bỏ nền tím; render markdown gọn).
- Footer actions: "Thêm 7 lỗi vào ôn lại" (đã tự thêm → hiển thị trạng thái), "Làm lại bài", "Về Luyện tập". Bỏ "💡 Tip", bỏ "Retry Incorrect" sai nghĩa.

### 4.6 `/analysis` → "Kết quả" (tổng hợp)
- `h1` "Kết quả của bạn"; khối lớn: **band theo tuần** với vạch target & ngày thi (1 hue), bên phải: mastery theo loại câu hỏi dạng *bar list* xám với KC yếu được tô teal.
- Writing/Speaking: 4 tiêu chí dạng số + "lỗi lặp lại" top 3 với nút "Sửa 10 câu".
- Bảng lịch sử: giữ, bỏ zebra/màu. **Bỏ Sync Data, Download Report** (chuyển vào menu "⋯ Xuất PDF"), bỏ banner tím.

### 4.7 `/ai-advisor` → "Hỏi AI Coach"
- Cột chat 720px căn giữa, không bubble màu; câu trả lời có nút hành động khi AI đề xuất drill ("Tạo drill này"). 3 câu gợi ý thành link chữ, không chip.

### 4.8 `/profile` → "Hồ sơ & mục tiêu"
- Khối đầu: **Mục tiêu** (target band từng kỹ năng, ngày thi, phút/ngày) – form phẳng. Khối 2: thông tin cá nhân. Khối 3: đổi mật khẩu. Bỏ Total Attempts/Average Band (đã có ở Kết quả).

### 4.9 `/classes/**` (learner), `/teacher/**`
- StatCard → số kiểu chữ; badge trạng thái dùng 4 pill tông của sheet (positive/negative/warning/neutral), không 6 màu Tailwind.
- Teacher overview: câu hỏi "lớp nào cần tôi hôm nay": hàng chờ chấm + học viên có nguy cơ trước, danh sách lớp sau. Thêm **heatmap KC** trong class detail (ma trận xám→teal, không rainbow).
- Bỏ nút Sync; gradebook: số căn phải, dash cho chưa nộp.

### 4.10 `/admin/**`
- Dashboard: 3 số thật (người học, đề, lượt làm 7 ngày) + hàng chờ (giáo viên chờ duyệt, câu hỏi bị báo lỗi, explanation chờ duyệt). Bỏ Sync Analytics, Edit Profile khỏi dashboard.
- Builder: form phẳng, một cột 720px; thêm trường `explanation`, `evidence_anchor`, `difficulty` bắt buộc; preview câu hỏi như người học thấy.
- Ẩn `/admin/settings` cho tới khi có nội dung thật.

### 4.11 Public `/`, `/rankings`, `/resources`, `/login`, `/register`
- `/` nếu chưa đăng nhập: `h1` một dòng nói sản phẩm là gì + 1 nút "Làm bài xếp lớp 15 phút"; một ảnh/khung giao diện thật của màn Kết quả (data-ui); 3 số thật; không "Recommended for You" cứng. Nếu đã đăng nhập → redirect `/dashboard`.
- `/rankings`: bảng phẳng, hạng của tôi ghim trên, bộ lọc tuần/tất cả/lớp của tôi. Bỏ hero gradient.
- `/resources`: danh sách theo KC yếu của tôi trước ("Vì bạn yếu Matching Headings"), rồi theo kỹ năng; dòng link, không thẻ icon ô màu.
- `/login`, `/register`: SSR khung + tiêu đề (không trắng trơn), form 1 cột 400px, 1 nút teal, Google là nút phụ xám.

## 5. Kiểm kê nút: giữ / đổi tên / bỏ

| Hiện tại | Quyết định | Lý do |
| --- | --- | --- |
| Sync Data · Sync Analytics · Sync | **Bỏ** → tự động | Nút kỹ thuật |
| Retry Incorrect (n) | **Đổi** thành "Luyện lại n câu sai" và làm đúng chức năng | Nhãn sai hành vi |
| Show Details / Hide Details | **Bỏ** | Câu sai phải hiện mặc định |
| Download Report | Chuyển vào menu "⋯ Xuất PDF" | Không phải hành động chính |
| Get My Study Plan / AI Study Coach banner | **Bỏ banner**; kế hoạch là khối Hôm nay | Lặp CTA |
| Start Practising / Browse Tests (empty state) | Giữ, đổi "Làm bài xếp lớp" khi chưa có attempt | Hành động đúng với trạng thái |
| Start (thẻ test) | Giữ: "Bắt đầu" / "Tiếp tục" nếu có attempt dở | — |
| Continue Test / Resume | Giữ, gộp thành "Tiếp tục bài đang làm" | — |
| Submit Writing | Giữ "Nộp bài" | — |
| Join / Leave class | Giữ | — |
| Edit Profile (admin dashboard) | Chuyển sang user menu | Không thuộc dashboard |
| Configure / Schedule (settings) | **Bỏ** | Placeholder |
| Features / Pricing / About (`#`) | **Bỏ** | Link chết |

## 6. Quy trình implement & kiểm tra (theo skill §Redesign)

1. **Record the before**: chạy stack local đầy đủ, `node <skill>/scripts/inspect.mjs --app http://localhost:3000/<route> --out .taste-skill/before/<route>` cho ~12 màn (dashboard, tests, practice, result, analysis, profile, classes, teacher overview/class/assignment, admin dashboard/builder); `lint.mjs --app app/`.
2. **Giữ stack**: Next 16 + Tailwind v4 + Radix; không thêm thư viện UI. Đổi tokens trong `globals.css`, font trong `app/layout.tsx`, `Card/Button/Badge` trong `components/ui` (bỏ shadow/border, radius 6px, pill 4 tông).
3. **Thứ tự**: type → màu → khung (margin, title row, heading mỗi khối) → trạng thái (empty/zero/loading/error, hover/focus/disabled) → thay component mẫu (icon card, pill, gradient, card grid) bằng blueprint.
4. **Prove it**: `inspect.mjs --app` lại vào `.taste-skill/after`, 0 FAIL ở 1440/768/390; click qua mọi link/form/menu từng hoạt động; so sánh số đo before/after trong PR.
5. **Critique** theo 7 câu hỏi của `app-screens.md §2.7` cho mỗi màn, tối đa 3 vòng.

Lưu ý môi trường: `inspect.mjs` cần Node ≥ 22 và Chrome; VM hiện có Node 20 → `nvm install 22` khi implement. Nếu không chạy được inspector, chụp màn bằng Chrome headless (đã làm cho "before") và critique thủ công, ghi rõ trong báo cáo.
