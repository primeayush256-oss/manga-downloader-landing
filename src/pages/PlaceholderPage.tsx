import AmbientBackdrop from "../components/AmbientBackdrop";
import BrandLogo from "../components/BrandLogo";

interface PlaceholderPageProps {
  title: string;
  note: string;
}

export default function PlaceholderPage({ title, note }: PlaceholderPageProps) {
  return (
    <>
      <AmbientBackdrop />
      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
        <a
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Manga Manhwa Downloader — home"
        >
          <BrandLogo size={36} interactive />
          <span className="text-[14.5px] font-bold tracking-[-0.01em] text-content">
            Manga Manhwa Downloader
          </span>
        </a>

        <div className="glass glass-sheen mt-10 w-full max-w-md rounded-[20px] px-7 py-10 animate-sheet-in">
          <h1 className="text-[1.6rem] font-extrabold leading-tight tracking-[-0.025em] text-content">
            {title}
          </h1>
          <p className="mt-3.5 text-[13.5px] leading-relaxed text-content-dim">
            {note}
          </p>
          <a href="/" className="btn-glass mt-8 w-full">
            Back to home
          </a>
        </div>
      </main>
    </>
  );
}
