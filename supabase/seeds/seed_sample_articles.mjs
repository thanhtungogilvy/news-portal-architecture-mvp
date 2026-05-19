// supabase/seeds/seed_sample_articles.mjs
// Usage: node supabase/seeds/seed_sample_articles.mjs
// Requires: NUXT_PUBLIC_SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY in env

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NUXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.NUXT_SUPABASE_SECRET_KEY
const BUCKET = 'news-thumbnails'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NUXT_PUBLIC_SUPABASE_URL or NUXT_SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Storage ─────────────────────────────────────────────────────────────────

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`listBuckets: ${error.message}`)
  if (!buckets.find(b => b.name === BUCKET)) {
    const { error: ce } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (ce) throw new Error(`createBucket: ${ce.message}`)
    console.log(`✓ Bucket '${BUCKET}' created`)
  } else {
    console.log(`✓ Bucket '${BUCKET}' already exists`)
  }
}

async function uploadImage(filename, picsumId) {
  const url = `https://picsum.photos/id/${picsumId}/800/500`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download picsum ${picsumId}: HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`upload ${filename}: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return publicUrl
}

// ── Categories ───────────────────────────────────────────────────────────────

async function ensureCategories() {
  const rows = [
    { name: 'Công nghệ',  slug: 'cong-nghe' },
    { name: 'Kinh doanh', slug: 'kinh-doanh' },
    { name: 'Thể thao',   slug: 'the-thao' },
    { name: 'Giải trí',   slug: 'giai-tri' },
    { name: 'Khoa học',   slug: 'khoa-hoc' },
  ]
  const idMap = {}
  for (const row of rows) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(row, { onConflict: 'slug' })
      .select('id, slug')
      .single()
    if (error) throw new Error(`upsert category ${row.slug}: ${error.message}`)
    idMap[row.slug] = data.id
    console.log(`✓ Category "${row.name}" → ${data.id}`)
  }
  return idMap
}

// ── Users ────────────────────────────────────────────────────────────────────

async function getAuthorId() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 })
  if (error) throw new Error(`listUsers: ${error.message}`)
  if (!data.users.length) throw new Error('No users found — create an admin user first')
  console.log(`✓ Author: ${data.users[0].email}`)
  return data.users[0].id
}

// ── Article definitions ──────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// One author profile per category — used as denormalised display name + avatar on each article.
const AUTHOR_BY_CATEGORY = {
  'cong-nghe':  { author_name: 'Nguyễn Minh Khoa',  author_avatar_url: 'https://i.pravatar.cc/150?u=minhkhoa' },
  'kinh-doanh': { author_name: 'Lê Thu Hương',       author_avatar_url: 'https://i.pravatar.cc/150?u=thuhuong' },
  'the-thao':   { author_name: 'Trần Đức Thịnh',     author_avatar_url: 'https://i.pravatar.cc/150?u=ducthinh' },
  'giai-tri':   { author_name: 'Phạm Mai Linh',      author_avatar_url: 'https://i.pravatar.cc/150?u=mailinh' },
  'khoa-hoc':   { author_name: 'Hoàng Văn Nam',      author_avatar_url: 'https://i.pravatar.cc/150?u=vannam' },
}

function buildArticles(cats, authorId, imgs) {
  const img = i => imgs[i % imgs.length]
  // reverse map: uuid → slug (to look up author profile after building articles)
  const slugById = Object.fromEntries(Object.entries(cats).map(([slug, id]) => [id, slug]))

  const articles = [
    // ── Công nghệ (8 bài) ──────────────────────────────────────────────────
    {
      title: 'OpenAI ra mắt GPT-5 với khả năng lý luận vượt trội',
      slug: 'openai-ra-mat-gpt5-kha-nang-ly-luan-vuot-troi',
      summary: 'GPT-5 được xem là bước đột phá lớn nhất của OpenAI, với khả năng lý luận đa bước và hiểu ngữ cảnh sâu hơn mọi mô hình trước đây.',
      content: '<p>OpenAI vừa chính thức ra mắt GPT-5 — mô hình ngôn ngữ lớn thế hệ mới với nhiều cải tiến đột phá so với người tiền nhiệm. Theo OpenAI, GPT-5 đạt điểm số vượt trội trên các bài kiểm tra lý luận toán học, lập trình và hiểu ngôn ngữ tự nhiên.</p><p>Mô hình mới hỗ trợ cửa sổ ngữ cảnh lên đến 2 triệu token, cho phép xử lý các tài liệu dài và phức tạp mà không mất thông tin. Đây được xem là bước tiến quan trọng trong hành trình hướng tới trí tuệ nhân tạo tổng quát (AGI).</p><p>CEO Sam Altman cho biết GPT-5 sẽ được tích hợp vào ChatGPT và API trong những tuần tới, mở ra kỷ nguyên mới cho các ứng dụng AI doanh nghiệp.</p>',
      thumbnail_url: img(0),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 4820,
      published_at: daysAgo(2),
    },
    {
      title: 'Apple công bố iPhone 17 Series: Thiết kế mới, hiệu năng đột phá',
      slug: 'apple-iphone-17-series-thiet-ke-moi-hieu-nang-dot-pha',
      summary: 'Apple vừa chính thức ra mắt iPhone 17 với thiết kế titan mỏng nhất lịch sử, chip A19 Bionic và camera 200MP.',
      content: '<p>Tại sự kiện "Glowtime 2026", Apple đã chính thức công bố dòng iPhone 17 Series gồm bốn phiên bản: iPhone 17, iPhone 17 Plus, iPhone 17 Pro và iPhone 17 Pro Max.</p><p>Điểm nổi bật nhất là chip A19 Bionic được sản xuất trên tiến trình 2nm, mang lại hiệu năng CPU nhanh hơn 30% và GPU nhanh hơn 40% so với thế hệ trước. Hệ thống camera được nâng cấp lên 200MP với khả năng quay video 8K ProRes.</p><p>Giá bán khởi điểm từ 29 triệu đồng, mở bán chính thức tại Việt Nam vào ngày 20 tháng 9.</p>',
      thumbnail_url: img(1),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 6341,
      published_at: daysAgo(5),
    },
    {
      title: 'Google Gemini 2.0 Flash: Mô hình AI nhanh nhất thế giới hiện tại',
      slug: 'google-gemini-2-flash-mo-hinh-ai-nhanh-nhat-the-gioi',
      summary: 'Google DeepMind ra mắt Gemini 2.0 Flash với tốc độ suy luận gấp đôi GPT-4o và chi phí API thấp hơn 80%.',
      content: '<p>Google DeepMind vừa phát hành Gemini 2.0 Flash — phiên bản tối ưu về tốc độ và chi phí trong gia đình Gemini 2.0. Mô hình này được thiết kế đặc biệt cho các ứng dụng cần phản hồi nhanh theo thời gian thực.</p><p>Trong các bài kiểm tra benchmark, Gemini 2.0 Flash xử lý 1.000 token/giây, nhanh gấp đôi GPT-4o. Chi phí API chỉ $0.075/triệu token đầu vào — giảm 80% so với các mô hình tier đầu.</p><p>Hiện tại, Gemini 2.0 Flash đã có mặt trong Google AI Studio và Vertex AI.</p>',
      thumbnail_url: img(2),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 3109,
      published_at: daysAgo(8),
    },
    {
      title: 'Việt Nam đẩy mạnh ứng dụng AI trong hệ thống y tế quốc gia',
      slug: 'viet-nam-day-manh-ung-dung-ai-trong-he-thong-y-te',
      summary: 'Bộ Y tế phối hợp cùng VinAI triển khai hệ thống AI chẩn đoán hình ảnh tại 50 bệnh viện tuyến tỉnh trên toàn quốc.',
      content: '<p>Bộ Y tế Việt Nam vừa ký biên bản ghi nhớ hợp tác với VinAI Research để triển khai hệ thống trí tuệ nhân tạo hỗ trợ chẩn đoán hình ảnh y tế tại 50 bệnh viện tuyến tỉnh trong giai đoạn 2026–2028.</p><p>Hệ thống AI có khả năng phân tích X-quang, CT scan và MRI với độ chính xác lên đến 97%, giúp giảm tải áp lực cho các bác sĩ chuyên khoa tại các cơ sở y tế còn thiếu nhân lực.</p><p>Dự án được kỳ vọng sẽ giúp rút ngắn thời gian chẩn đoán từ vài ngày xuống còn vài giờ, đặc biệt có giá trị trong phát hiện sớm ung thư phổi và ung thư vú.</p>',
      thumbnail_url: img(3),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 2876,
      published_at: daysAgo(12),
    },
    {
      title: 'Chip AI thế hệ mới của NVIDIA đạt hiệu suất kỷ lục tại CES 2026',
      slug: 'nvidia-chip-ai-the-he-moi-hieu-suat-ky-luc-ces-2026',
      summary: 'NVIDIA Blackwell Ultra mang lại hiệu suất training 10 exaFLOPS, gấp 5 lần thế hệ H100 và tiêu thụ điện năng ít hơn 40%.',
      content: '<p>Tại CES 2026, NVIDIA chính thức công bố kiến trúc GPU Blackwell Ultra — thế hệ chip AI mạnh nhất từ trước đến nay. Mỗi GPU GB300 đạt hiệu suất 10 petaFLOPS cho tác vụ training, trong khi cụm 8 GPU cho phép đạt 10 exaFLOPS.</p><p>CEO Jensen Huang khẳng định đây là bước tiến lớn nhất trong 30 năm lịch sử NVIDIA, cho phép huấn luyện các mô hình ngôn ngữ lớn quy mô nghìn tỷ tham số trong thời gian ngắn hơn bao giờ hết.</p><p>Các đám mây lớn như AWS, Azure và Google Cloud đã đặt hàng hàng chục nghìn chip Blackwell Ultra cho năm 2026.</p>',
      thumbnail_url: img(4),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 1987,
      published_at: daysAgo(15),
    },
    {
      title: 'Meta Quest 4 ra mắt: Ranh giới giữa thực và ảo gần như biến mất',
      slug: 'meta-quest-4-ra-mat-ranh-gioi-thuc-ao-bien-mat',
      summary: 'Meta Quest 4 sở hữu màn hình micro-OLED 8K mỗi mắt, eye-tracking và hand-tracking thế hệ mới, giá 799 USD.',
      content: '<p>Meta vừa trình làng Quest 4 — chiếc headset thực tế hỗn hợp thế hệ mới với những cải tiến vượt bậc về chất lượng hình ảnh và khả năng tương tác. Màn hình micro-OLED 8K mỗi mắt cùng công nghệ foveated rendering mang lại trải nghiệm hình ảnh sắc nét như đời thực.</p><p>Tính năng hand-tracking thế hệ 3 cho phép nhận diện từng cử động ngón tay với độ trễ dưới 5ms, trong khi eye-tracking mới hỗ trợ tương tác menu và UI bằng ánh mắt mà không cần chạm tay.</p><p>Quest 4 sẽ có mặt tại thị trường Việt Nam từ quý 3/2026 với giá khoảng 20 triệu đồng.</p>',
      thumbnail_url: img(5),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 1543,
      published_at: daysAgo(18),
    },
    {
      title: 'Cybersecurity 2026: Top 5 mối đe dọa mạng doanh nghiệp phải đối mặt',
      slug: 'cybersecurity-2026-top-5-moi-de-doa-mang-doanh-nghiep',
      summary: 'Tấn công AI-powered ransomware, deepfake phishing và supply chain attack là những mối đe dọa hàng đầu năm 2026 theo báo cáo của Gartner.',
      content: '<p>Báo cáo an ninh mạng toàn cầu 2026 của Gartner chỉ ra rằng các cuộc tấn công mạng ngày càng tinh vi hơn nhờ sự ứng dụng của AI vào các công cụ tấn công. Thiệt hại toàn cầu từ tội phạm mạng ước tính đạt 10,5 nghìn tỷ USD năm 2026.</p><p>Đứng đầu danh sách là AI-powered ransomware — loại mã độc tự thích ứng để vượt qua các hệ thống phòng thủ truyền thống. Tiếp theo là deepfake phishing, nơi kẻ tấn công dùng video và giọng nói giả để lừa đảo chuyển khoản ngân hàng.</p><p>Các chuyên gia khuyến nghị doanh nghiệp Việt Nam cần đầu tư vào Zero Trust Architecture và nâng cao nhận thức bảo mật cho nhân viên.</p>',
      thumbnail_url: img(6),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 2234,
      published_at: daysAgo(22),
    },
    {
      title: 'Chuyển đổi số doanh nghiệp SME: Cơ hội và thách thức năm 2026',
      slug: 'chuyen-doi-so-sme-co-hoi-thach-thuc-2026',
      summary: 'Chỉ 23% doanh nghiệp vừa và nhỏ Việt Nam đã hoàn thành chuyển đổi số, trong khi 67% còn đang trong giai đoạn thử nghiệm.',
      content: '<p>Theo khảo sát của Phòng Thương mại và Công nghiệp Việt Nam (VCCI), chuyển đổi số đang là ưu tiên hàng đầu của 85% doanh nghiệp vừa và nhỏ (SME) tại Việt Nam. Tuy nhiên, chỉ 23% trong số này đã hoàn thành lộ trình chuyển đổi số cơ bản.</p><p>Rào cản lớn nhất được xác định là thiếu nhân lực công nghệ (68%), tiếp theo là chi phí đầu tư cao (54%) và thiếu chiến lược rõ ràng (41%). Chính phủ đã triển khai chương trình hỗ trợ 10.000 tỷ đồng giúp các SME tiếp cận công nghệ số.</p><p>Các chuyên gia nhận định cloud computing, AI và tự động hóa quy trình (RPA) là ba lĩnh vực SME cần ưu tiên đầu tư trong năm 2026.</p>',
      thumbnail_url: img(7),
      category_id: cats['cong-nghe'],
      author_id: authorId,
      status: 'published',
      view_count: 1102,
      published_at: daysAgo(28),
    },

    // ── Kinh doanh (6 bài) ────────────────────────────────────────────────
    {
      title: 'Thị trường chứng khoán Việt Nam tăng trưởng 18% trong quý I/2026',
      slug: 'thi-truong-chung-khoan-viet-nam-tang-truong-q1-2026',
      summary: 'VN-Index vượt mốc 1.500 điểm lần đầu tiên trong lịch sử, thanh khoản trung bình đạt 25.000 tỷ đồng/phiên.',
      content: '<p>Thị trường chứng khoán Việt Nam ghi nhận quý I/2026 lịch sử với VN-Index lần đầu tiên chạm và vượt ngưỡng 1.500 điểm. Tính từ đầu năm, chỉ số này tăng 18%, đứng trong top 3 thị trường tăng mạnh nhất khu vực châu Á.</p><p>Thanh khoản trung bình đạt 25.000 tỷ đồng/phiên — mức cao kỷ lục — phản ánh sự tham gia tích cực của nhà đầu tư trong và ngoài nước. Khối ngoại mua ròng 8.500 tỷ đồng trong ba tháng đầu năm.</p><p>Các nhóm cổ phiếu dẫn dắt thị trường gồm bất động sản khu công nghiệp, ngân hàng và công nghệ. Nhiều chuyên gia dự báo VN-Index có thể tiến tới 1.700 điểm vào cuối năm 2026.</p>',
      thumbnail_url: img(8),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 3456,
      published_at: daysAgo(3),
    },
    {
      title: 'Vingroup đầu tư 2 tỷ USD vào hệ sinh thái năng lượng tái tạo',
      slug: 'vingroup-dau-tu-2-ty-usd-nang-luong-tai-tao',
      summary: 'Tập đoàn Vingroup công bố kế hoạch đầu tư 2 tỷ USD vào điện mặt trời, điện gió và lưu trữ năng lượng trong giai đoạn 2026–2030.',
      content: '<p>Tập đoàn Vingroup vừa công bố chiến lược chuyển dịch mạnh sang lĩnh vực năng lượng tái tạo với tổng vốn đầu tư dự kiến 2 tỷ USD trong giai đoạn 2026–2030. Đây là khoản đầu tư năng lượng xanh lớn nhất từ khu vực tư nhân trong lịch sử Việt Nam.</p><p>Vingroup sẽ triển khai các trang trại điện mặt trời tổng công suất 3.000 MW và điện gió ngoài khơi 1.500 MW. Song song đó, tập đoàn sẽ đầu tư vào hệ thống pin lưu trữ năng lượng quy mô lớn phục vụ lưới điện quốc gia.</p><p>Chủ tịch Phạm Nhật Vượng khẳng định: "Đây không chỉ là trách nhiệm xã hội, mà còn là cơ hội kinh doanh chiến lược khi nhu cầu năng lượng sạch ngày càng tăng."</p>',
      thumbnail_url: img(9),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 2789,
      published_at: daysAgo(6),
    },
    {
      title: 'FPT Software ký hợp đồng 500 triệu USD với tập đoàn Nhật Bản',
      slug: 'fpt-software-hop-dong-500-trieu-usd-nhat-ban',
      summary: 'FPT Software vừa ký kết hợp đồng cung cấp dịch vụ IT outsourcing trị giá 500 triệu USD với một tập đoàn tài chính hàng đầu Nhật Bản.',
      content: '<p>FPT Software vừa công bố hợp đồng lớn nhất trong lịch sử công ty — hợp đồng 500 triệu USD cung cấp dịch vụ IT và chuyển đổi số cho một tập đoàn tài chính hàng đầu Nhật Bản trong vòng 5 năm.</p><p>Theo thỏa thuận, FPT Software sẽ cung cấp các giải pháp banking core system, AI analytics và cybersecurity, với đội ngũ 3.000 kỹ sư chuyên trách. Đây là bước tiến quan trọng trong mục tiêu đạt doanh thu 2 tỷ USD của FPT vào năm 2027.</p><p>Ông Nguyễn Văn Khoa, CEO FPT, cho biết: "Hợp đồng này không chỉ mang lại giá trị kinh tế mà còn khẳng định vị thế của Việt Nam trên bản đồ công nghệ toàn cầu."</p>',
      thumbnail_url: img(0),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 4123,
      published_at: daysAgo(10),
    },
    {
      title: 'Xuất khẩu phần mềm Việt Nam đạt 7,5 tỷ USD năm 2025',
      slug: 'xuat-khau-phan-mem-viet-nam-dat-7-ty-usd',
      summary: 'Ngành công nghiệp phần mềm Việt Nam tăng trưởng 22% trong năm 2025, đặt mục tiêu 15 tỷ USD vào năm 2030.',
      content: '<p>Theo báo cáo của Hiệp hội Phần mềm và Dịch vụ CNTT Việt Nam (VINASA), xuất khẩu phần mềm năm 2025 đạt 7,5 tỷ USD — tăng 22% so với năm 2024. Việt Nam hiện đứng thứ 2 khu vực Đông Nam Á về quy mô ngành phần mềm, sau chỉ Philippines.</p><p>Nhật Bản vẫn là thị trường xuất khẩu lớn nhất (35%), tiếp theo là Mỹ (28%) và châu Âu (20%). Lĩnh vực AI và data analytics ghi nhận mức tăng trưởng cao nhất ở 45%.</p><p>Chính phủ đặt mục tiêu đưa xuất khẩu phần mềm lên 15 tỷ USD vào năm 2030 với các chính sách ưu đãi thuế và hỗ trợ đào tạo nhân lực công nghệ cao.</p>',
      thumbnail_url: img(1),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 1876,
      published_at: daysAgo(14),
    },
    {
      title: 'Ngân hàng số Việt Nam: 60% giao dịch thực hiện trên mobile vào 2026',
      slug: 'ngan-hang-so-viet-nam-60-phan-tram-giao-dich-mobile',
      summary: 'Tỷ lệ người dùng mobile banking tại Việt Nam đạt 65 triệu người, đưa Việt Nam vào top 5 thị trường ngân hàng số phát triển nhanh nhất Đông Nam Á.',
      content: '<p>Ngân hàng Nhà nước Việt Nam vừa công bố báo cáo thanh toán số năm 2025 với những con số ấn tượng: 60% tổng lượng giao dịch ngân hàng được thực hiện qua kênh mobile — tăng từ 42% của năm 2024.</p><p>Số lượng người dùng mobile banking đạt 65 triệu — tăng 28% trong một năm. Tổng giá trị giao dịch qua kênh số đạt 150 nghìn tỷ đồng/ngày, gấp 3 lần so với năm 2023.</p><p>VietQR — hệ thống thanh toán QR liên ngân hàng — đóng vai trò quan trọng trong việc phổ cập thanh toán không tiền mặt, với hơn 2 triệu điểm chấp nhận thanh toán trên toàn quốc.</p>',
      thumbnail_url: img(2),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 1654,
      published_at: daysAgo(20),
    },
    {
      title: 'Startup Việt Nam gọi vốn thành công vòng Series B: 50 triệu USD',
      slug: 'startup-viet-nam-series-b-50-trieu-usd',
      summary: 'Startup fintech MoMo nâng cấp vị thế với vòng gọi vốn Series B trị giá 50 triệu USD từ các quỹ đầu tư hàng đầu châu Á.',
      content: '<p>Một startup fintech hàng đầu Việt Nam vừa hoàn thành vòng gọi vốn Series B trị giá 50 triệu USD từ các quỹ đầu tư lớn của Nhật Bản, Hàn Quốc và Singapore. Đây là vòng gọi vốn lớn nhất của một startup fintech Việt Nam trong năm 2026.</p><p>Số tiền sẽ được dùng để mở rộng sang thị trường Đông Nam Á, phát triển sản phẩm cho vay tiêu dùng và đầu tư vào hạ tầng bảo mật. Startup hiện phục vụ hơn 10 triệu người dùng tích cực mỗi tháng.</p><p>Giám đốc điều hành chia sẻ: "Chúng tôi sẽ sử dụng nguồn vốn này để xây dựng hệ sinh thái tài chính toàn diện nhất cho người Việt, từ thanh toán đến đầu tư và bảo hiểm."</p>',
      thumbnail_url: img(3),
      category_id: cats['kinh-doanh'],
      author_id: authorId,
      status: 'published',
      view_count: 2341,
      published_at: daysAgo(25),
    },

    // ── Thể thao (5 bài) ──────────────────────────────────────────────────
    {
      title: 'Đội tuyển Việt Nam lần đầu tiên trong lịch sử vào vòng chung kết World Cup',
      slug: 'doi-tuyen-viet-nam-lan-dau-vao-world-cup',
      summary: 'Với chiến thắng 2-1 trước Indonesia trong trận play-off, đội tuyển Việt Nam chính thức giành vé dự World Cup 2026 tại Mỹ-Canada-Mexico.',
      content: '<p>Lịch sử bóng đá Việt Nam đã được viết lại! Đêm 15 tháng 11 năm 2025, đội tuyển quốc gia đã vượt qua Indonesia với tỷ số 2-1 trong trận play-off vòng loại cuối cùng, giành tấm vé lịch sử tham dự World Cup 2026.</p><p>Bàn thắng quyết định được ghi bởi Nguyễn Xuân Son ở phút 87, khiến 90.000 khán giả trên sân Mỹ Đình và hàng chục triệu người theo dõi qua truyền hình vỡ òa trong niềm vui và tự hào.</p><p>Huấn luyện viên Kim Sang-sik sau trận cho biết: "Đây là thành quả của cả một quá trình dài chuẩn bị và nỗ lực không ngừng. Chúng tôi sẽ không dừng lại ở đây."</p>',
      thumbnail_url: img(4),
      category_id: cats['the-thao'],
      author_id: authorId,
      status: 'published',
      view_count: 98450,
      published_at: daysAgo(1),
    },
    {
      title: 'Câu lạc bộ Hà Nội FC vô địch AFF Champions League mùa 2025/26',
      slug: 'ha-noi-fc-vo-dich-aff-champions-league-2025-26',
      summary: 'Hà Nội FC xuất sắc đánh bại Johor Darul Ta\'zim 3-1 trong trận chung kết, giành danh hiệu châu lục đầu tiên trong lịch sử bóng đá Việt Nam.',
      content: '<p>Câu lạc bộ Hà Nội FC đã tạo nên kỳ tích lịch sử khi vô địch AFF Champions League 2025/26 sau chiến thắng 3-1 trước đương kim vô địch Johor Darul Ta\u2019zim của Malaysia trong trận chung kết diễn ra tại Hà Nội.</p><p>Công Phương ghi cú đúp và kiến tạo một bàn, trở thành người hùng của trận đấu. Đây là danh hiệu châu lục đầu tiên trong lịch sử bóng đá câu lạc bộ Việt Nam, một cột mốc đáng tự hào.</p><p>Cổ động viên đã tràn xuống đường ăn mừng tại nhiều tỉnh thành trên cả nước. Thủ tướng Chính phủ đã gửi điện chúc mừng tới toàn đội.</p>',
      thumbnail_url: img(5),
      category_id: cats['the-thao'],
      author_id: authorId,
      status: 'published',
      view_count: 45230,
      published_at: daysAgo(4),
    },
    {
      title: 'Nguyễn Thị Oanh phá kỷ lục quốc gia 5000m, hướng tới Olympic 2028',
      slug: 'nguyen-thi-oanh-pha-ky-luc-quoc-gia-5000m',
      summary: 'VĐV Nguyễn Thị Oanh lập kỷ lục quốc gia mới cự ly 5000m với thành tích 14:52.3, vượt qua chuẩn B Olympic Los Angeles 2028.',
      content: '<p>Vận động viên điền kinh Nguyễn Thị Oanh tiếp tục khẳng định đẳng cấp hàng đầu Đông Nam Á khi phá kỷ lục quốc gia cự ly 5000m tại giải Điền kinh Quốc tế châu Á ở Tokyo với thành tích 14 phút 52 giây 3.</p><p>Thành tích này không chỉ là kỷ lục quốc gia mới mà còn vượt qua chuẩn B dự Olympic Los Angeles 2028 (15 phút 10 giây), mở ra cơ hội lớn cho nữ VĐV sinh năm 1999 góp mặt tại Thế vận hội lần thứ ba.</p><p>Oanh cho biết: "Tôi vẫn còn nhiều dư địa cải thiện thành tích. Mục tiêu của tôi là đạt chuẩn A và lọt vào tốp 8 tại Olympic 2028."</p>',
      thumbnail_url: img(6),
      category_id: cats['the-thao'],
      author_id: authorId,
      status: 'published',
      view_count: 12340,
      published_at: daysAgo(9),
    },
    {
      title: 'Việt Nam giành HCV bóng rổ 3x3 tại SEA Games 34',
      slug: 'viet-nam-gianh-hcv-bong-ro-3x3-sea-games-34',
      summary: 'Đội tuyển bóng rổ 3x3 nữ Việt Nam lần đầu giành huy chương vàng SEA Games sau chiến thắng nghẹt thở trước Philippines.',
      content: '<p>Đội tuyển bóng rổ 3x3 nữ Việt Nam đã tạo nên cú sốc lớn tại SEA Games 34 khi vượt qua đương kim vô địch Philippines 21-18 trong trận chung kết để giành huy chương vàng lịch sử.</p><p>Nguyễn Huỳnh Như với 8 điểm trong trận chung kết đã được bầu chọn là MVP của giải. Đây là huy chương vàng đầu tiên của bóng rổ nữ Việt Nam tại Đại hội Thể thao Đông Nam Á.</p><p>Liên đoàn Bóng rổ Việt Nam (VBA) đặt mục tiêu dự giải vô địch thế giới 3x3 năm 2027 sau thành công này. Ngân sách đầu tư cho bóng rổ sẽ tăng gấp đôi trong giai đoạn 2026–2028.</p>',
      thumbnail_url: img(7),
      category_id: cats['the-thao'],
      author_id: authorId,
      status: 'published',
      view_count: 8976,
      published_at: daysAgo(16),
    },
    {
      title: 'F1 Vietnam Grand Prix 2027: Hà Nội chính thức lọt vào lịch thi đấu',
      slug: 'f1-vietnam-grand-prix-2027-ha-noi-chinh-thuc',
      summary: 'Formula 1 xác nhận chặng đua tại Hà Nội sẽ trở lại vào năm 2027 với đường đua được nâng cấp toàn diện qua trung tâm thành phố.',
      content: '<p>Tổ chức Formula 1 vừa chính thức công bố lịch thi đấu mùa 2027 với sự trở lại của chặng đua Việt Nam tại Hà Nội. Đây là tin vui lớn cho giới mộ điệu tốc độ sau khi chặng đua bị hoãn từ năm 2020.</p><p>Đường đua mới được thiết kế lại với chiều dài 5,607km, chạy qua các địa danh nổi tiếng của Hà Nội như Hồ Tây, phố cổ và Lăng Chủ tịch Hồ Chí Minh. Ban tổ chức dự kiến thu hút 200.000 khán giả và mang lại doanh thu du lịch 500 triệu USD.</p><p>Chặng đua dự kiến diễn ra vào tháng 4 năm 2027, trước chặng Monaco. Tổng vốn đầu tư hạ tầng phục vụ sự kiện ước tính 3.000 tỷ đồng.</p>',
      thumbnail_url: img(8),
      category_id: cats['the-thao'],
      author_id: authorId,
      status: 'published',
      view_count: 5432,
      published_at: daysAgo(23),
    },

    // ── Giải trí (5 bài) ──────────────────────────────────────────────────
    {
      title: 'Phim "Đất Rừng Phương Nam 2" chính thức bấm máy, dự kiến ra mắt Tết 2027',
      slug: 'dat-rung-phuong-nam-2-bam-may-ra-mat-tet-2027',
      summary: 'Nhà sản xuất Trần Thị Bích Ngọc xác nhận phần 2 của bộ phim ăn khách năm 2023 đã chính thức bấm máy với kinh phí 80 tỷ đồng.',
      content: '<p>Sau thành công vang dội với hơn 140 tỷ đồng doanh thu phòng vé năm 2023, "Đất Rừng Phương Nam" chính thức được sản xuất phần 2 với tổng kinh phí 80 tỷ đồng — lớn nhất trong lịch sử điện ảnh Việt Nam.</p><p>Phim tiếp nối hành trình của cậu bé An và cha nuôi Võ Tòng, với phần lớn bối cảnh quay tại rừng U Minh Hạ và sông nước Cà Mau. Đạo diễn Nguyễn Quang Dũng sẽ tiếp tục ngồi ghế chỉ đạo.</p><p>Đặc biệt, phần 2 sẽ có sự tham gia của nhiều diễn viên nổi tiếng từ Hollywood gốc Việt, nâng tầm phim lên quy mô quốc tế. Phim dự kiến công chiếu dịp Tết Nguyên đán 2027.</p>',
      thumbnail_url: img(9),
      category_id: cats['giai-tri'],
      author_id: authorId,
      status: 'published',
      view_count: 7654,
      published_at: daysAgo(2),
    },
    {
      title: 'Sơn Tùng M-TP phát hành album "Chông Gai" sau 4 năm im lặng',
      slug: 'son-tung-mtp-album-chong-gai-4-nam-im-lang',
      summary: 'Album phòng thu thứ 3 của Sơn Tùng M-TP gồm 12 ca khúc hoàn toàn mới, với sự hợp tác cùng các nhà sản xuất âm nhạc quốc tế từ Mỹ và Hàn Quốc.',
      content: '<p>Sau 4 năm vắng bóng trong làng âm nhạc, Sơn Tùng M-TP chính thức trở lại với album phòng thu thứ 3 mang tên "Chông Gai" — một tuyên ngôn nghệ thuật đầy mạo hiểm và cá tính.</p><p>Album gồm 12 ca khúc, trong đó có sự hợp tác với nhà sản xuất Grammy Award tại Mỹ và các hitmaker K-pop hàng đầu Hàn Quốc. Phong cách âm nhạc đa dạng từ R&B, trap đến ballad Việt Nam đương đại.</p><p>Ca khúc chủ đề "Chông Gai" đã đạt 5 triệu lượt nghe trên Spotify chỉ sau 24 giờ phát hành, xác lập kỷ lục mới cho nghệ sĩ Việt trên nền tảng này.</p>',
      thumbnail_url: img(0),
      category_id: cats['giai-tri'],
      author_id: authorId,
      status: 'published',
      view_count: 18934,
      published_at: daysAgo(7),
    },
    {
      title: 'LHP Quốc tế Hà Nội 2026: Điện ảnh Việt Nam nhận 3 giải thưởng lớn',
      slug: 'lfp-quoc-te-ha-noi-2026-dien-anh-viet-nam-3-giai',
      summary: 'Liên hoan phim quốc tế Hà Nội lần thứ 7 thu hút 82 quốc gia tham dự, phim Việt Nam giành giải Bông Sen Vàng hạng mục Phim hay nhất.',
      content: '<p>Liên hoan phim quốc tế Hà Nội 2026 (HANIFF) vừa khép lại với nhiều thành công vang dội. Lần đầu tiên trong lịch sử sự kiện, điện ảnh Việt Nam giành 3 giải thưởng lớn, trong đó có Bông Sen Vàng hạng mục Phim hay nhất châu Á.</p><p>Phim đoạt giải là "Mùa Hạ Cuối Cùng" của đạo diễn Bùi Thạc Chuyên — một tác phẩm nghệ thuật sâu sắc về ký ức, tình yêu và mất mát trên nền chiến tranh Việt Nam. Phim đã được mua bản quyền phân phối tại 15 quốc gia.</p><p>HANIFF 2026 thu hút hơn 400 bộ phim từ 82 quốc gia tham dự, với tổng số khán giả hơn 150.000 người trong 10 ngày diễn ra sự kiện.</p>',
      thumbnail_url: img(1),
      category_id: cats['giai-tri'],
      author_id: authorId,
      status: 'published',
      view_count: 4321,
      published_at: daysAgo(11),
    },
    {
      title: 'Game "Rồng Thần" của studio Việt Nam đứng #1 App Store toàn cầu',
      slug: 'game-rong-than-viet-nam-dung-so-1-app-store-toan-cau',
      summary: 'Tựa game mobile RPG "Rồng Thần" của VNG đạt 10 triệu lượt tải trong tuần đầu phát hành, chinh phục vị trí số 1 App Store tại 23 quốc gia.',
      content: '<p>Một cột mốc chưa từng có trong lịch sử ngành game Việt Nam: tựa game mobile RPG "Rồng Thần" của VNG đã đạt vị trí số 1 bảng xếp hạng App Store tại 23 quốc gia, gồm Mỹ, Nhật Bản và Hàn Quốc, chỉ sau 7 ngày phát hành toàn cầu.</p><p>Game lấy cảm hứng từ thần thoại Việt Nam kết hợp với gameplay chiến thuật hiện đại. Với đồ họa 3D đạt chuẩn AAA và cốt truyện phong phú, "Rồng Thần" đã vượt qua nhiều tựa game lớn của Trung Quốc và Hàn Quốc.</p><p>Trong tuần đầu, doanh thu từ in-app purchase đạt 15 triệu USD. VNG dự kiến "Rồng Thần" sẽ mang về 200 triệu USD doanh thu trong năm đầu tiên.</p>',
      thumbnail_url: img(2),
      category_id: cats['giai-tri'],
      author_id: authorId,
      status: 'published',
      view_count: 9876,
      published_at: daysAgo(17),
    },
    {
      title: 'Hương Tràm tái xuất với MV "Đợi" đạt 10 triệu view sau 24 giờ',
      slug: 'huong-tram-tai-xuat-mv-doi-10-trieu-view',
      summary: 'Sau 2 năm rời xa ánh đèn sân khấu để điều trị bệnh, Hương Tràm trở lại với MV đầy cảm xúc, phá vỡ nhiều kỷ lục YouTube Việt Nam.',
      content: '<p>Ca sĩ Hương Tràm chính thức tái xuất làng nhạc Việt sau hơn 2 năm vắng bóng với MV \u201cĐợi\u201d \u2014 bản ballad đầy cảm xúc kể về hành trình vượt qua bệnh tật và trở về với âm nhạc.</p><p>MV đạt 10 triệu lượt xem chỉ sau 24 giờ phát hành trên YouTube, phá vỡ kỷ lục của chính ca sĩ này trước đó. Bài hát do Hương Tràm tự sáng tác trong thời gian điều trị, mang đậm dấu ấn cá nhân và sự trưởng thành về mặt âm nhạc.</p><p>Nữ ca sĩ chia sẻ: \u201cÂm nhạc đã giúp tôi vượt qua giai đoạn khó khăn nhất trong cuộc đời. Đợi là lời cảm ơn của tôi gửi tới những người đã luôn bên cạnh.\u201d</p>',
      thumbnail_url: img(3),
      category_id: cats['giai-tri'],
      author_id: authorId,
      status: 'published',
      view_count: 6543,
      published_at: daysAgo(26),
    },

    // ── Khoa học (6 bài) ──────────────────────────────────────────────────
    {
      title: 'Nhà khoa học Việt Nam phát hiện 3 loài thực vật mới tại Tây Nguyên',
      slug: 'nha-khoa-hoc-viet-nam-phat-hien-loai-thuc-vat-moi-tay-nguyen',
      summary: 'Nhóm nghiên cứu Đại học Đà Lạt phát hiện 3 loài lan rừng mới chưa từng được ghi nhận trong khoa học, đặc hữu tại hệ sinh thái rừng núi Tây Nguyên.',
      content: '<p>Nhóm nghiên cứu sinh thái học của Đại học Đà Lạt vừa công bố phát hiện 3 loài lan rừng mới chưa từng được ghi nhận trong khoa học, tìm thấy tại khu vực núi Bidoup – Núi Bà thuộc Vườn Quốc gia Bidoup-Núi Bà, tỉnh Lâm Đồng.</p><p>Nghiên cứu được đăng tải trên tạp chí khoa học quốc tế Phytotaxa (Q1), gây tiếng vang lớn trong cộng đồng khoa học thực vật học toàn cầu. Một trong ba loài được đặt tên là <em>Coelogyne vietnamensis</em> để vinh danh Việt Nam.</p><p>TS. Nguyễn Minh Hùng — trưởng nhóm nghiên cứu — cho biết đây là minh chứng cho sự đa dạng sinh học phong phú của Việt Nam, đồng thời nhấn mạnh tầm quan trọng của việc bảo tồn các hệ sinh thái rừng núi.</p>',
      thumbnail_url: img(4),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 3211,
      published_at: daysAgo(5),
    },
    {
      title: 'Nghiên cứu đột phá về ung thư của Đại học Y Hà Nội nhận giải Nobel',
      slug: 'nghien-cuu-ung-thu-dai-hoc-y-ha-noi-giai-nobel',
      summary: 'GS.TS Nguyễn Thanh Liêm và cộng sự nhận giải Nobel Y học 2025 cho công trình phát hiện cơ chế mới kiểm soát sự phân chia tế bào ung thư.',
      content: '<p>Lần đầu tiên trong lịch sử, một nhà khoa học Việt Nam nhận giải Nobel Y học. GS.TS Nguyễn Thanh Liêm cùng hai đồng nghiệp người Anh và Nhật Bản đã được Ủy ban Nobel trao giải cho công trình khám phá cơ chế protein BRCA3 trong việc kiểm soát sự phân chia tế bào ung thư vú.</p><p>Phát hiện này mở ra hướng điều trị ung thư vú mới hoàn toàn không cần hóa trị — giảm thiểu tác dụng phụ và tăng tỷ lệ sống sót lên 40%. Thử nghiệm lâm sàng giai đoạn 3 tại 15 quốc gia đang cho kết quả rất khả quan.</p><p>Giải Nobel trị giá 11 triệu SEK (~25 tỷ đồng) sẽ được trao tại Stockholm vào ngày 10 tháng 12 năm 2025. GS Liêm cho biết ông sẽ dùng một phần giải thưởng để thành lập quỹ nghiên cứu ung thư tại Việt Nam.</p>',
      thumbnail_url: img(5),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 15678,
      published_at: daysAgo(8),
    },
    {
      title: 'Việt Nam phóng thành công vệ tinh viễn thám LOTUSat-2 lên quỹ đạo',
      slug: 'viet-nam-phong-thanh-cong-ve-tinh-lotusat-2',
      summary: 'Vệ tinh LOTUSat-2 được phóng thành công từ trung tâm vũ trụ Nhật Bản, nâng cao năng lực quan sát trái đất và phòng chống thiên tai của Việt Nam.',
      content: '<p>Vệ tinh viễn thám LOTUSat-2 của Việt Nam đã được phóng thành công vào quỹ đạo thấp từ Trung tâm Vũ trụ Tanegashima, Nhật Bản, vào lúc 9 giờ 27 phút sáng ngày 15 tháng 3 năm 2026.</p><p>LOTUSat-2 là vệ tinh radar khẩu độ tổng hợp (SAR) đầu tiên của Việt Nam, có thể chụp ảnh mặt đất với độ phân giải 1 mét trong mọi điều kiện thời tiết, kể cả ban đêm. Đây là bước tiến vượt bậc so với LOTUSat-1 chỉ chụp ảnh quang học.</p><p>Vệ tinh sẽ đóng vai trò quan trọng trong giám sát thiên tai, quản lý tài nguyên và hỗ trợ nông nghiệp thông minh. Dự kiến bắt đầu cung cấp dữ liệu cho các cơ quan chức năng từ tháng 6 năm 2026.</p>',
      thumbnail_url: img(6),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 7890,
      published_at: daysAgo(13),
    },
    {
      title: 'Pin mặt trời perovskite đạt hiệu suất 45%: Kỷ lục thế giới mới',
      slug: 'pin-mat-troi-perovskite-hieu-suat-45-ky-luc-the-gioi',
      summary: 'Nhóm nghiên cứu EPFL và MIT công bố tế bào năng lượng mặt trời perovskite-silicon kết hợp đạt hiệu suất chuyển đổi 45.1%, phá vỡ kỷ lục trước đó.',
      content: '<p>Các nhà khoa học tại EPFL (Thụy Sĩ) và MIT (Mỹ) vừa công bố bước đột phá lịch sử trong công nghệ năng lượng mặt trời: tế bào quang điện perovskite-silicon kết hợp đạt hiệu suất chuyển đổi 45,1% — phá vỡ kỷ lục thế giới trước đó là 39,5%.</p><p>Bí quyết nằm ở lớp perovskite đa tầng mới với cấu trúc tinh thể tối ưu và phương pháp ghép nối đặc biệt, giảm thiểu sự tái kết hợp của các hạt tải điện. Chi phí sản xuất dự kiến rẻ hơn 30% so với tế bào silicon thuần túy hiện nay.</p><p>Nếu được thương mại hóa thành công, công nghệ này có thể giảm chi phí điện mặt trời xuống dưới 1 cent/kWh, thấp hơn cả điện than và khí đốt, tạo ra cuộc cách mạng trong ngành năng lượng toàn cầu.</p>',
      thumbnail_url: img(7),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 5432,
      published_at: daysAgo(19),
    },
    {
      title: 'Bộ Y tế phê duyệt vaccine COVID-19 thế hệ thứ 4 do Việt Nam sản xuất',
      slug: 'bo-y-te-phe-duyet-vaccine-covid-19-the-he-thu-4-viet-nam',
      summary: 'Vaccine COVIVAC-4 do Viện Vắc xin và Sinh phẩm Y tế (IVAC) sản xuất được cấp phép lưu hành, hiệu quả bảo vệ 95% trước các biến thể mới.',
      content: '<p>Bộ Y tế Việt Nam vừa cấp phép lưu hành cho COVIVAC-4 — vaccine COVID-19 thế hệ thứ 4 do Viện Vắc xin và Sinh phẩm Y tế (IVAC, Nha Trang) nghiên cứu và sản xuất. Đây là vaccine COVID-19 thứ hai hoàn toàn do Việt Nam sản xuất được cấp phép.</p><p>COVIVAC-4 sử dụng công nghệ mRNA thế hệ mới, được thiết kế để bảo vệ trước 8 biến thể SARS-CoV-2 hiện lưu hành. Kết quả thử nghiệm lâm sàng giai đoạn 3 trên 30.000 người cho thấy hiệu quả bảo vệ 95%, miễn dịch kéo dài 18 tháng.</p><p>Giá thành sản xuất chỉ bằng 40% so với vaccine nhập khẩu tương đương, giúp Việt Nam có thể tiếp tục chương trình tiêm chủng mở rộng và hỗ trợ các nước kém phát triển hơn trong khu vực.</p>',
      thumbnail_url: img(8),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 4567,
      published_at: daysAgo(24),
    },
    {
      title: 'James Webb ghi lại hình ảnh thiên hà cổ đại 13,4 tỷ năm tuổi',
      slug: 'james-webb-hinh-anh-thien-ha-co-dai-13-ty-nam',
      summary: 'Kính thiên văn James Webb phát hiện thiên hà JWST-GHZ9 — cấu trúc cổ đại nhất từng quan sát được, tồn tại chỉ 400 triệu năm sau Vụ Nổ Lớn.',
      content: '<p>Kính thiên văn vũ trụ James Webb của NASA vừa ghi lại hình ảnh của JWST-GHZ9 — thiên hà cổ đại nhất từng được quan sát, tồn tại chỉ 400 triệu năm sau Vụ Nổ Lớn (Big Bang). Phát hiện này đẩy lùi giới hạn quan sát của chúng ta về thuở sơ khai của vũ trụ.</p><p>Điều đáng kinh ngạc là JWST-GHZ9 đã hình thành các ngôi sao với tốc độ cực kỳ nhanh — gấp 100 lần Dải Ngân Hà hiện tại — thách thức nhiều mô hình hình thành thiên hà hiện có. Các nhà thiên văn học đang xem xét lại lý thuyết về sự tiến hóa của vũ trụ sơ khai.</p><p>Dữ liệu phổ học từ James Webb xác nhận thiên hà này chứa lượng carbon và oxygen cao bất thường cho tuổi vũ trụ đó, gợi ý một số quá trình vật lý vũ trụ chưa được hiểu rõ.</p>',
      thumbnail_url: img(9),
      category_id: cats['khoa-hoc'],
      author_id: authorId,
      status: 'published',
      view_count: 8901,
      published_at: daysAgo(29),
    },
  ]

  // Attach author_name + author_avatar_url based on category slug
  return articles.map((article) => {
    const catSlug = slugById[article.category_id]
    const author = AUTHOR_BY_CATEGORY[catSlug] ?? { author_name: null, author_avatar_url: null }
    return { ...article, ...author }
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== News Portal — Sample Article Seeder ===\n')

  await ensureBucket()

  const picsumIds = [10, 20, 37, 45, 60, 76, 96, 110, 130, 160]
  console.log('\nUploading images...')
  const imageUrls = []
  for (const id of picsumIds) {
    const url = await uploadImage(`thumb-${id}.jpg`, id)
    console.log(`  ✓ thumb-${id}.jpg → ${url.slice(0, 60)}...`)
    imageUrls.push(url)
  }

  console.log('\nUpserting categories...')
  const catIds = await ensureCategories()

  console.log('\nResolving author...')
  const authorId = await getAuthorId()

  const articles = buildArticles(catIds, authorId, imageUrls)
  console.log(`\nInserting ${articles.length} articles...`)

  // Insert in batches to avoid request size limits
  const BATCH = 10
  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH)
    const { error } = await supabase.from('news').upsert(batch, { onConflict: 'slug' })
    if (error) throw new Error(`Upsert batch ${i / BATCH + 1}: ${error.message}`)
    console.log(`  ✓ Batch ${i / BATCH + 1} inserted (${batch.length} articles)`)
  }

  console.log(`\n✅  Done! ${articles.length} articles seeded successfully.`)
  console.log(`   Storage bucket: ${BUCKET}`)
  console.log(`   Thumbnail images: ${imageUrls.length}`)
  console.log(`   Categories: ${Object.keys(catIds).length}`)
}

main().catch((err) => {
  console.error('\n❌ ', err.message)
  process.exit(1)
})
