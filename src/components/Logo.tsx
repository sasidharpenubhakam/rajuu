import logo from "../assests/sathyabhaama logo.jpeg";

export function Logo({ size = 60 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Sathyabhaama"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white shadow-md shrink-0"
      />

      <div className="flex flex-col leading-tight">
        <span className="font-display text-2xl font-semibold text-primary tracking-tight">
          Sathyabhaama.in
        </span>

        <span className="text-[10px] uppercase tracking-[0.18em] text-accent">
          Wear Confidence
        </span>
      </div>
    </div>
  );
}