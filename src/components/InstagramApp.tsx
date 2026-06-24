import { useState } from 'react'
import { CASE, type InstagramPost } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'

function PostImage({ post }: { post: InstagramPost }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="ig-post__img ig-post__img--placeholder">
        (Legg bildet på {post.img})
      </div>
    )
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
        <div className="ig__bar">Instagram</div>
        {CASE.instagram.map((post) => (
          <article key={post.id} className="ig-post">
            <header className="ig-post__head">
              <span className="ig-post__avatar" aria-hidden>
                {post.author.charAt(0).toUpperCase()}
              </span>
              {post.author}
            </header>
            <PostImage post={post} />
            <div className="ig-post__meta">
              {post.likes != null && <div className="ig-post__likes">{post.likes} likerklikk</div>}
              <div>
                <strong>{post.author}</strong> {post.caption}
              </div>
              {post.postedLabel && (
                <div style={{ color: 'var(--shadow)', marginTop: 4 }}>{post.postedLabel}</div>
              )}
            </div>
          </article>
        ))}
      </div>
    </AppWindow>
  )
}
