import React from 'react'

/**
 * Alert Eye Electronics brand mark + lockup.
 *
 * The mark is a bullet / box CCTV camera, side-on and ceiling-mounted, with its
 * lens ring and status LED lit amber and two signal waves radiating from the
 * lens — a camera that is powered on and actively watching.
 *
 * Palette: navy #0b2a5b (brand) + amber #f5a623 (accent).
 */

type Tone = 'navy' | 'light' | 'auto'

const TONES: Record<Tone, { line: string; glass: string; accent: string; text: string }> = {
  // For light backgrounds (site header, admin light theme)
  navy: { line: '#0b2a5b', glass: '#0b2a5b', accent: '#f5a623', text: '#0b2a5b' },
  // For dark / navy backgrounds (footer, admin dark theme)
  light: { line: '#ffffff', glass: '#ffffff', accent: '#f5a623', text: '#ffffff' },
  // Inherit the surrounding text colour — for surfaces that theme-switch
  auto: { line: 'currentColor', glass: 'currentColor', accent: '#f5a623', text: 'currentColor' },
}

export const AlertEyeMark = ({
  size = 40,
  tone = 'navy',
  title = 'Alert Eye Electronics',
  ...rest
}: { size?: number; tone?: Tone; title?: string } & React.SVGProps<SVGSVGElement>) => {
  const c = TONES[tone]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>

      {/* ceiling + mounting arm */}
      <path d="M8 9H22" stroke={c.line} strokeWidth={3} strokeLinecap="round" />
      <path d="M15.5 9V16" stroke={c.line} strokeWidth={3.2} strokeLinecap="round" />

      {/* camera body */}
      <rect x="9" y="24" width="38" height="17" rx="8.5" stroke={c.line} strokeWidth={3.4} />

      {/* sun shade / visor, overhanging the lens */}
      <path
        d="M11 25.5C10 17 16 14.5 24 14.5H41C47 14.5 50.5 17 51 21.5"
        stroke={c.line}
        strokeWidth={3.2}
        strokeLinecap="round"
      />

      {/* status LED — powered on */}
      <circle cx="16.5" cy="31" r="3" fill={c.accent} opacity={0.22} />
      <circle cx="16.5" cy="31" r="1.5" fill={c.accent} />

      {/* lens housing with IR illuminators lit — watching */}
      <circle cx="40" cy="32.5" r="8" fill={c.accent} opacity={0.15} />
      <circle cx="40" cy="32.5" r="7.4" stroke={c.accent} strokeWidth={2.8} />
      <circle cx="40" cy="27.6" r="0.95" fill={c.accent} />
      <circle cx="44.9" cy="32.5" r="0.95" fill={c.accent} />
      <circle cx="40" cy="37.4" r="0.95" fill={c.accent} />
      <circle cx="35.1" cy="32.5" r="0.95" fill={c.accent} />
      <circle cx="40" cy="32.5" r="3.3" fill={c.glass} />
      <circle cx="40" cy="32.5" r="1.5" fill={c.accent} />

      {/* signal waves radiating from the lens */}
      <path
        d="M52 25a9 9 0 0 1 0 15"
        stroke={c.accent}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <path
        d="M56.5 20.5a15 15 0 0 1 0 24"
        stroke={c.accent}
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  )
}

type LogoProps = {
  size?: number
  tone?: Tone
  /** 'row' — name beside the mark. 'stacked' — name below the mark. */
  orientation?: 'row' | 'stacked'
  /** Show the lighter "Electronics" after "Alert Eye". */
  showElectronics?: boolean
  /** Show the "Always Alert, Always Watching" slogan. */
  showSlogan?: boolean
  className?: string
}

export const AlertEyeLogo = ({
  size = 36,
  tone = 'navy',
  orientation = 'row',
  showElectronics = true,
  showSlogan = false,
  className,
}: LogoProps) => {
  const c = TONES[tone]
  const stacked = orientation === 'stacked'

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? size * 0.18 : size * 0.28,
      }}
    >
      <AlertEyeMark size={size} tone={tone} />
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.05,
          alignItems: stacked ? 'center' : 'flex-start',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: size * (stacked ? 0.42 : 0.5),
            letterSpacing: '-0.01em',
            color: c.text,
            whiteSpace: 'nowrap',
          }}
        >
          Alert Eye
          {showElectronics && <span style={{ fontWeight: 600 }}> Electronics</span>}
        </span>
        {showSlogan && (
          <span
            style={{
              fontWeight: 600,
              fontSize: size * 0.22,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: c.accent,
              whiteSpace: 'nowrap',
            }}
          >
            Always Alert, Always Watching
          </span>
        )}
      </span>
    </span>
  )
}

export default AlertEyeLogo
