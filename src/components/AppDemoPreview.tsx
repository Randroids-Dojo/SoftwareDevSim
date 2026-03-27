/**
 * AppDemoPreview — renders a phone-screen mockup of the app the team built.
 * Completion controls which features are visible.
 * Quality controls visual polish vs glitchiness.
 * The seed produces non-deterministic visual bugs from a pool of possibilities.
 */

interface AppDemoPreviewProps {
  appId: string
  completion: number // 0-1
  quality: number // 0-1
  seed: string
}

/** Simple seeded PRNG (mulberry32). Returns a function that yields 0-1 floats. */
function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i)
  }
  return () => {
    h |= 0
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick N items from an array using seeded randomness. */
function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, n)
}

export default function AppDemoPreview({ appId, completion, quality, seed }: AppDemoPreviewProps) {
  const rand = seededRandom(seed)

  if (completion < 0.4) {
    return (
      <PhoneFrame>
        <UnshippedScreen appId={appId} />
      </PhoneFrame>
    )
  }

  return (
    <PhoneFrame>
      {appId === 'todo' && <TodoAppMockup completion={completion} quality={quality} rand={rand} />}
      {appId === 'fitness' && (
        <FitnessAppMockup completion={completion} quality={quality} rand={rand} />
      )}
      {appId === 'ecommerce' && (
        <EcommerceAppMockup completion={completion} quality={quality} rand={rand} />
      )}
    </PhoneFrame>
  )
}

// --- Phone Frame ---

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[220px] h-[400px] bg-gray-950 rounded-[28px] border-[3px] border-gray-600 shadow-2xl overflow-hidden flex flex-col">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-950 rounded-b-xl z-20" />
      {/* Screen area */}
      <div className="flex-1 mt-5 mb-2 mx-1 rounded-b-[22px] overflow-hidden bg-white">
        {children}
      </div>
      {/* Home indicator */}
      <div className="mx-auto w-16 h-1 bg-gray-600 rounded-full mb-2" />
    </div>
  )
}

// --- Unshipped (< 40% completion) ---

function UnshippedScreen({ appId }: { appId: string }) {
  const appNames: Record<string, string> = {
    todo: 'TaskFlow',
    fitness: 'FitPulse',
    ecommerce: 'ShopWave',
  }
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 text-sm font-medium">{appNames[appId] ?? 'App'}</p>
      <p className="text-gray-400 text-xs mt-1">Coming Soon...</p>
      <div className="mt-6 w-full space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}

// --- Glitch helpers ---

type GlitchType =
  | 'misaligned'
  | 'lorem'
  | 'error-modal'
  | 'broken-image'
  | 'overflow'
  | 'wrong-color'

const ALL_GLITCHES: GlitchType[] = [
  'misaligned',
  'lorem',
  'error-modal',
  'broken-image',
  'overflow',
  'wrong-color',
]

function getActiveGlitches(quality: number, rand: () => number): Set<GlitchType> {
  // High quality = no glitches, low quality = many glitches
  if (quality > 0.6) return new Set()
  const count = quality < 0.3 ? 4 : 2
  return new Set(pickN(ALL_GLITCHES, count, rand))
}

function ErrorModal() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-3 mx-4 max-w-[180px]">
        <div className="text-red-500 text-xs font-bold mb-1">Error</div>
        <p className="text-gray-600 text-[10px] leading-tight">
          Unhandled exception: Cannot read property &apos;map&apos; of undefined
        </p>
        <div className="mt-2 bg-red-500 text-white text-[10px] text-center py-1 rounded">
          Dismiss
        </div>
      </div>
    </div>
  )
}

function BrokenImage() {
  return (
    <div className="w-full h-16 bg-gray-200 flex items-center justify-center border border-dashed border-gray-300">
      <span className="text-gray-400 text-[10px]">IMG_404.png</span>
    </div>
  )
}

// --- Todo App Mockup ---

function TodoAppMockup({
  completion,
  quality,
  rand,
}: {
  completion: number
  quality: number
  rand: () => number
}) {
  const glitches = getActiveGlitches(quality, rand)
  const isFull = completion >= 1
  const isSolid = completion >= 0.7

  const tasks = [
    { label: 'Set up CI pipeline', done: true },
    { label: 'Design landing page', done: true },
    { label: 'Write unit tests', done: isSolid },
    { label: 'Deploy to production', done: isFull },
    { label: 'User acceptance testing', done: isFull },
  ]

  return (
    <div className="h-full flex flex-col bg-white relative">
      {glitches.has('error-modal') && <ErrorModal />}

      {/* Header */}
      <div className={`px-3 py-2 ${glitches.has('wrong-color') ? 'bg-lime-500' : 'bg-indigo-600'}`}>
        <h3 className="text-white text-sm font-bold">
          {glitches.has('lorem') ? 'Lorem Ipsum' : 'TaskFlow'}
        </h3>
        <p className="text-indigo-200 text-[10px]">
          {tasks.filter((t) => t.done).length}/{tasks.length} completed
        </p>
      </div>

      {/* Task list */}
      <div
        className={`flex-1 overflow-hidden px-2 py-2 space-y-1.5 ${glitches.has('misaligned') ? 'ml-4' : ''}`}
      >
        {tasks.map((task, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 p-1.5 rounded text-[11px] ${
              task.done ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                task.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}
            >
              {task.done && <span className="text-white text-[8px]">✓</span>}
            </div>
            <span className={task.done ? 'text-gray-400 line-through' : 'text-gray-700'}>
              {task.label}
            </span>
          </div>
        ))}

        {glitches.has('broken-image') && (
          <div className="mt-2">
            <BrokenImage />
          </div>
        )}
      </div>

      {/* Add button */}
      {isSolid && (
        <div className="px-3 pb-2">
          <div
            className={`text-center py-1.5 rounded-full text-white text-xs font-medium ${
              glitches.has('wrong-color') ? 'bg-red-400' : 'bg-indigo-600'
            } ${glitches.has('overflow') ? 'text-[20px] py-4' : ''}`}
          >
            + Add Task
          </div>
        </div>
      )}
    </div>
  )
}

// --- Fitness Tracker Mockup ---

function FitnessAppMockup({
  completion,
  quality,
  rand,
}: {
  completion: number
  quality: number
  rand: () => number
}) {
  const glitches = getActiveGlitches(quality, rand)
  const isFull = completion >= 1
  const isSolid = completion >= 0.7

  // Activity ring percentages
  const move = isFull ? 87 : isSolid ? 62 : 34
  const exercise = isFull ? 92 : isSolid ? 55 : 20
  const stand = isFull ? 100 : isSolid ? 75 : 40

  return (
    <div className="h-full flex flex-col bg-gray-950 relative">
      {glitches.has('error-modal') && <ErrorModal />}

      {/* Header */}
      <div className="px-3 py-2">
        <h3
          className={`text-sm font-bold ${glitches.has('wrong-color') ? 'text-yellow-300' : 'text-white'}`}
        >
          {glitches.has('lorem') ? 'Dolor Sit' : 'FitPulse'}
        </h3>
        <p className="text-gray-500 text-[10px]">Today&apos;s Activity</p>
      </div>

      {/* Activity rings */}
      <div
        className={`flex justify-center py-3 ${glitches.has('misaligned') ? 'translate-x-6' : ''}`}
      >
        <div className="relative w-24 h-24">
          <ActivityRing
            percentage={move}
            color={glitches.has('wrong-color') ? '#facc15' : '#ef4444'}
            radius={44}
          />
          <ActivityRing
            percentage={exercise}
            color={glitches.has('wrong-color') ? '#a855f7' : '#22c55e'}
            radius={34}
          />
          <ActivityRing
            percentage={stand}
            color={glitches.has('wrong-color') ? '#f97316' : '#3b82f6'}
            radius={24}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex justify-around px-2 py-2 text-center">
        <StatBadge label="Move" value={`${move}%`} color="text-red-400" />
        <StatBadge label="Exercise" value={`${exercise}%`} color="text-green-400" />
        <StatBadge label="Stand" value={`${stand}%`} color="text-blue-400" />
      </div>

      {/* Workout list */}
      {isSolid && (
        <div className="flex-1 px-2 py-1 space-y-1.5 overflow-hidden">
          <p className="text-gray-400 text-[10px] font-medium px-1">Recent Workouts</p>
          <WorkoutRow icon="🏃" label="Morning Run" detail="5.2 km — 28 min" />
          {isFull && <WorkoutRow icon="🏋️" label="Strength" detail="45 min — 320 cal" />}
          {glitches.has('broken-image') && <BrokenImage />}
        </div>
      )}

      {/* Bottom nav */}
      {isSolid && (
        <div
          className={`flex justify-around py-2 border-t border-gray-800 text-[10px] text-gray-500 ${glitches.has('overflow') ? 'text-lg py-6' : ''}`}
        >
          <span className="text-blue-400">Today</span>
          <span>History</span>
          {isFull && <span>Profile</span>}
        </div>
      )}
    </div>
  )
}

function ActivityRing({
  percentage,
  color,
  radius,
}: {
  percentage: number
  color: string
  radius: number
}) {
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage / 100)
  const size = 96

  return (
    <svg
      className="absolute top-0 left-0"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={6}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-gray-500 text-[9px]">{label}</div>
    </div>
  )
}

function WorkoutRow({ icon, label, detail }: { icon: string; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1.5">
      <span className="text-sm">{icon}</span>
      <div>
        <div className="text-white text-[10px] font-medium">{label}</div>
        <div className="text-gray-500 text-[9px]">{detail}</div>
      </div>
    </div>
  )
}

// --- E-Commerce Mockup ---

function EcommerceAppMockup({
  completion,
  quality,
  rand,
}: {
  completion: number
  quality: number
  rand: () => number
}) {
  const glitches = getActiveGlitches(quality, rand)
  const isFull = completion >= 1
  const isSolid = completion >= 0.7

  const products = [
    { name: 'Wireless Headphones', price: '$79.99', color: 'bg-blue-100' },
    { name: 'Smart Watch', price: '$199.99', color: 'bg-purple-100' },
    { name: 'USB-C Hub', price: '$34.99', color: 'bg-green-100' },
    { name: 'Mech Keyboard', price: '$129.99', color: 'bg-orange-100' },
  ]

  const visibleProducts = isFull ? products : isSolid ? products.slice(0, 3) : products.slice(0, 2)

  return (
    <div className="h-full flex flex-col bg-white relative">
      {glitches.has('error-modal') && <ErrorModal />}

      {/* Header */}
      <div className={`px-3 py-2 ${glitches.has('wrong-color') ? 'bg-pink-500' : 'bg-gray-900'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-bold">
            {glitches.has('lorem') ? 'Amet Consectetur' : 'ShopWave'}
          </h3>
          {isSolid && (
            <div className="bg-white/20 rounded-full px-2 py-0.5 text-white text-[9px]">
              Cart (2)
            </div>
          )}
        </div>
        {isSolid && (
          <div className="mt-1.5 bg-white/10 rounded-full px-2 py-1 text-gray-400 text-[10px]">
            Search products...
          </div>
        )}
      </div>

      {/* Product grid */}
      <div
        className={`flex-1 overflow-hidden px-2 py-2 ${glitches.has('misaligned') ? 'rotate-1' : ''}`}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {visibleProducts.map((product, i) => (
            <div key={i} className="bg-gray-50 rounded-lg overflow-hidden">
              {glitches.has('broken-image') && i === 0 ? (
                <div className="h-14 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-[8px]">IMG_404</span>
                </div>
              ) : (
                <div className={`h-14 ${product.color} flex items-center justify-center`}>
                  <div className="w-8 h-8 bg-white/60 rounded-lg" />
                </div>
              )}
              <div className="p-1.5">
                <div
                  className={`text-[9px] font-medium text-gray-800 truncate ${glitches.has('overflow') ? 'text-xs whitespace-normal' : ''}`}
                >
                  {product.name}
                </div>
                <div className="text-[10px] font-bold text-gray-900">{product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      {isFull && (
        <div className="px-2 pb-2">
          <div
            className={`text-center py-1.5 rounded-lg text-white text-[11px] font-medium ${
              glitches.has('wrong-color') ? 'bg-lime-500' : 'bg-gray-900'
            }`}
          >
            Checkout — $314.97
          </div>
        </div>
      )}

      {/* Bottom nav */}
      {isSolid && (
        <div
          className={`flex justify-around py-1.5 border-t border-gray-100 text-[10px] text-gray-400 ${glitches.has('overflow') ? 'text-sm py-4' : ''}`}
        >
          <span className="text-gray-900 font-medium">Shop</span>
          <span>Categories</span>
          {isFull && <span>Account</span>}
        </div>
      )}
    </div>
  )
}
