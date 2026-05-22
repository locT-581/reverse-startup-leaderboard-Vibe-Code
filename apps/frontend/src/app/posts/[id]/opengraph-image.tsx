import { ImageResponse } from 'next/og';
import { actionGetPostById } from '../../actions/posts';

export const alt = 'Post Preview';
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

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await actionGetPostById(id);

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
          Post Not Found
        </div>
      ),
      { ...size }
    );
  }

  const post = response.data;
  const avatarEmoji = AVATAR_MAP[post.author.avatar] || '👤';
  const isAuthorPenalized = post.author.logicViolations >= 5;

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
            SnakeLegs
          </span>
        </div>

        {/* Post Details Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: 40,
            flexGrow: 1,
            marginTop: 30,
            marginBottom: 30,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 'bold',
                lineHeight: 1.2,
                color: '#ffffff',
                marginBottom: 15,
              }}
            >
              {post.title}
            </span>
            <span
              style={{
                fontSize: 20,
                lineHeight: 1.5,
                color: '#cbd5e1',
                maxHeight: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {post.content.length > 250 ? `${post.content.substring(0, 250)}...` : post.content}
            </span>
          </div>

          {/* Author info footer inside card */}
          <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20 }}>
            {/* Avatar container */}
            <div
              style={{
                position: 'relative',
                width: 70,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                marginRight: 20,
              }}
            >
              <span style={{ fontSize: 40 }}>{avatarEmoji}</span>
              {isAuthorPenalized && (
                <span
                  style={{
                    position: 'absolute',
                    top: -22,
                    right: -14,
                    fontSize: 34,
                    transform: 'rotate(-15deg)',
                  }}
                >
                  🎩
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#f1f5f9' }}>
                {post.author.username} {isAuthorPenalized && '🤡'}
              </span>
              <span style={{ fontSize: 16, color: '#94a3b8' }}>
                Wasted <strong style={{ color: '#10b981' }}>{post.wastedCalories} kcal</strong> on this paradigm
              </span>
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
