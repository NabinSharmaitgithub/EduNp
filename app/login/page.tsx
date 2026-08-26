import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-container to-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none text-white">
          <svg
            className="absolute top-10 left-10 w-64 h-64 animate-pulse"
            fill="currentColor"
            viewBox="0 0 200 200"
          >
            <path d="M45,-78.1C58.3,-71.4,69.1,-58.5,77.5,-44.1C85.9,-29.7,91.8,-14.9,90.2,-0.9C88.6,13.1,79.5,26.2,69.5,37.2C59.5,48.2,48.5,57.1,35.6,65.3C22.7,73.5,8,80.9,-6.2,84.5C-20.4,88.1,-34.1,87.9,-46.8,81.3C-59.5,74.7,-71.1,61.7,-80.1,46.7C-89.1,31.7,-95.5,14.8,-95.1,-2C-94.7,-18.8,-87.5,-35.6,-76.3,-48.9C-65.1,-62.2,-49.9,-72.1,-35.3,-78.1C-20.7,-84.1,-6.6,-86.2,8.6,-87.6C23.8,-89,31.7,-84.8,45,-78.1Z" transform="translate(100 100)" />
          </svg>
          <svg
            className="absolute bottom-10 right-10 w-72 h-72"
            style={{ animation: "pulse 10s infinite" }}
            fill="currentColor"
            viewBox="0 0 200 200"
          >
            <path d="M60.1,-60.9C76.2,-44.1,86.5,-22.1,87.2,0.7C87.9,23.5,79.1,47,63,61.8C47,76.5,23.5,82.5,0.4,82C-22.7,81.6,-45.4,74.7,-60.5,60C-75.6,45.4,-83.1,22.7,-82.9,0.2C-82.7,-22.3,-74.8,-44.6,-59.7,-61.4C-44.6,-78.2,-22.3,-89.5,-0.1,-89.4C22.1,-89.3,44.1,-77.7,60.1,-60.9Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-headline-lg text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            EduAdmin
          </h1>
          <p className="text-headline-md text-primary-fixed-dim max-w-md">
            Student Management made simple.
          </p>
        </div>
        <div className="relative z-10 text-primary-fixed text-body-sm">
          Providing modern administrative tools since 2024.
        </div>
      </div>

      {/* Right form panel */}
      <main className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 relative bg-surface">
        <div className="md:hidden w-full text-center mb-8">
          <h1 className="text-headline-md text-primary flex items-center justify-center gap-2 mb-2 font-bold">
            🎓 EduAdmin
          </h1>
          <p className="text-body-md text-on-surface-variant">Student Management made simple.</p>
        </div>
        <AuthForm />
        <div className="absolute bottom-6 text-body-sm text-outline">
          © 2026 EduAdmin. Student Management made simple.
        </div>
      </main>
    </div>
  );
}
