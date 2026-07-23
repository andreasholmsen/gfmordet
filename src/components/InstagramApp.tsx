import { useState } from 'react'
import { CASE, type InstagramPost } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'
import StoriesBar from './StoriesBar'

// Enkle, krappe SVG-ikoner i samme stil som dagens Instagram-app.
const HeartIcon = () => (
  <svg className="ig-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)
const CommentIcon = () => (
  <svg className="ig-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
)
const ShareIcon = () => (
  <svg className="ig-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7z" />
  </svg>
)
const BookmarkIcon = () => (
  <svg className="ig-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

function PostImage({ post }: { post: InstagramPost }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="ig-post__img ig-post__img--placeholder">(Legg bildet på {post.img})</div>
  }
  return (
    <img
      className="ig-post__img"
      src={assetUrl(post.img)}
      alt={post.caption}
      onError={() => setFailed(true)}
    />
  )
}

export default function InstagramApp() {
  return (
    <AppWindow title="Instagram" icon="📷" variant="instagram">
      <div className="ig">
        <header className="ig__topbar">
          <span className="ig__logo">Instagram</span>
          <span className="ig__topicons">
            <HeartIcon />
            <ShareIcon />
          </span>
        </header>

        {/* Ekte, live stories fra spillerne (opplasting + visning). */}
        <StoriesBar />

        <div className="ig__feed">
          {CASE.instagram.map((post) => (
            <article key={post.id} className="ig-post">
              <header className="ig-post__head">
                <span className="ig-post__avatar-ring">
                  <span className="ig-avatar ig-avatar--sm">{initial(post.author)}</span>
                </span>
                <span className="ig-post__author">{post.author}</span>
                <button className="ig-post__more" aria-label="Mer" type="button">
                  ⋯
                </button>
              </header>

              <PostImage post={post} />

              <div className="ig-post__actions">
                <div className="ig-post__actions-left">
                  <HeartIcon />
                  <CommentIcon />
                  <ShareIcon />
                </div>
                <BookmarkIcon />
              </div>

              <div className="ig-post__meta">
                {post.likes != null && (
                  <div className="ig-post__likes">{post.likes} likerklikk</div>
                )}
                <div className="ig-post__caption">
                  <strong>{post.author}</strong> {post.caption}
                </div>
                {post.postedLabel && <div className="ig-post__time">{post.postedLabel}</div>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppWindow>
  )
}
