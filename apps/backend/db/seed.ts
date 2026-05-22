import { db } from './index';
import { users, posts, sabotagePacks } from './schema';
import * as bcrypt from 'bcrypt';
import { calculateScoreHelper } from '../src/leaderboard/leaderboard.service';

async function main() {
  console.log('Seeding database...');

  // Clean up existing data
  await db.delete(posts);
  await db.delete(users);
  await db.delete(sabotagePacks);

  // Insert Sabotage Packs seed data
  await db.insert(sabotagePacks).values([
    {
      name: 'Gói Làm mờ',
      description: "Làm cho bài đăng của đối thủ bị mờ đi và hoàn toàn không thể đọc được. Đảm bảo mang lại sự ức chế tột độ.",
      price: 99, // $0.99
      effectType: 'blur',
    },
    {
      name: 'Gói Comic Sans',
      description: "Bắt buộc bài đăng của đối thủ hiển thị bằng phông chữ Comic Sans. Tước bỏ mọi phẩm giá doanh nghiệp của họ.",
      price: 199, // $1.99
      effectType: 'comic_sans',
    },
    {
      name: 'Gói Papyrus',
      description: "Bắt buộc bài đăng của đối thủ hiển thị bằng phông chữ Papyrus. Mang phong cách chữ cổ đại, hỗn loạn vào bài thuyết trình của họ.",
      price: 199, // $1.99
      effectType: 'papyrus',
    },
    {
      name: 'Gói Trừ Calo',
      description: 'Khấu trừ 500 Calo lãng phí từ một bài đăng mục tiêu. Kéo tụt hạng của họ trên bảng xếp hạng ngay lập tức.',
      price: 499, // $4.99
      effectType: 'deduct_calories',
    },
  ]);
  console.log('Created mock sabotage packs.');
 
  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);
 
  // Create mock users
  const [user1, user2, user3] = await db.insert(users).values([
    {
      username: 'alice',
      passwordHash,
      avatar: 'avatar_clown',
      wastedCalories: 0,
      logicViolations: 0,
    },
    {
      username: 'bob',
      passwordHash,
      avatar: 'avatar_turtle',
      wastedCalories: 0,
      logicViolations: 0,
    },
    {
      username: 'charlie',
      passwordHash,
      avatar: 'avatar_bug',
      wastedCalories: 0,
      logicViolations: 0,
    },
  ]).returning();
 
  console.log('Created mock users.');
 
  // Use the helper from leaderboard service to avoid duplication (DRY)
  const calculateScore = calculateScoreHelper;
 
  const postContents = [
    {
      title: 'Cập nhật nhanh',
      content: 'Chúng tôi đang pivoting. Không cần hỏi nhiều. Hãy tin tưởng vào quy trình!',
      authorId: user1.id,
    },
    {
      title: 'Chi tiết triển khai Clean Architecture',
      content: 'Hãy xem clean architecture cực kỳ sạch sẽ của chúng tôi:\n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nNó cực kỳ sạch và có khả năng scale.',
      authorId: user2.id,
    },
    {
      title: 'TÔI ĐANG PHÁT ĐIÊN LÊN ĐÂY',
      content: 'TẠI SAO VIỆC DEPLOY LẠI THẤT BẠI NỮA RỒI?! ĐIỀU NÀY HOÀN TOÀN KHÔNG THỂ CHẤP NHẬN ĐƯỢC! KHÁCH HÀNG ĐANG RỜI BỎ CHÚNG TA! CỨU...',
      authorId: user3.id,
    },
    {
      title: 'Cẩm nang tối thượng về Synergy',
      content: 'Chúng ta cần leverage synergy của mình để căn chỉnh core competencies và tối ưu hóa bandwidth. Bằng cách scale các paradigm và disruptive thinking của mình, chúng ta sẽ thiết lập một ecosystem hiệu suất cao. Hãy deep dive vào các KPI và OKR để thúc đẩy việc pivot của chúng ta. Chúng ta phải đảm bảo rằng các deliverables của mình được decoupled và cloud-native. Đây là cách duy nhất để monetize các microservices của chúng ta và đạt được paradigm shift. Chúng ta cần chạy một sprint để giải quyết các low-hanging fruits. Đây thực sự là một game-changer! Lộ trình của chúng ta phải agile và customer-centric. Hãy touch base vào tuần tới để thống nhất các hành động. Chúng ta nên mang việc này offline và circle back sau. Cuối cùng thì tất cả là về bottom line và bandwidth. Chúng ta cần suy nghĩ sáng tạo và bứt phá giới hạn. Đây là tình huống win-win cho mọi bên liên quan. Hãy bắt đầu ngay và làm cho nó thành công! Bạn có thể kiểm tra kỹ nhật ký máy chủ không? Tôi cần đảm bảo chúng ta không bị rớt gói tin. Điều này rất quan trọng đối với lần ra mắt MVP của chúng ta. Chúng ta không thể để xảy ra bất kỳ thời gian chết nào ở giai đoạn này! Hãy bắt đầu làm việc ngay bây giờ.',
      authorId: user1.id,
    },
    {
      title: 'CẢI TỔ TOÀN DIỆN KIẾN TRÚC MICROSERVICES',
      content: 'CHÀO CẢ NHÓM, CHÚNG TA SẼ REFACTOR TẤT CẢ SANG MICROSERVICES NGAY HÔM NAY!!!\n\nĐây là cấu hình mới:\n```yaml\nservices:\n  auth:\n    image: auth-service:latest\n  leaderboard:\n    image: leaderboard:latest\n```\n\nCHÚNG TA PHẢI DEPLOY CÁI NÀY NGAY LẬP TỨC ĐỂ TRÁNH THẢM HỌA! CÓ AI CÓ CÂU HỎI GÌ KHÔNG?! NẾU KHÔNG THÌ CHỈ CẦN MERGE VÀ CHẠY! KHÔNG ĐƯỢC CHẬM TRỄ HOẶC CHÚNG TA SẼ TIÊU TÙNG!!!',
      authorId: user2.id,
    },
  ];
 
  for (const postData of postContents) {
    const wastedCalories = calculateScore(postData.content);
    await db.insert(posts).values({
      title: postData.title,
      content: postData.content,
      wastedCalories,
      authorId: postData.authorId,
    });
  }
 
  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
