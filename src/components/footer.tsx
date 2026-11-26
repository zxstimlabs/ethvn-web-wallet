import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="flex flex-col w-full text-left">
      <div className="flex flex-row justify-between items-center bg-primary border-t border-primary text-secondary px-2 font-bold">
        <div>Chân trang</div>
        <div>_</div>
      </div>
      <div className="grid grid-cols-1 border-2 border-primary">
        <div className="flex flex-col">
          <div className="grow border border-primary p-10">
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
              Muốn gửi góp ý?
            </h2>
            <p className="leading-7 not-first:mt-6 mb-6">
              Chúng tôi luôn mong nhận được góp ý để cải thiện sản phẩm. Đừng ngại
              liên hệ với chúng tôi.
            </p>
            <div className="flex flex-col gap-4">
              <a
                className="flex flex-row gap-2 items-center dark:text-blue-400 text-blue-500 underline underline-offset-4 w-fit"
                href="mailto:root@zxstim.com"
                target="_blank"
              >
                Email root@zxstim.com <ExternalLink className="w-4 h-4" />
              </a>
              <a
                className="flex flex-row gap-2 items-center dark:text-blue-400 text-blue-500 underline underline-offset-4 w-fit"
                href="https://github.com/zxstimlabs"
                target="_blank"
              >
                Khám phá các repository của chúng tôi <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 border border-primary [&>*:not(:last-child)]:border-r *:border-primary">
            <a target="_blank" href="https://github.com/zxstimlabs">
              <div className="flex py-6 items-center justify-center text-primary-foreground">
                <img
                  className="dark:invert"
                  src="/github.svg"
                  alt="github"
                  width={28}
                  height={28}
                />
              </div>
            </a>
            <a target="_blank" href="https://youtube.com/@zxstim">
              <div className="flex py-6 items-center justify-center text-primary-foreground">
                <img
                  className="dark:invert"
                  src="/youtube.svg"
                  alt="youtube"
                  width={28}
                  height={28}
                />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}