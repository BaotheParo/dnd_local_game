/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentPack } from '../types/game';

// Gói nhiệm vụ thứ hai chứng minh kiến trúc nội dung mô-đun của hệ thống
export const MISSION_2_PACK: ContentPack = {
  id: 'the_switched_signs',
  version: '1.0.0',
  title: 'Những Biển Chỉ Dẫn Bị Đổi Tại Thung Lũng Rỗng',
  synopsis:
    'Điều tra các mốc đá chỉ đường bị phá hoại tại Thung Lũng Rỗng để ngăn đoàn xe buôn lao vào đầm lầy cát lún.',
  playerRange: [3, 9],
  entrySceneId: 'lobby',
  initialResources: {
    supplies: 7,
    integrity: 5,
    alarm: 1,
  },
  scenes: {
    lobby: {
      id: 'lobby',
      type: 'lobby',
      title: 'Khu Tập Kết Thung Lũng Rỗng',
      subtitle: 'Chuẩn Bị Điều Tra Biển Chỉ Đường',
      publicNarration:
        'Báo cáo cho thấy các tinh linh sương mù tinh nghịch đã thay đổi các mốc đá tại ngã tư. Hãy xác nhận đội ngũ sẵn sàng trước khi tiến vào vùng đầm lầy.',
    },
    ferry_rescue: {
      id: 'ferry_rescue',
      type: 'narrative_choice',
      title: 'Cỗ Xe Buôn Mắc Lầy',
      subtitle: 'Ranh Giới Đầm Lầy · Cột Mốc Số 3',
      publicNarration:
        'Một đoàn thương nhân bị lún bánh xe sâu trong lớp bùn lóng lánh. Đàn thú kéo của họ đang hoảng loạn trước những đốm ma trơi ca hát.',
      options: [
        {
          id: 'rescue_aboard',
          title: 'Dùng Tời Xe Kéo Cỗ Xe Ra',
          description: 'Tiêu tốn 2 Lương thảo gồm cáp chịu lực và nhiên liệu để kéo họ ra an toàn.',
          suppliesCost: 2,
          nextSceneId: 'bridge_puzzle',
          effectsSummary: '-2 Lương thảo · Cứu được xe buôn · Nhận được lòng biết ơn của thương nhân',
        },
        {
          id: 'rescue_signal',
          title: 'Thắp Pháo Sáng Mặt Đất',
          description: 'Xua đuổi ma trơi bằng pháo sáng, giúp họ từ từ tự thoát ra.',
          alarmCost: 1,
          nextSceneId: 'bridge_puzzle',
          effectsSummary: '+1 Báo động · 0 Lương thảo tiêu tốn',
        },
      ],
    },
    bridge_puzzle: {
      id: 'bridge_puzzle',
      type: 'clue_puzzle',
      title: 'Giải Mã Ba Phiến Đá Cổ Tự',
      subtitle: 'Ngã Tư Đầm Lầy',
      publicNarration:
        'Ba mốc đá chạm khắc chỉ về ba thung lũng khác nhau. Đối chiếu manh mối của từng đội để nhận diện lối đi chính thức của Đội Canh Rừng.',
      clues: [
        {
          id: 'clue_1',
          number: 1,
          assignedSquad: 'pathfinder',
          title: 'Phong Cách Khắc Của Đội Canh Rừng',
          fact: 'Đá chỉ đường chính thức của Đội Canh Rừng có các rãnh xoắn ốc sâu, tuyệt đối không phải đường ziczac hình học.',
          corroboration: 'Cẩm nang Đội Dẫn Đường trang 12.',
        },
        {
          id: 'clue_2',
          number: 2,
          assignedSquad: 'mechanics',
          title: 'Đo Độ Sâu Đầm Lầy',
          fact: 'Đường Ở Giữa dẫn xuống một hố sụt sâu hơn 14 sải tay.',
          corroboration: 'Máy đo tiếng vang của Đội Cơ Khí.',
        },
        {
          id: 'clue_3',
          number: 3,
          assignedSquad: 'logistics',
          title: 'Độ Cao Ngọn Đăng Tiêu Điểm Đến',
          fact: 'Nhà an toàn điểm đến nằm trên nền đá vôi cao, không phải đầm lầy than bùn trũng.',
          corroboration: 'Nhật ký khảo sát.',
        },
        {
          id: 'clue_4',
          number: 4,
          assignedSquad: 'pathfinder',
          title: 'Mốc Đá Nhánh Phía Bắc',
          fact: 'Mốc đá Phía Bắc mang con dấu xoắn ốc chính thống của Đội Canh Rừng và dẫn lên dốc cao.',
          corroboration: 'Sổ bộ đá canh rừng.',
        },
      ],
      puzzleConfig: {
        correctBridgeId: 'north',
        maxIncorrectAttempts: 2,
        hints: [
          {
            level: 1,
            text: 'Tập trung vào vết đục và tính xác thực của nét chạm khắc trên đá.',
            alarmCost: 1,
          },
          {
            level: 2,
            text: 'Đường Phía Bắc mang họa tiết xoắn ốc chuẩn xác của Đội Canh Rừng.',
            alarmCost: 1,
          },
        ],
      },
      nextSceneId: 'silent_market',
    },
    silent_market: {
      id: 'silent_market',
      type: 'group_prediction',
      title: 'Giếng Hiến Tế Thung Lũng',
      subtitle: 'Đền Thờ Tinh Linh',
      publicNarration:
        'Trước khi tiến sâu vào rừng cây, lữ khách dâng tặng những món đồ kỳ lạ nhỏ bé để làm vui lòng các tinh linh canh giữ.',
      predictionConfig: {
        question: 'Món quà nào sẽ làm Nữ Hoàng Tinh Linh Thung Lũng hài lòng nhất?',
        options: ['Mật Ong Thông Ngọt', 'Sợi Chỉ Bạc', 'Một Câu Đố Vần'],
      },
      nextSceneId: 'rest_stop',
    },
    rest_stop: {
      id: 'rest_stop',
      type: 'rest_stop',
      title: 'Tiền Đồn Vách Đá Vôi',
      subtitle: 'Rặng Núi Phòng Thủ Vững Chãi',
      publicNarration:
        'Một gờ đá vôi kiên cố mang lại sự bảo vệ trước chặng nước rút cuối cùng qua bầy ma trơi.',
      options: [
        {
          id: 'perform_repair',
          title: 'Cân Chỉnh Thân Xe & Gia Cố Giáp Bảo Vệ',
          description: 'Dùng 3 Lương thảo để phục hồi 1 Độ bền.',
          suppliesCost: 3,
          nextSceneId: 'storm_challenge',
          effectsSummary: '-3 Lương thảo · Phục hồi +1 Độ bền',
        },
        {
          id: 'conserve_rest',
          title: 'Bảo Toàn & Tiến Về Phía Trước',
          description: 'Giữ lại toàn bộ lương thảo cho trạm giao hàng.',
          nextSceneId: 'storm_challenge',
          effectsSummary: '0 Lương thảo tiêu tốn',
        },
      ],
    },
    storm_challenge: {
      id: 'storm_challenge',
      type: 'storm_challenge',
      title: 'Vượt Qua Bầy Ma Trơi Cuồng Loạn',
      subtitle: 'Phòng Thủ Bầy Ma Trơi',
      publicNarration:
        'Hàng trăm đốm ma trơi phát sáng lao xuống hòng dập tắt đèn pha của đoàn xe! Hãy dựng khiên bảo vệ các vị trí, truyền động cơ cho bánh xe và xua đuổi các sinh vật.',
      stormConfig: {
        totalRounds: 3,
        targetPowerRounds: 2,
      },
      nextSceneId: 'delivery_ending',
    },
    delivery_ending: {
      id: 'delivery_ending',
      type: 'mission_delivery',
      title: 'Đến Pháo Đài Đá Vôi',
      subtitle: 'Nhiệm Vụ Hoàn Thành',
      publicNarration:
        'Đoàn xe lăn bánh qua cánh cổng kiên cố của Pháo Đài Đá Vôi, dẫn dắt các cỗ xe thương nhân lạc lối theo sau đến nơi an toàn.',
    },
  },
};
