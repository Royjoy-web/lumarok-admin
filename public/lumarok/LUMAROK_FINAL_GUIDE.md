# LumaRoK Admin — Final Image Replacement Guide
> v0: Read and implement exactly as described. Do not redesign anything.

---

## ⛔ STRICT RULES
1. DO NOT redesign, restyle or recreate any icon or logo.
2. DO NOT wrap images in gradient boxes, coloured containers or decorative divs.
3. DO NOT add effects, shadows, borders or glow to image elements.
4. DO NOT substitute Lucide icons, SVGs or any other image. Use only the provided files.
5. DO NOT change layout, sizing classes or colours — only swap image sources.
6. One image file handles BOTH light and dark mode — no theme switching logic needed.

---

## ✅ WHAT V0 ALREADY DID — DO NOT TOUCH
- All files placed in `public/lumarok/`
- Sidebar icon replaced
- Topbar icon replaced
- Favicon/PWA files in place
- `manifest.json` updated

---

## 🔄 CHANGES TO MAKE NOW

### Step 1 — Overwrite all icon files
Copy everything from `final_package/` into `public/lumarok/` — same filenames, just overwrite.
**No code changes needed for icons.**

### Step 2 — Splash screen: replace with single universal image
File: `inapp/logo-splash.png` — 2400×1500, transparent bg, works on light + dark.

```tsx
// components/splash-screen.tsx
import Image from 'next/image'

<div className="relative z-10 flex flex-col items-center">
  <Image
    src="/lumarok/inapp/logo-splash.png"
    alt="LumaRoK Admin"
    width={600}
    height={375}
    priority
    className="object-contain"
  />
</div>
```

### Step 3 — Login page: replace with single universal image
File: `inapp/logo-login.png` — 1600×800, transparent bg, works on light + dark.

```tsx
// app/(auth)/login/page.tsx
import Image from 'next/image'

<div className="flex flex-col items-center mb-8">
  <Image
    src="/lumarok/inapp/logo-login.png"
    alt="LumaRoK Admin"
    width={400}
    height={200}
    priority
    className="object-contain"
  />
</div>
```

---

## FILE MAP

| File | Size | Location | Usage |
|---|---|---|---|
| `web/icon-light-32x32.png` | 32×32 | `/public/` | Favicon light mode |
| `web/icon-dark-32x32.png` | 32×32 | `/public/` | Favicon dark mode |
| `web/apple-icon.png` | 180×180 | `/public/` | iOS PWA icon |
| `web/pwa-192.png` | 192×192 | `/public/lumarok/web/` | PWA manifest |
| `web/pwa-512.png` | 512×512 | `/public/lumarok/web/` | PWA manifest |
| `inapp/logo-splash.png` | 2400×1500 | `/public/lumarok/inapp/` | Splash screen |
| `inapp/logo-login.png` | 1600×800 | `/public/lumarok/inapp/` | Login page |
| `inapp/logo-icon-sidebar.png` | 160×160 | `/public/lumarok/inapp/` | Sidebar @2x |
| `inapp/logo-icon-topbar.png` | 128×128 | `/public/lumarok/inapp/` | Topbar @2x |
| `android/icon-mdpi-48.png` | 48×48 | `mipmap-mdpi/` | Android |
| `android/icon-hdpi-72.png` | 72×72 | `mipmap-hdpi/` | Android |
| `android/icon-xhdpi-96.png` | 96×96 | `mipmap-xhdpi/` | Android |
| `android/icon-xxhdpi-144.png` | 144×144 | `mipmap-xxhdpi/` | Android |
| `android/icon-xxxhdpi-192.png` | 192×192 | `mipmap-xxxhdpi/` | Android |
| `android/icon-playstore-512.png` | 512×512 | Play Store | Android store listing |
| `ios/icon-60.png` | 60×60 | `AppIcon.appiconset/` | iPhone |
| `ios/icon-120.png` | 120×120 | `AppIcon.appiconset/` | iPhone retina |
| `ios/icon-180.png` | 180×180 | `AppIcon.appiconset/` | iPhone @3x |
| `ios/icon-appstore-1024.png` | 1024×1024 | App Store | iOS store listing |

---

*LumaRoK Admin — Final Package*
