import { useState } from 'react'
import { CASE, type LinkedInPost } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import { sfx } from '../lib/sfx'
import { useUnlock } from '../lib/UnlockContext'
import AppWindow from './AppWindow'

// Enkle SVG-ikoner i LinkedIn-stil (reaksjonsraden under hvert innlegg).
const LikeIcon = () => (
  <svg className="li-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 10v10H4V10z" />
    <path d="M7 10l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 16.7 20H7z" />
  </svg>
)
const CommentIcon = () => (
  <svg className="li-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
)
const ShareIcon = () => (
  <svg className="li-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M16 6l-4-4-4 4" />
    <path d="M12 2v14" />
  </svg>
)

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

function PostImage({ post }: { post: LinkedInPost }) {
  const [failed, setFailed] = useState(false)
  if (!post.img) return null
  if (failed) {
    return <div className="li-post__img li-post__img--placeholder">(Legg bildet på {post.img})</div>
  }
  return (
    <img
      className="li-post__img"
      src={assetUrl(post.img)}
      alt={post.text}
      onError={() => setFailed(true)}
    />
  )
}

function PostBody({ post }: { post: LinkedInPost }) {
  return (
    <>
      <header className="li-post__head">
        <span className="li-avatar">{initial(post.author)}</span>
        <span className="li-post__who">
          <span className="li-post__author">{post.author}</span>
          <span className="li-post__title">{post.authorTitle}</span>
          {post.postedLabel && <span className="li-post__time">{post.postedLabel} · 🌐</span>}
        </span>
      </header>

      <p className="li-post__text">{post.text}</p>

      <PostImage post={post} />

      {(post.likes != null || post.comments != null) && (
        <div className="li-post__stats">
          {post.likes != null && <span>👍 {post.likes}</span>}
          {post.comments != null && <span>{post.comments} kommentarer</span>}
        </div>
      )}

      <div className="li-post__actions">
        <span className="li-post__action">
          <LikeIcon /> Lik
        </span>
        <span className="li-post__action">
          <CommentIcon /> Kommenter
        </span>
        <span className="li-post__action">
          <ShareIcon /> Del
        </span>
      </div>
    </>
  )
}

export default function LinkedinApp() {
  const { isUnlocked } = useUnlock()
  // Poster uten `day` vises alltid; poster med `day` vises først når dagen er åpen.
  const posts = CASE.linkedin.filter((post) => post.day == null || isUnlocked(post.day))

  return (
    <AppWindow title="LinkedIn" icon="💼" variant="linkedin">
      <div className="li">
        <header className="li__topbar">
          <span className="li__logo" aria-hidden>
            in
          </span>
          <span className="li__search">Søk</span>
        </header>

        <div className="li__feed">
          {posts.map((post) =>
            post.link ? (
              // Bunn-posten ser ut som de andre, men åpner en ekte profil ved klikk.
              // Ekte <a> (ikke window.open) — unngår Firefox' COOP-blokk mot LinkedIn.
              <a
                key={post.id}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="li-post li-post--link"
                onClick={() => sfx.click()}
              >
                <PostBody post={post} />
              </a>
            ) : (
              <article key={post.id} className="li-post">
                <PostBody post={post} />
              </article>
            ),
          )}
        </div>
      </div>
    </AppWindow>
  )
}
