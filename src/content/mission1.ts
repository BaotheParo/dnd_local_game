/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentPack } from '../types/game';

export const MISSION_1_PACK: ContentPack = {
  id: 'last_lantern_delivery',
  version: '2.0.0',
  title: 'Chuyến Giao Đèn Cuối Cùng',
  synopsis:
    'Vận chuyển tim đèn thần thánh đến trạm trú ẩn Rừng Thông Thì Thầm hẻo lánh trước khi màn sương mù dâng cao phong tỏa mọi nẻo đường rừng.',
  playerRange: [3, 9],
  entrySceneId: 'lobby',
  initialResources: {
    supplies: 6,
    integrity: 5,
    alarm: 0,
  },
  scenes: {
    lobby: {
      id: 'lobby',
      type: 'lobby',
      title: 'Tập Hợp Tại Tiền Trạm Đèn Lồng',
      subtitle: 'Chuẩn Bị Đội Ngũ Cứu Hộ',
      publicNarration:
        'Sương mù đang dày đặc dần bên ngoài Tiền Trạm Đèn Lồng. Hãy tập hợp đội ngũ, xác nhận vị trí phân công và kiểm tra kỹ lưỡng cỗ xe chạy bằng cổ tự trước giờ xuất hành.',
    },
    ferry_rescue: {
      id: 'ferry_rescue',
      type: 'narrative_choice',
      title: 'Mắc Kẹt Tại Bến Phà Tang Tóc',
      subtitle: 'Bến Phà Vượt Sông · Cách Tiền Trạm 1.4 Dặm',
      publicNarration:
        'Tại bến sông phủ đầy sương khói, một gia đình thợ thủ công đang co ro bên chiếc sà lan ngập nước giữa dòng nước lũ dâng cao đe dọa nơi trú ẩn. Người trưởng lão giơ cao ngọn đèn báo nạn màu hổ phách về phía đoàn xe chúng ta. Nước sông đang dâng rất nhanh.',
      options: [
        {
          id: 'rescue_aboard',
          title: 'Đón Họ Lên Xe',
          description:
            'Đưa gia đình và hành lý thiết yếu của họ vào bên trong khoang hành khách. Tiêu tốn 1 Lương thảo làm khẩu phần ấm và tăng thêm 1 đơn vị tải trọng cho cỗ xe. Cần thêm một tầng khiên chắn bảo vệ ở đợt bão sương thứ hai.',
          suppliesCost: 1,
          nextSceneId: 'bridge_puzzle',
          effectsSummary: '-1 Lương thảo · +1 Tải trọng xe · Gia đình an toàn trên xe · Cần thêm khiên chắn lúc bão',
        },
        {
          id: 'rescue_gear',
          title: 'Triển Khai Dụng Cụ Cứu Hộ',
          description:
            'Trang bị dây tời chịu lực và bùa nổi của đoàn xe cho chiếc sà lan của họ. Gia đình có thể xuôi dòng an toàn bằng thuyền mà không làm tăng gánh nặng tải trọng cho đoàn lữ hành.',
          suppliesCost: 2,
          nextSceneId: 'bridge_puzzle',
          effectsSummary: '-2 Lương thảo · Gia đình an toàn bằng thuyền · Không tăng tải trọng xe',
        },
        {
          id: 'rescue_signal',
          title: 'Bắn Tín Hiệu Cho Đội Tuần Tra Sông',
          description:
            'Bắn pháo sáng khẩn cấp để báo hiệu cho chiếc thuyền nhỏ của Người Canh Đèn phía sau chúng ta. Bảo toàn được lương thảo và tải trọng, nhưng làm tăng mức độ cảnh giác và nguy cơ báo động.',
          alarmCost: 1,
          nextSceneId: 'bridge_puzzle',
          effectsSummary: '+1 Báo động · 0 Lương thảo tiêu tốn · Chờ đội tuần tra đến cứu hộ',
        },
      ],
    },
    bridge_puzzle: {
      id: 'bridge_puzzle',
      type: 'clue_puzzle',
      title: 'Cầu Tam Chung',
      subtitle: 'Hẻm Nước Xoáy',
      publicNarration:
        'Ba cây cầu đá cổ kính bắc ngang hẻm núi sương mù cuộn xoáy. Cửa xả lũ thượng nguồn đã thay đổi điều kiện lòng sông; mỗi nhịp cầu đều mang giới hạn tải trọng và phù hiệu cổ tự riêng biệt. Hãy đối chiếu các manh mối của từng đội để tìm ra cây cầu an toàn duy nhất.',
      clues: [
        {
          id: 'clue_1',
          number: 1,
          assignedSquad: 'mechanics',
          assignedRole: 'Engineer',
          title: 'Quy Cách Tải Trọng Thân Xe',
          fact: 'Tải trọng cơ bản của Đoàn Xe Xuyên Sương là chính xác 6 đơn vị.',
          corroboration: 'Ghi nhận trong sổ lưu trữ cổ tự của Tiền Trạm Đèn Lồng.',
        },
        {
          id: 'clue_2',
          number: 2,
          assignedSquad: 'logistics',
          assignedRole: 'Guardian',
          title: 'Bản Kê Khai Hành Khách & Hàng Hóa',
          fact: 'Đón gia đình gặp nạn lên xe sẽ làm tăng đúng 1 đơn vị tải trọng (tổng là 7). Nếu cứu họ bằng dụng cụ cứu hộ, tải trọng xe vẫn giữ nguyên là 6.',
          corroboration: 'Tính toán dựa trên giường khoang hành khách và chăn sưởi khẩn cấp.',
        },
        {
          id: 'clue_3',
          number: 3,
          assignedSquad: 'logistics',
          assignedRole: 'Scout',
          title: 'Hàng Hóa Nhiệm Vụ Thiết Yếu',
          fact: 'Tim đèn thiêng liêng và dầu hỏa thuật luyện kim là một phần tải trọng cơ bản, tuyệt đối không thể bỏ lại.',
          corroboration: 'Có dấu niêm phong của Trưởng trạm trên cửa khoang hàng.',
        },
        {
          id: 'clue_4',
          number: 4,
          assignedSquad: 'pathfinder',
          assignedRole: 'Scout',
          title: 'Thông Số Cầu Phía Bắc',
          fact: 'Cầu Phía Bắc có sức chịu tải tối đa là 8 đơn vị và mang biểu tượng Cổng Thái Dương (Mặt Trời Vàng).',
          corroboration: 'Khắc trên trụ đá phía bắc nhịp cầu.',
        },
        {
          id: 'clue_5',
          number: 5,
          assignedSquad: 'mechanics',
          assignedRole: 'Engineer',
          title: 'Thông Số Cầu Ở Giữa',
          fact: 'Cầu Ở Giữa có sức chịu tải tối đa là 10 đơn vị và mang biểu tượng Cổng Nguyệt Quang (Trăng Bạc).',
          corroboration: 'Được xây dựng bởi Hội Bánh Răng Cổ Tự từ Kỷ Nguyên Đầu Tiên.',
        },
        {
          id: 'clue_6',
          number: 6,
          assignedSquad: 'pathfinder',
          assignedRole: 'Guardian',
          title: 'Thông Số Cầu Phía Nam',
          fact: 'Cầu Phía Nam có sức chịu tải tối đa là 7 đơn vị và mang biểu tượng Cổng Diệp Lục (Lá Ngọc).',
          corroboration: 'Nhịp cầu gỗ gia cố được duy trì bởi những người giữ rừng.',
        },
        {
          id: 'clue_7',
          number: 7,
          assignedSquad: 'logistics',
          assignedRole: 'Scout',
          title: 'Nhật Ký Khí Tượng Vùng Thượng Nguồn',
          fact: 'Những trận mưa xối xả đang trút nước dữ dội xuống hồ chứa trên núi cao ở thượng nguồn.',
          corroboration: 'Áp kế của Đội Hậu Cần xác nhận trận lũ lớn.',
        },
        {
          id: 'clue_8',
          number: 8,
          assignedSquad: 'mechanics',
          assignedRole: 'Engineer',
          title: 'Cơ Chế Khóa Đập Thủy Lực',
          fact: 'Mưa lũ thượng nguồn kích hoạt cơ chế khóa tràn tự động, làm thu gọn hoàn toàn nhịp Cầu Ở Giữa!',
          corroboration: 'Sơ đồ thủy lực số 419 của Hội thợ máy.',
        },
        {
          id: 'clue_9',
          number: 9,
          assignedSquad: 'pathfinder',
          assignedRole: 'Guardian',
          title: 'Hải Đồ Dẫn Đường & Điểm Đến',
          fact: 'Trạm trú ẩn Rừng Thông Thì Thầm nằm ở phía sau cổng vòm Cổng Thái Dương.',
          corroboration: 'Xác nhận bởi la bàn định hướng của Đội Dẫn Đường.',
        },
      ],
      puzzleConfig: {
        correctBridgeId: 'north',
        maxIncorrectAttempts: 2,
        hints: [
          {
            level: 1,
            text: 'Hãy chú ý đến biểu tượng cổng nơi cần đến, đừng chỉ nhìn vào sức chịu tải của cầu.',
            alarmCost: 1,
          },
          {
            level: 2,
            text: 'Bản đồ chỉ đường chứng minh trạm trú ẩn Rừng Thông Thì Thầm chỉ nằm sau Cổng Thái Dương.',
            alarmCost: 1,
          },
          {
            level: 3,
            text: 'Cầu Phía Bắc là lối đi duy nhất: Cầu Ở Giữa đã bị nước lũ thu lại, còn Cầu Phía Nam dẫn về Cổng Diệp Lục đi xa khỏi đích.',
            alarmCost: 1,
          },
        ],
      },
      nextSceneId: 'bridge_crossing',
    },
    bridge_crossing: {
      id: 'bridge_crossing',
      type: 'narrative_choice',
      title: 'Băng Qua Cầu Phía Bắc',
      subtitle: 'Quyết Định Về Kết Cấu',
      publicNarration:
        'Cầu Phía Bắc đã được xác định là lối đi chính xác! Tuy nhiên, thời gian và sương gió đã làm lỏng các thanh xà gỗ dẫn vào cầu. Đoàn lữ hành sẽ vượt qua hẻm núi này thế nào?',
      options: [
        {
          id: 'repair_span',
          title: 'Gia Cố Dầm Cầu Tiếp Cận',
          description:
            'Dùng 2 Lương thảo gồm gỗ xẻ và thanh giằng sắt để bắc cầu vững chắc qua khe nứt. Xe đi qua êm thuận và an toàn tuyệt đối.',
          suppliesCost: 2,
          nextSceneId: 'silent_market',
          effectsSummary: '-2 Lương thảo · Vượt cầu an toàn không tổn hại xe',
        },
        {
          id: 'detour_gorge',
          title: 'Đi Đường Vòng Dưới Khe Núi',
          description:
            'Thận trọng men theo các bãi sỏi thấp bên dưới. Tiết kiệm được toàn bộ lương thảo, nhưng việc định hướng trong làn sương mù hiểm trở sẽ làm mất thời gian quý báu.',
          alarmCost: 2,
          nextSceneId: 'silent_market',
          effectsSummary: '+2 Báo động · 0 Lương thảo tiêu tốn · Tăng áp lực sương mù',
        },
        {
          id: 'pull_span',
          title: 'Phóng Nhanh Qua Nhịp Cầu Chưa Sửa',
          description:
            'Đạp hết chân ga cổ tự và lao vút qua những thanh gỗ đang rung chuyển! Yêu cầu Kiểm Tra Rủi Ro Đổ Xúc Xắc DC 13. Người chơi có thể dốc sức cống hiến token Nỗ Lực.',
          isRiskTest: true,
          riskDc: 13,
          nextSceneId: 'silent_market',
          effectsSummary: 'Thử Thách Rủi Ro DC 13 · Thành công: Vượt qua an toàn · Thất bại: -2 Độ bền xe',
        },
      ],
    },
    silent_market: {
      id: 'silent_market',
      type: 'group_prediction',
      title: 'Chợ Không Lời Rừng Thông Thì Thầm',
      subtitle: 'Cuộc Gặp Gỡ Bên Đường',
      publicNarration:
        'Đoàn xe tạm dừng chân tại một ngã tư rừng yên ắng, nơi những lữ khách trùm áo choàng trao đổi hàng hóa mà không nói một lời. Một chiếc khánh đá kỳ lạ khắc những câu cổ thi vang lên một câu hỏi đồng điệu.',
      predictionConfig: {
        question:
          'Nếu Đoàn Xe Xuyên Sương có thể cất tiếng hát ma thuật khi đi qua sương mù sâu thẳm, đội ngũ của bạn sẽ đổi giọng hát đó lấy điều gì?',
        options: ['Sự Tĩnh Lặng Tuyệt Đối', 'Tốc Độ Thần Tốc', 'Ánh Sáng Rực Rỡ'],
      },
      nextSceneId: 'creature_tracks',
    },
    creature_tracks: {
      id: 'creature_tracks',
      type: 'narrative_choice',
      title: 'Dấu Chân Bên Chiếc Chuông Đồng',
      subtitle: 'Bìa Rừng · Hoàng Hôn',
      publicNarration:
        'Gần cột mốc đường treo những chiếc chuông đồng nhỏ, những vết chân ba ngón có màng kỳ lạ lượn quanh cột. Những chiếc chuông dường như được lau bóng loáng chứ không hề phong hóa. Sương mù bốc lên bất thường từ những vết vuốt cào.',
      options: [
        {
          id: 'investigate_tracks',
          title: 'Khảo Sát Vết Vuốt & Bộ Chuông',
          description:
            'Dùng 1 Lương thảo rắc bột định vị đèn lồng để nghiên cứu dáng đi của quái thú. Nắm được thói quen âm thanh của Quái Thú Chuông: lượt dựng khiên đầu tiên trong cơn bão chỉ tốn 1 Lương thảo thay vì 2!',
          suppliesCost: 1,
          nextSceneId: 'rest_stop',
          effectsSummary: '-1 Lương thảo · Nắm bắt chiến thuật Chuông · Giảm 1 Lương thảo cho Khiên bão đầu tiên',
        },
        {
          id: 'hurry_past',
          title: 'Nhanh Chóng Đi Qua Cột Chuông',
          description:
            'Không nấn ná ở bãi đất trống. Tiếng bánh xe lăn dội vào hàng cây ẩm ướt bắt đầu thu hút sự chú ý từ màn sương bao quanh.',
          alarmCost: 1,
          nextSceneId: 'rest_stop',
          effectsSummary: '+1 Báo động · Tiết kiệm lương thảo',
        },
        {
          id: 'scare_creature',
          title: 'Hú Còi Báo Động Để Xua Đuổi Nó',
          description:
            'Bấm còi đồng áp suất cao để đe dọa kẻ săn mồi đang rình rập. Thử Thách Rủi Ro DC 13.',
          isRiskTest: true,
          riskDc: 13,
          nextSceneId: 'rest_stop',
          effectsSummary: 'Thử Thách Rủi Ro DC 13 · Thành công: An toàn · Thất bại: -1 Độ bền xe do cành cây va đập',
        },
      ],
    },
    rest_stop: {
      id: 'rest_stop',
      type: 'rest_stop',
      title: 'Trạm Nghỉ Lò Sưởi Lữ Khách',
      subtitle: 'Lùm Cây Trú Ẩn · Giây Phút Nghỉ Ngơi Cuối',
      publicNarration:
        'Một lò sưởi khắc cổ tự kín gió mang đến cơ hội tinh chỉnh động cơ và kiểm tra độ bền thân xe trước khi đối đầu với bức tường sương mù. Kỹ Năng Kỹ Sư (dùng 1 lần/chuyến) có thể giảm chi phí sửa chữa.',
      options: [
        {
          id: 'perform_repair',
          title: 'Gia Cố Thân Xe',
          description:
            'Dùng 3 Lương thảo để phục hồi +1 Độ bền xe (Kỹ năng Kỹ Sư giảm còn 2 Lương thảo). Chỉ thực hiện được một lần tại mỗi trạm nghỉ.',
          suppliesCost: 3,
          nextSceneId: 'storm_challenge',
          effectsSummary: '-3 Lương thảo (Khôi phục +1 Độ bền) · Kỹ Sư có thể giảm còn 2',
        },
        {
          id: 'conserve_rest',
          title: 'Bảo Toàn Tài Nguyên & Tiến Lên',
          description:
            'Giữ nguyên toàn bộ lương thảo dự trữ và tiến thẳng về phía rặng thông nơi quái thú sương mù đang tụ lại.',
          nextSceneId: 'storm_challenge',
          effectsSummary: '0 Lương thảo tiêu tốn · Độ bền giữ nguyên · Tiến vào Cơn Bão',
        },
      ],
    },
    storm_challenge: {
      id: 'storm_challenge',
      type: 'storm_challenge',
      title: 'Giữ Vững Ngọn Đèn Giữa Bão Sương',
      subtitle: 'Quái Thú Sương Rung Chuông Đồng',
      publicNarration:
        'Một sinh vật khổng lồ ngưng tụ từ sương mù đặc quánh và những chiếc chuông đồng leng keng sà xuống tấn công đoàn xe! Bạn phải phối hợp qua 3 hiệp phòng thủ cam go: Dựng Khiên bảo vệ đội, nạp Lương Thảo cấp năng lượng cho động cơ, hoặc Xua Đuổi quái thú bằng pháo sáng mặt trời.',
      stormConfig: {
        totalRounds: 3,
        targetPowerRounds: 2,
      },
      nextSceneId: 'delivery_ending',
    },
    delivery_ending: {
      id: 'delivery_ending',
      type: 'mission_delivery',
      title: 'Đến Trạm Trú Ẩn Rừng Thông Thì Thầm',
      subtitle: 'Kết Thúc Hành Trình & Ghi Nhớ Mùa Giải',
      publicNarration:
        'Cỗ xe lướt ra khỏi màn sương u tối trước bức tường gỗ kiên cố của Trạm Trú Ẩn Rừng Thông Thì Thầm. Cánh cổng mở toang khi những người gác trạm nhận ra ánh lửa thiêng liêng của ngọn đèn lồng.',
    },
  },
};
