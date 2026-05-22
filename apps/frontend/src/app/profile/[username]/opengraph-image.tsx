import { ImageResponse } from 'next/og';
import { actionGetProfileByUsername } from '../../actions/auth';

export const alt = 'Profile Preview';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const AVATAR_MAP: Record<string, string> = {
  avatar_clown: '🤡',
  avatar_turtle: '🐢',
  avatar_trash: '🗑️',
  avatar_bug: '🐛',
  avatar_ghost: '👻',
  default_avatar: '👤'
};

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const response = await actionGetProfileByUsername(decodedUsername);

  if (!response.success || !response.data) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#0b0f19',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
          }}
        >
          User Not Found
        </div>
      ),
      { ...size }
    );
  }

  const profile = response.data;
  const avatarEmoji = AVATAR_MAP[profile.avatar] || '👤';
  const isPenalized = profile.logicViolations >= 5;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #030712 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 60,
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 40, marginRight: 15 }}>📉</span>
          <span style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: '-0.02em' }}>
            Reverse Startup
          </span>
        </div>

        {/* Profile Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: 40,
            flexGrow: 1,
            marginTop: 40,
            marginBottom: 40,
            position: 'relative',
          }}
        >
          {/* Avatar Area */}
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              marginRight: 40,
            }}
          >
            <span style={{ fontSize: 80 }}>{avatarEmoji}</span>
            {isPenalized && (
              <span
                style={{
                  position: 'absolute',
                  top: -45,
                  right: -30,
                  fontSize: 70,
                  transform: 'rotate(-15deg)',
                }}
              >
                🎩
              </span>
            )}
          </div>

          {/* User Details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 15 }}>
              {profile.username}
            </span>
            <div style={{ display: 'flex', gap: 30 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: '10px 20px',
                }}
              >
                <span style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Wasted Calories
                </span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                  {profile.wastedCalories} kcal
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: '10px 20px',
                }}
              >
                <span style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Logic Violations
                </span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
                  {profile.logicViolations}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 18 }}>
          <span>The Hall of Inefficiency</span>
          <span>reverse-startup.io</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
