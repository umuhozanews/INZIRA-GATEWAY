export default function Logomark({ size = 30, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Inzira Logo"
      style={{ width: size, height: size }}
      className={`object-contain shrink-0 ${className}`}
      onError={(e) => {
        // Fallback to stylized brand badge if image fails to render
        e.target.style.display = "none";
      }}
    />
  );
}
