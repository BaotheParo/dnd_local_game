import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Flame,
  Leaf,
  Shield,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { roomStore } from "../../engine/roomStore";
import { sound } from "../../audio/synth";

export function TitleScreen() {
  const guide = useRef<HTMLDialogElement>(null);
  const [muted, setMuted] = useState(sound.getMuted());
  useEffect(() => {
    const start = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        !guide.current?.open &&
        !(
          event.target instanceof HTMLElement &&
          event.target.closest("button, input, select, textarea")
        )
      )
        roomStore.startGameFromTitle();
    };
    window.addEventListener("keydown", start);
    return () => window.removeEventListener("keydown", start);
  }, []);
  return (
    <main className="title-screen">
      <div className="title-landscape" aria-hidden="true" />
      <div className="title-shading" aria-hidden="true" />
      <div className="firefly-field" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${20 + ((i * 37) % 78)}%`,
              top: `${30 + ((i * 23) % 60)}%`,
              animationDelay: `${i * -0.7}s`,
            }}
          />
        ))}
      </div>
      <header className="title-header">
        <a
          href="#"
          className="brand-mark"
          aria-label="Trang chủ Đoàn Lữ Hành Xuyên Sương"
        >
          <span className="brand-lantern">
            <Flame size={23} strokeWidth={1.4} />
          </span>
          <span>
            XUYÊN SƯƠNG
            <span className="brand-subtitle">HUYỀN THOẠI ĐOÀN XE</span>
          </span>
        </a>
      </header>
      <section className="title-intro">
        <div className="eyebrow">
          <span /> HÀNH TRÌNH HIỆP LỰC KỲ ẢO
        </div>
        <h1>
          Đoàn Lữ Hành
          <br />
          <em>Xuyên Sương</em>
          <span className="title-period">.</span>
        </h1>
        <div className="title-rule">
          <span />
          <Sparkles size={15} strokeWidth={1.3} />
          <span />
        </div>
        <p className="title-tagline">
          Thế giới chìm trong màn sương mù.
          <br />
          Hãy là ánh sáng dẫn lối trở về nhà.
        </p>
        <p className="title-description">
          Cùng bạn bè hội ngộ. Dõi theo ánh hoa đăng. Chia sẻ bí mật, đưa ra những
          quyết định sinh tử và dẫn dắt đoàn xe cứu hộ nhỏ bé vượt qua thế giới còn
          vương bao ký ức.
        </p>
        <div className="title-actions">
          <button
            className="brass-button"
            onClick={() => roomStore.startGameFromTitle()}
          >
            <Flame size={18} /> Bắt đầu cuộc hành trình <ArrowRight size={18} />
          </button>
          <button
            className="text-button"
            onClick={() => guide.current?.showModal()}
          >
            <BookOpen size={17} /> Cách chơi & Luật lữ hành
          </button>
        </div>
        <div className="title-play-details">
          <span>
            <Users size={14} /> 3–9 người chơi
          </span>
          <span className="detail-dot">·</span>
          <span>Một chuyến phiêu lưu chung</span>
          <span className="detail-dot">·</span>
          <span>Không cần diễn xuất</span>
        </div>
      </section>
      <aside className="world-caption" aria-label="Địa điểm minh họa">
        <span className="caption-line" />
        <span>
          <small>HÀNH TRÌNH BẮT ĐẦU TẠI ĐÂY</small>Bên ngoài Tiền Trạm Đèn Lồng
        </span>
        <Compass size={25} strokeWidth={1} />
      </aside>
      <section className="title-bottom">
        <div className="adventure-principles">
          <article>
            <span className="principle-icon">
              <Compass />
            </span>
            <div>
              <h2>Tự tìm lối đi riêng</h2>
              <p>
                Chắp nối từng manh mối.
                <br />
                Cùng nhau chọn một lối đi.
              </p>
            </div>
          </article>
          <article>
            <span className="principle-icon">
              <Shield />
            </span>
            <div>
              <h2>Mỗi người đều quan trọng</h2>
              <p>
                Mỗi đội một sở trường.
                <br />
                Một đoàn người cùng trở về.
              </p>
            </div>
          </article>
          <article>
            <span className="principle-icon">
              <Leaf />
            </span>
            <div>
              <h2>Thắp lên một tia sáng</h2>
              <p>
                Những người bạn cứu sẽ luôn nhớ.
                <br />
                Thế giới này cũng vậy.
              </p>
            </div>
          </article>
        </div>
        <button
          className="mission-teaser"
          onClick={() => guide.current?.showModal()}
          aria-label="Đọc về Chuyến Giao Đèn Cuối Cùng"
        >
          <div className="mission-thumbnail" aria-hidden="true" />
          <span>
            <small>CHUYẾN XUẤT PHÁT ĐẦU TIÊN</small>
            <strong>Chuyến Giao Đèn Cuối Cùng</strong>
            <span>Một món hàng vô giá. Một khu rừng tràn đầy bất ngờ.</span>
          </span>
          <ArrowRight size={19} />
        </button>
      </section>
      <footer className="title-footer">
        <span>
          <span className="status-dot" /> BẢN CHƠI THỬ NỘI BỘ{" "}
          <span className="footer-divider">/</span> CHƯƠNG I
        </span>
        <span>Dành cho những người bạn cùng tề tựu bên nhau.</span>
        <button
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
          onClick={() => setMuted(sound.toggleMute())}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          <span>Âm thanh {muted ? "Tắt" : "Bật"}</span>
        </button>
      </footer>
      <dialog
        ref={guide}
        className="guide-dialog"
        onClick={(event) => {
          if (event.target === guide.current) guide.current.close();
        }}
        aria-labelledby="guide-title"
      >
        <div className="guide-content">
          <button
            autoFocus
            className="dialog-close"
            aria-label="Đóng hướng dẫn cách chơi"
            onClick={() => guide.current?.close()}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">MỘT CHÚT ÁNH SÁNG DẪN LỐI NGÀN DẶM</span>
          <h2 id="guide-title">
            Đồng đội của bạn. Đoàn xe của bạn.
            <br />
            Con đường của bạn qua làn sương.
          </h2>
          <p>
            Vận chuyển tim đèn thần thánh đến trạm trú ẩn trong rừng. Trên đường đi,
            hãy quyết định cứu ai, kết hợp các manh mối riêng biệt và cùng giữ vững ngọn
            đèn qua cơn bão sương mù.
          </p>
          <ol>
            <li>
              <Users size={20} />
              <span>
                <strong>Tập hợp đội ngũ</strong>Chọn 3–9 vị trí trong buồng mô phỏng.
                Trưởng đoàn cũng tham gia chơi.
              </span>
            </li>
            <li>
              <BookOpen size={20} />
              <span>
                <strong>Đọc, chia sẻ, thảo luận</strong>Mỗi người nắm giữ manh mối và lựa
                chọn riêng. Trò chuyện tự nhiên là tất cả những gì bạn cần.
              </span>
            </li>
            <li>
              <Check size={20} />
              <span>
                <strong>Cùng nhau quyết định</strong>Chọn hành động, bấm Sẵn Sàng và
                cùng mở ra kết quả của toàn đội.
              </span>
            </li>
          </ol>
          <p className="prototype-note">
            Bản dựng này phục vụ chơi thử trên trình duyệt nội bộ. Tính năng kết nối mạng
            qua điện thoại đang được tiếp tục hoàn thiện.
          </p>
          <button
            className="brass-button"
            onClick={() => {
              guide.current?.close();
              roomStore.startGameFromTitle();
            }}
          >
            Tập hợp đội ngũ <ArrowRight size={18} />
          </button>
        </div>
      </dialog>
    </main>
  );
}
